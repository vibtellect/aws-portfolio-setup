import boto3
import json
import os
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Any, Optional

def lambda_handler(event, context):
    """
    AWS Lambda function for Free Tier usage monitoring and alerts.
    
    This function:
    1. Monitors Free Tier usage across key services
    2. Sends SNS alerts when thresholds are exceeded
    3. Logs results to CloudWatch
    
    Environment Variables:
    - SNS_TOPIC_ARN: ARN of the SNS topic for alerts
    - WARNING_THRESHOLD: Warning threshold percentage (default: 75)
    - CRITICAL_THRESHOLD: Critical threshold percentage (default: 90)
    - REGION: AWS region for monitoring (default: eu-central-1)
    """
    
    # Configuration
    sns_topic_arn = os.environ.get('SNS_TOPIC_ARN')
    warning_threshold = float(os.environ.get('WARNING_THRESHOLD', 75))
    critical_threshold = float(os.environ.get('CRITICAL_THRESHOLD', 90))
    region = os.environ.get('REGION', 'eu-central-1')
    
    # Initialize clients
    ce_client = boto3.client('ce', region_name='us-east-1')  # Cost Explorer only in us-east-1
    sns_client = boto3.client('sns')
    
    print(f"Starting Free Tier monitoring - Warning: {warning_threshold}%, Critical: {critical_threshold}%")
    
    try:
        # Get current month date range
        current_month_start = datetime.now(timezone.utc).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        next_month_start = (current_month_start + timedelta(days=32)).replace(day=1)
        
        # Get Free Tier usage
        usage_data = get_free_tier_usage(ce_client, current_month_start, next_month_start)
        
        if not usage_data:
            print("No Free Tier usage data available")
            return {
                'statusCode': 200,
                'body': json.dumps({'message': 'No usage data available'})
            }
        
        # Analyze usage
        analysis = analyze_usage(usage_data, warning_threshold, critical_threshold)
        
        # Log analysis results
        print(f"Analysis complete: {len(analysis['critical'])} critical, {len(analysis['warning'])} warning")
        
        # Send alerts if needed
        alerts_sent = 0
        if analysis['critical'] or analysis['warning']:
            if sns_topic_arn:
                send_alert(sns_client, sns_topic_arn, analysis)
                alerts_sent = 1
            else:
                print("WARNING: No SNS topic ARN configured - skipping alert")
        
        # Return response
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Free Tier monitoring completed',
                'critical_services': len(analysis['critical']),
                'warning_services': len(analysis['warning']),
                'total_services': analysis['total_services'],
                'alerts_sent': alerts_sent,
                'timestamp': analysis['timestamp']
            })
        }
        
    except Exception as e:
        print(f"Error in Free Tier monitoring: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }

def get_free_tier_usage(ce_client, start_date, end_date) -> List[Dict]:
    """Get Free Tier usage data."""
    try:
        # Try to use Free Tier API first
        response = ce_client.get_free_tier_usage(
            TimePeriod={
                'Start': start_date.strftime('%Y-%m-%d'),
                'End': end_date.strftime('%Y-%m-%d')
            }
        )
        return response.get('FreeTierUsages', [])
    except Exception as e:
        print(f"Free Tier API not available: {e}")
        # Fallback to Cost Explorer analysis
        return get_usage_via_cost_explorer(ce_client, start_date, end_date)

def get_usage_via_cost_explorer(ce_client, start_date, end_date) -> List[Dict]:
    """Fallback method using Cost Explorer."""
    services = [
        'Amazon Elastic Compute Cloud - Compute',
        'Amazon Relational Database Service',
        'Amazon Simple Storage Service',
        'AWS Lambda'
    ]
    
    usages = []
    for service in services:
        try:
            response = ce_client.get_cost_and_usage(
                TimePeriod={
                    'Start': start_date.strftime('%Y-%m-%d'),
                    'End': end_date.strftime('%Y-%m-%d')
                },
                Granularity='MONTHLY',
                Metrics=['UsageQuantity'],
                GroupBy=[{'Type': 'DIMENSION', 'Key': 'USAGE_TYPE'}],
                Filter={
                    'Dimensions': {
                        'Key': 'SERVICE',
                        'Values': [service],
                        'MatchOptions': ['EQUALS']
                    }
                }
            )
            
            for result in response['ResultsByTime']:
                for group in result['Groups']:
                    usage_type = group['Keys'][0]
                    amount = float(group['Metrics']['UsageQuantity']['Amount'])
                    
                    # Only include significant usage
                    if amount > 0:
                        usages.append({
                            'Service': service,
                            'Operation': 'Unknown',
                            'UsageType': usage_type,
                            'ActualUsageAmount': str(amount),
                            'ForecastedUsageAmount': str(amount * 1.1),
                            'FreeTierLimit': str(get_free_tier_limit(service, usage_type)),
                            'Unit': get_usage_unit(usage_type)
                        })
        except Exception as e:
            print(f"Error getting usage for {service}: {e}")
            continue
    
    return usages

def get_free_tier_limit(service: str, usage_type: str) -> float:
    """Get Free Tier limits for known services."""
    limits = {
        'Amazon Elastic Compute Cloud - Compute': {
            'BoxUsage:t2.micro': 750,
            'BoxUsage:t3.micro': 750,
            'EBS:VolumeUsage.gp2': 30,
            'DataTransfer-Out-Bytes': 15000000000  # 15 GB
        },
        'Amazon Relational Database Service': {
            'InstanceUsage:db.t3.micro': 750,
            'StorageUsage': 20
        },
        'Amazon Simple Storage Service': {
            'TimedStorage-ByteHrs': 5000000000,  # 5 GB
            'Requests-Tier1': 20000,
            'Requests-Tier2': 2000
        },
        'AWS Lambda': {
            'Request': 1000000,
            'Lambda-GB-Second': 400000
        }
    }
    
    service_limits = limits.get(service, {})
    for pattern, limit in service_limits.items():
        if pattern in usage_type:
            return limit
    return 0

def get_usage_unit(usage_type: str) -> str:
    """Get appropriate unit for usage type."""
    if 'Hour' in usage_type or 'hrs' in usage_type:
        return 'Hrs'
    elif 'Request' in usage_type:
        return 'Count'
    elif 'Bytes' in usage_type or 'Storage' in usage_type:
        return 'GB'
    else:
        return 'Count'

def analyze_usage(usage_data: List[Dict], warning_threshold: float, critical_threshold: float) -> Dict:
    """Analyze usage data and categorize by severity."""
    analysis = {
        'critical': [],
        'warning': [],
        'ok': [],
        'total_services': len(usage_data),
        'timestamp': datetime.now(timezone.utc).isoformat()
    }
    
    for usage in usage_data:
        service = usage.get('Service', 'Unknown')
        usage_type = usage.get('UsageType', 'Unknown')
        
        actual = float(usage.get('ActualUsageAmount', 0))
        forecast = float(usage.get('ForecastedUsageAmount', 0))
        limit = float(usage.get('FreeTierLimit', 1))
        unit = usage.get('Unit', 'Count')
        
        if limit == 0:
            continue
        
        current_pct = (actual / limit) * 100
        forecast_pct = (forecast / limit) * 100
        
        usage_info = {
            'service': service,
            'usage_type': usage_type,
            'actual_usage': actual,
            'forecasted_usage': forecast,
            'limit': limit,
            'unit': unit,
            'current_percentage': current_pct,
            'forecast_percentage': forecast_pct,
            'remaining': limit - actual
        }
        
        if current_pct >= critical_threshold:
            analysis['critical'].append(usage_info)
        elif current_pct >= warning_threshold:
            analysis['warning'].append(usage_info)
        else:
            analysis['ok'].append(usage_info)
    
    return analysis

def send_alert(sns_client, topic_arn: str, analysis: Dict):
    """Send SNS alert with usage information."""
    critical_count = len(analysis['critical'])
    warning_count = len(analysis['warning'])
    
    subject = f"🚨 Free Tier Alert: {critical_count} Critical, {warning_count} Warning"
    
    # Build message
    message_parts = [
        "🎯 AWS FREE TIER USAGE ALERT",
        "=" * 40,
        f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC')}",
        f"Total Services Monitored: {analysis['total_services']}",
        ""
    ]
    
    # Critical issues
    if analysis['critical']:
        message_parts.extend([
            "🔴 CRITICAL USAGE (>90%)",
            "-" * 30
        ])
        for item in analysis['critical']:
            message_parts.extend([
                f"Service: {item['service']}",
                f"Usage Type: {item['usage_type']}",
                f"Current: {item['actual_usage']:,.1f} / {item['limit']:,.0f} {item['unit']} ({item['current_percentage']:.1f}%)",
                f"Forecast: {item['forecasted_usage']:,.1f} {item['unit']} ({item['forecast_percentage']:.1f}%)",
                ""
            ])
            if item['forecast_percentage'] > 100:
                overage = item['forecasted_usage'] - item['limit']
                message_parts.append(f"⚠️  OVERAGE FORECAST: {overage:,.1f} {item['unit']}")
                message_parts.append("")
    
    # Warning issues
    if analysis['warning']:
        message_parts.extend([
            "🟡 WARNING USAGE (75-90%)",
            "-" * 30
        ])
        for item in analysis['warning']:
            message_parts.extend([
                f"Service: {item['service']}",
                f"Usage Type: {item['usage_type']}",
                f"Current: {item['actual_usage']:,.1f} / {item['limit']:,.0f} {item['unit']} ({item['current_percentage']:.1f}%)",
                ""
            ])
    
    # Summary
    message_parts.extend([
        "📊 SUMMARY",
        "-" * 20,
        f"🔴 Critical: {critical_count}",
        f"🟡 Warning: {warning_count}",
        f"🟢 OK: {len(analysis['ok'])}"
    ])
    
    if critical_count > 0:
        message_parts.extend([
            "",
            "⚡ IMMEDIATE ACTIONS REQUIRED:",
            "- Review critical services immediately",
            "- Consider stopping non-essential resources",
            "- Monitor usage hourly until resolved"
        ])
    
    message = "\n".join(message_parts)
    
    try:
        sns_client.publish(
            TopicArn=topic_arn,
            Subject=subject,
            Message=message
        )
        print(f"Alert sent to SNS topic: {topic_arn}")
    except Exception as e:
        print(f"Failed to send SNS alert: {e}")
        raise