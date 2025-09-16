#!/usr/bin/env python3
"""
AWS Free Tier Monitoring Script
===============================
Monitors AWS Free Tier usage across all services and provides alerts
for usage above defined thresholds.

Requirements:
- boto3
- AWS CLI configured with appropriate permissions
- Works for accounts created before July 15, 2025
"""

import boto3
import json
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Any, Optional
import argparse
import sys
import logging
import os

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class FreeTierMonitor:
    def __init__(self):
        """Initialize the Free Tier monitor with AWS clients."""
        try:
            # Cost Explorer must use us-east-1
            self.ce_client = boto3.client('ce', region_name='us-east-1')
            self.sns_client = boto3.client('sns')
            self.current_month_start = datetime.now(timezone.utc).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            self.next_month_start = (self.current_month_start + timedelta(days=32)).replace(day=1)
        except Exception as e:
            logger.error(f"Failed to initialize AWS clients: {e}")
            sys.exit(1)

    def get_free_tier_usage(self) -> List[Dict]:
        """
        Get current Free Tier usage for the current month.
        Returns structured data for all Free Tier eligible services.
        """
        try:
            response = self.ce_client.get_free_tier_usage(
                TimePeriod={
                    'Start': self.current_month_start.strftime('%Y-%m-%d'),
                    'End': self.next_month_start.strftime('%Y-%m-%d')
                }
            )
            return response.get('FreeTierUsages', [])
        except Exception as e:
            logger.warning(f"Free Tier API not available: {e}")
            # Fallback to manual cost analysis
            return self._get_usage_via_cost_explorer()

    def _get_usage_via_cost_explorer(self) -> List[Dict]:
        """Fallback method using Cost Explorer for older accounts."""
        try:
            # Get usage for key Free Tier services
            services = [
                'Amazon Elastic Compute Cloud - Compute',
                'Amazon Relational Database Service',
                'Amazon Simple Storage Service',
                'AWS Lambda'
            ]
            
            usages = []
            for service in services:
                response = self.ce_client.get_cost_and_usage(
                    TimePeriod={
                        'Start': self.current_month_start.strftime('%Y-%m-%d'),
                        'End': self.next_month_start.strftime('%Y-%m-%d')
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
                        
                        # Map to Free Tier format
                        usages.append({
                            'Service': service,
                            'Operation': 'Unknown',
                            'UsageType': usage_type,
                            'ActualUsageAmount': str(amount),
                            'ForecastedUsageAmount': str(amount * 1.1),  # Rough forecast
                            'FreeTierLimit': str(self._get_free_tier_limit(service, usage_type)),
                            'Unit': self._get_usage_unit(usage_type)
                        })
            
            return usages
        except Exception as e:
            logger.error(f"Failed to get usage via Cost Explorer: {e}")
            return []

    def _get_free_tier_limit(self, service: str, usage_type: str) -> float:
        """Get Free Tier limits for known services."""
        limits = {
            'Amazon Elastic Compute Cloud - Compute': {
                'BoxUsage:t2.micro': 750,
                'BoxUsage:t3.micro': 750,
                'EBS:VolumeUsage.gp2': 30,
                'DataTransfer-Out-Bytes': 15000000000  # 15 GB in bytes
            },
            'Amazon Relational Database Service': {
                'InstanceUsage:db.t3.micro': 750,
                'RDS:StorageUsage': 20
            },
            'Amazon Simple Storage Service': {
                'TimedStorage-ByteHrs': 5000000000,  # 5 GB in bytes
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

    def _get_usage_unit(self, usage_type: str) -> str:
        """Get appropriate unit for usage type."""
        if 'Hour' in usage_type or 'hrs' in usage_type:
            return 'Hrs'
        elif 'Request' in usage_type:
            return 'Count'
        elif 'Bytes' in usage_type or 'Storage' in usage_type:
            return 'GB'
        else:
            return 'Count'

    def analyze_usage(self, usage_data: List[Dict]) -> Dict:
        """Analyze usage data and categorize by severity."""
        analysis = {
            'critical': [],  # > 90%
            'warning': [],   # 75-90%
            'ok': [],        # < 75%
            'total_services': len(usage_data),
            'timestamp': datetime.now(timezone.utc).isoformat()
        }
        
        for usage in usage_data:
            service = usage.get('Service', 'Unknown')
            operation = usage.get('Operation', 'Unknown')
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
                'operation': operation,
                'usage_type': usage_type,
                'actual_usage': actual,
                'forecasted_usage': forecast,
                'limit': limit,
                'unit': unit,
                'current_percentage': current_pct,
                'forecast_percentage': forecast_pct,
                'remaining': limit - actual
            }
            
            if current_pct >= 90:
                analysis['critical'].append(usage_info)
            elif current_pct >= 75:
                analysis['warning'].append(usage_info)
            else:
                analysis['ok'].append(usage_info)
        
        return analysis

    def generate_report(self, analysis: Dict, format_type: str = 'text') -> str:
        """Generate formatted report from analysis."""
        if format_type == 'json':
            return json.dumps(analysis, indent=2)
        
        # Text format
        report = []
        report.append("🎯 AWS FREE TIER USAGE REPORT")
        report.append("=" * 50)
        report.append(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        report.append(f"Total Services Monitored: {analysis['total_services']}")
        report.append("")
        
        # Critical issues
        if analysis['critical']:
            report.append("🔴 CRITICAL USAGE (>90%)")
            report.append("-" * 30)
            for item in analysis['critical']:
                report.append(f"Service: {item['service']}")
                report.append(f"Usage Type: {item['usage_type']}")
                report.append(f"Current: {item['actual_usage']:,.1f} / {item['limit']:,.0f} {item['unit']} ({item['current_percentage']:.1f}%)")
                report.append(f"Forecast: {item['forecasted_usage']:,.1f} {item['unit']} ({item['forecast_percentage']:.1f}%)")
                if item['forecast_percentage'] > 100:
                    overage = item['forecasted_usage'] - item['limit']
                    report.append(f"⚠️  OVERAGE FORECAST: {overage:,.1f} {item['unit']}")
                report.append("")
        
        # Warnings
        if analysis['warning']:
            report.append("🟡 WARNING USAGE (75-90%)")
            report.append("-" * 30)
            for item in analysis['warning']:
                report.append(f"Service: {item['service']}")
                report.append(f"Usage Type: {item['usage_type']}")
                report.append(f"Current: {item['actual_usage']:,.1f} / {item['limit']:,.0f} {item['unit']} ({item['current_percentage']:.1f}%)")
                report.append("")
        
        # Summary
        critical_count = len(analysis['critical'])
        warning_count = len(analysis['warning'])
        ok_count = len(analysis['ok'])
        
        report.append("📊 SUMMARY")
        report.append("-" * 20)
        report.append(f"🔴 Critical: {critical_count}")
        report.append(f"🟡 Warning: {warning_count}")
        report.append(f"🟢 OK: {ok_count}")
        
        if critical_count > 0:
            report.append("")
            report.append("⚡ RECOMMENDATIONS:")
            report.append("- Review critical services immediately")
            report.append("- Consider resource optimization")
            report.append("- Monitor usage daily until resolved")
        
        return "\n".join(report)

    def send_alert(self, analysis: Dict, sns_topic_arn: Optional[str] = None):
        """Send alert via SNS if thresholds are exceeded."""
        critical_count = len(analysis['critical'])
        warning_count = len(analysis['warning'])
        
        if critical_count == 0 and warning_count == 0:
            logger.info("No alerts needed - all usage within safe limits")
            return
        
        if not sns_topic_arn:
            logger.warning("No SNS topic ARN provided - skipping alert")
            return
        
        subject = f"🚨 Free Tier Alert: {critical_count} Critical, {warning_count} Warning"
        message = self.generate_report(analysis)
        
        try:
            self.sns_client.publish(
                TopicArn=sns_topic_arn,
                Subject=subject,
                Message=message
            )
            logger.info(f"Alert sent to SNS topic: {sns_topic_arn}")
        except Exception as e:
            logger.error(f"Failed to send SNS alert: {e}")

    def save_report(self, report: str, filename: Optional[str] = None):
        """Save report to file."""
        if not filename:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f"free_tier_report_{timestamp}.txt"
        
        filepath = os.path.join('/tmp', filename)
        try:
            with open(filepath, 'w') as f:
                f.write(report)
            logger.info(f"Report saved to: {filepath}")
            return filepath
        except Exception as e:
            logger.error(f"Failed to save report: {e}")
            return None

def main():
    parser = argparse.ArgumentParser(description='AWS Free Tier Monitoring Tool')
    parser.add_argument('--format', choices=['text', 'json'], default='text',
                        help='Output format')
    parser.add_argument('--output', help='Output file path')
    parser.add_argument('--sns-topic', help='SNS Topic ARN for alerts')
    parser.add_argument('--quiet', action='store_true',
                        help='Only output critical issues')
    parser.add_argument('--threshold', type=int, default=75,
                        help='Alert threshold percentage (default: 75)')
    
    args = parser.parse_args()
    
    # Initialize monitor
    monitor = FreeTierMonitor()
    
    # Get usage data
    logger.info("Fetching Free Tier usage data...")
    usage_data = monitor.get_free_tier_usage()
    
    if not usage_data:
        logger.error("No usage data available")
        sys.exit(1)
    
    # Analyze usage
    analysis = monitor.analyze_usage(usage_data)
    
    # Generate report
    report = monitor.generate_report(analysis, args.format)
    
    # Output handling
    if args.output:
        monitor.save_report(report, args.output)
    elif not args.quiet:
        print(report)
    elif analysis['critical']:
        print(f"🔴 CRITICAL: {len(analysis['critical'])} services over 90% usage")
        for item in analysis['critical']:
            print(f"- {item['service']}: {item['current_percentage']:.1f}%")
    
    # Send alerts if configured
    if args.sns_topic and (analysis['critical'] or analysis['warning']):
        monitor.send_alert(analysis, args.sns_topic)
    
    # Exit with error code if critical issues found
    if analysis['critical']:
        sys.exit(2)
    elif analysis['warning']:
        sys.exit(1)
    else:
        sys.exit(0)

if __name__ == "__main__":
    main()