#!/usr/bin/env python3
"""
S3 Lifecycle Management Lambda Function
Optimizes S3 storage costs through automated lifecycle policies and cleanup
"""

import json
import boto3
import logging
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional, Any
import os

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# AWS Clients
s3_client = boto3.client('s3')
sns_client = boto3.client('sns')
cloudwatch = boto3.client('cloudwatch')

# Configuration from environment variables
SNS_TOPIC_ARN = os.environ.get('SNS_TOPIC_ARN')
DRY_RUN = os.environ.get('DRY_RUN', 'true').lower() == 'true'
LIFECYCLE_DAYS_IA = int(os.environ.get('LIFECYCLE_DAYS_IA', '30'))  # Days to Standard-IA
LIFECYCLE_DAYS_GLACIER = int(os.environ.get('LIFECYCLE_DAYS_GLACIER', '90'))  # Days to Glacier
LIFECYCLE_DAYS_DEEP_ARCHIVE = int(os.environ.get('LIFECYCLE_DAYS_DEEP_ARCHIVE', '365'))  # Days to Deep Archive
DELETE_INCOMPLETE_UPLOADS_DAYS = int(os.environ.get('DELETE_INCOMPLETE_UPLOADS_DAYS', '7'))
DELETE_OLD_VERSIONS_DAYS = int(os.environ.get('DELETE_OLD_VERSIONS_DAYS', '90'))

class S3LifecycleOptimizer:
    """Manages S3 lifecycle policies and storage optimization"""
    
    def __init__(self):
        self.total_savings_estimate = 0
        self.actions_taken = []
        self.errors = []
        
    def lambda_handler(self, event: Dict[str, Any], context: Any) -> Dict[str, Any]:
        """Main Lambda handler function"""
        try:
            logger.info("Starting S3 Lifecycle Optimization")
            
            # Get all S3 buckets
            buckets = self.get_all_buckets()
            
            results = {
                'total_buckets_processed': 0,
                'lifecycle_policies_created': 0,
                'incomplete_uploads_cleaned': 0,
                'empty_buckets_identified': 0,
                'total_estimated_savings': 0,
                'actions_taken': [],
                'errors': [],
                'dry_run': DRY_RUN
            }
            
            for bucket_name in buckets:
                try:
                    logger.info(f"Processing bucket: {bucket_name}")
                    
                    # Analyze bucket and optimize lifecycle
                    bucket_result = self.optimize_bucket_lifecycle(bucket_name)
                    
                    # Update results
                    results['total_buckets_processed'] += 1
                    if bucket_result.get('lifecycle_policy_created'):
                        results['lifecycle_policies_created'] += 1
                    if bucket_result.get('incomplete_uploads_cleaned'):
                        results['incomplete_uploads_cleaned'] += 1
                    if bucket_result.get('empty_bucket'):
                        results['empty_buckets_identified'] += 1
                    
                    results['actions_taken'].extend(bucket_result.get('actions', []))
                    
                except Exception as e:
                    error_msg = f"Error processing bucket {bucket_name}: {str(e)}"
                    logger.error(error_msg)
                    results['errors'].append(error_msg)
            
            # Calculate total savings estimate
            results['total_estimated_savings'] = self.total_savings_estimate
            
            # Send notifications
            if SNS_TOPIC_ARN and (results['actions_taken'] or results['errors']):
                self.send_notification(results)
            
            # Send CloudWatch metrics
            self.send_cloudwatch_metrics(results)
            
            logger.info("S3 Lifecycle Optimization completed successfully")
            return {
                'statusCode': 200,
                'body': json.dumps(results)
            }
            
        except Exception as e:
            logger.error(f"Lambda execution failed: {str(e)}")
            return {
                'statusCode': 500,
                'body': json.dumps({
                    'error': str(e),
                    'dry_run': DRY_RUN
                })
            }
    
    def get_all_buckets(self) -> List[str]:
        """Get list of all S3 buckets"""
        try:
            response = s3_client.list_buckets()
            return [bucket['Name'] for bucket in response.get('Buckets', [])]
        except Exception as e:
            logger.error(f"Failed to list buckets: {str(e)}")
            return []
    
    def optimize_bucket_lifecycle(self, bucket_name: str) -> Dict[str, Any]:
        """Optimize lifecycle policy for a specific bucket"""
        result = {
            'bucket_name': bucket_name,
            'actions': [],
            'lifecycle_policy_created': False,
            'incomplete_uploads_cleaned': False,
            'empty_bucket': False
        }
        
        try:
            # Check if bucket is empty
            if self.is_bucket_empty(bucket_name):
                result['empty_bucket'] = True
                result['actions'].append(f"Bucket {bucket_name} is empty - consider deletion")
                logger.info(f"Bucket {bucket_name} is empty")
                return result
            
            # Get bucket location for regional considerations
            bucket_location = self.get_bucket_location(bucket_name)
            
            # Analyze current lifecycle configuration
            current_lifecycle = self.get_current_lifecycle_policy(bucket_name)
            
            # Check if we need to create/update lifecycle policy
            if not self.has_optimal_lifecycle_policy(current_lifecycle):
                if not DRY_RUN:
                    self.create_lifecycle_policy(bucket_name, bucket_location)
                
                result['lifecycle_policy_created'] = True
                result['actions'].append(f"Created/Updated lifecycle policy for {bucket_name}")
                logger.info(f"Lifecycle policy created for {bucket_name}")
            
            # Clean up incomplete multipart uploads
            incomplete_uploads = self.get_incomplete_multipart_uploads(bucket_name)
            if incomplete_uploads:
                if not DRY_RUN:
                    self.cleanup_incomplete_uploads(bucket_name, incomplete_uploads)
                
                result['incomplete_uploads_cleaned'] = True
                result['actions'].append(f"Cleaned {len(incomplete_uploads)} incomplete uploads in {bucket_name}")
                logger.info(f"Cleaned {len(incomplete_uploads)} incomplete uploads in {bucket_name}")
                
                # Estimate savings from cleanup
                estimated_savings = len(incomplete_uploads) * 0.023  # Rough estimate
                self.total_savings_estimate += estimated_savings
            
            # Estimate storage class transition savings
            storage_analysis = self.analyze_bucket_storage(bucket_name)
            if storage_analysis:
                transition_savings = self.calculate_transition_savings(storage_analysis)
                self.total_savings_estimate += transition_savings
                if transition_savings > 0:
                    result['actions'].append(f"Estimated ${transition_savings:.2f}/month savings from transitions in {bucket_name}")
            
        except Exception as e:
            logger.error(f"Error optimizing bucket {bucket_name}: {str(e)}")
            result['actions'].append(f"Error optimizing {bucket_name}: {str(e)}")
        
        return result
    
    def is_bucket_empty(self, bucket_name: str) -> bool:
        """Check if bucket is empty"""
        try:
            response = s3_client.list_objects_v2(
                Bucket=bucket_name,
                MaxKeys=1
            )
            return 'Contents' not in response
        except Exception as e:
            logger.error(f"Error checking if bucket {bucket_name} is empty: {str(e)}")
            return False
    
    def get_bucket_location(self, bucket_name: str) -> str:
        """Get bucket region"""
        try:
            response = s3_client.get_bucket_location(Bucket=bucket_name)
            location = response.get('LocationConstraint', 'us-east-1')
            return 'us-east-1' if location is None else location
        except Exception as e:
            logger.error(f"Error getting location for bucket {bucket_name}: {str(e)}")
            return 'us-east-1'
    
    def get_current_lifecycle_policy(self, bucket_name: str) -> Optional[Dict]:
        """Get current lifecycle configuration"""
        try:
            response = s3_client.get_bucket_lifecycle_configuration(Bucket=bucket_name)
            return response.get('Rules', [])
        except s3_client.exceptions.NoSuchLifecycleConfiguration:
            return None
        except Exception as e:
            logger.error(f"Error getting lifecycle policy for {bucket_name}: {str(e)}")
            return None
    
    def has_optimal_lifecycle_policy(self, current_policy: Optional[List]) -> bool:
        """Check if current lifecycle policy is optimal"""
        if not current_policy:
            return False
        
        # Check for key transitions we want
        has_ia_transition = False
        has_glacier_transition = False
        has_multipart_cleanup = False
        
        for rule in current_policy:
            if rule.get('Status') != 'Enabled':
                continue
                
            transitions = rule.get('Transitions', [])
            for transition in transitions:
                storage_class = transition.get('StorageClass')
                if storage_class in ['STANDARD_IA', 'ONEZONE_IA']:
                    has_ia_transition = True
                elif storage_class in ['GLACIER', 'DEEP_ARCHIVE']:
                    has_glacier_transition = True
            
            # Check for multipart upload cleanup
            abort_incomplete = rule.get('AbortIncompleteMultipartUpload')
            if abort_incomplete:
                has_multipart_cleanup = True
        
        return has_ia_transition and has_glacier_transition and has_multipart_cleanup
    
    def create_lifecycle_policy(self, bucket_name: str, bucket_location: str) -> None:
        """Create optimized lifecycle policy for bucket"""
        try:
            # Create comprehensive lifecycle configuration
            lifecycle_config = {
                'Rules': [
                    {
                        'ID': 'OptimizationRule',
                        'Status': 'Enabled',
                        'Filter': {'Prefix': ''},
                        'Transitions': [
                            {
                                'Days': LIFECYCLE_DAYS_IA,
                                'StorageClass': 'STANDARD_IA'
                            },
                            {
                                'Days': LIFECYCLE_DAYS_GLACIER,
                                'StorageClass': 'GLACIER'
                            },
                            {
                                'Days': LIFECYCLE_DAYS_DEEP_ARCHIVE,
                                'StorageClass': 'DEEP_ARCHIVE'
                            }
                        ],
                        'AbortIncompleteMultipartUpload': {
                            'DaysAfterInitiation': DELETE_INCOMPLETE_UPLOADS_DAYS
                        }
                    }
                ]
            }
            
            # Add versioning cleanup if versioning is enabled
            if self.is_versioning_enabled(bucket_name):
                lifecycle_config['Rules'][0]['NoncurrentVersionTransitions'] = [
                    {
                        'NoncurrentDays': LIFECYCLE_DAYS_IA,
                        'StorageClass': 'STANDARD_IA'
                    },
                    {
                        'NoncurrentDays': LIFECYCLE_DAYS_GLACIER,
                        'StorageClass': 'GLACIER'
                    }
                ]
                lifecycle_config['Rules'][0]['NoncurrentVersionExpiration'] = {
                    'NoncurrentDays': DELETE_OLD_VERSIONS_DAYS
                }
            
            s3_client.put_bucket_lifecycle_configuration(
                Bucket=bucket_name,
                LifecycleConfiguration=lifecycle_config
            )
            
            logger.info(f"Lifecycle policy created for bucket {bucket_name}")
            
        except Exception as e:
            logger.error(f"Failed to create lifecycle policy for {bucket_name}: {str(e)}")
            raise
    
    def is_versioning_enabled(self, bucket_name: str) -> bool:
        """Check if bucket versioning is enabled"""
        try:
            response = s3_client.get_bucket_versioning(Bucket=bucket_name)
            return response.get('Status') == 'Enabled'
        except Exception as e:
            logger.error(f"Error checking versioning for {bucket_name}: {str(e)}")
            return False
    
    def get_incomplete_multipart_uploads(self, bucket_name: str) -> List[Dict]:
        """Get list of incomplete multipart uploads"""
        try:
            cutoff_date = datetime.now(timezone.utc) - timedelta(days=DELETE_INCOMPLETE_UPLOADS_DAYS)
            incomplete_uploads = []
            
            paginator = s3_client.get_paginator('list_multipart_uploads')
            for page in paginator.paginate(Bucket=bucket_name):
                uploads = page.get('Uploads', [])
                for upload in uploads:
                    if upload['Initiated'] < cutoff_date:
                        incomplete_uploads.append(upload)
            
            return incomplete_uploads
            
        except Exception as e:
            logger.error(f"Error getting incomplete uploads for {bucket_name}: {str(e)}")
            return []
    
    def cleanup_incomplete_uploads(self, bucket_name: str, uploads: List[Dict]) -> None:
        """Clean up incomplete multipart uploads"""
        for upload in uploads:
            try:
                s3_client.abort_multipart_upload(
                    Bucket=bucket_name,
                    Key=upload['Key'],
                    UploadId=upload['UploadId']
                )
                logger.info(f"Aborted incomplete upload: {upload['Key']} in {bucket_name}")
            except Exception as e:
                logger.error(f"Failed to abort upload {upload['Key']}: {str(e)}")
    
    def analyze_bucket_storage(self, bucket_name: str) -> Optional[Dict]:
        """Analyze bucket storage usage and patterns"""
        try:
            # Get bucket metrics from CloudWatch (simplified)
            response = cloudwatch.get_metric_statistics(
                Namespace='AWS/S3',
                MetricName='BucketSizeBytes',
                Dimensions=[
                    {'Name': 'BucketName', 'Value': bucket_name},
                    {'Name': 'StorageType', 'Value': 'StandardStorage'}
                ],
                StartTime=datetime.utcnow() - timedelta(days=1),
                EndTime=datetime.utcnow(),
                Period=86400,  # 1 day
                Statistics=['Average']
            )
            
            if response['Datapoints']:
                size_bytes = response['Datapoints'][0]['Average']
                size_gb = size_bytes / (1024**3)
                
                return {
                    'bucket_name': bucket_name,
                    'size_gb': size_gb,
                    'storage_class': 'STANDARD'
                }
            
        except Exception as e:
            logger.error(f"Error analyzing storage for {bucket_name}: {str(e)}")
        
        return None
    
    def calculate_transition_savings(self, storage_analysis: Dict) -> float:
        """Calculate estimated savings from storage class transitions"""
        size_gb = storage_analysis.get('size_gb', 0)
        if size_gb < 1:  # Ignore small buckets
            return 0
        
        # Simplified savings calculation (actual costs vary by region)
        standard_cost = size_gb * 0.023  # $0.023/GB/month for Standard
        ia_cost = size_gb * 0.0125       # $0.0125/GB/month for Standard-IA
        glacier_cost = size_gb * 0.004   # $0.004/GB/month for Glacier
        
        # Assume 30% goes to IA, 50% to Glacier based on age
        estimated_savings = (standard_cost * 0.3 - ia_cost * 0.3) + (standard_cost * 0.5 - glacier_cost * 0.5)
        
        return max(0, estimated_savings)
    
    def send_notification(self, results: Dict) -> None:
        """Send SNS notification with optimization results"""
        try:
            message = self.format_notification_message(results)
            
            sns_client.publish(
                TopicArn=SNS_TOPIC_ARN,
                Message=message,
                Subject=f"S3 Lifecycle Optimization Report - {datetime.now().strftime('%Y-%m-%d')}"
            )
            
            logger.info("Notification sent successfully")
            
        except Exception as e:
            logger.error(f"Failed to send notification: {str(e)}")
    
    def format_notification_message(self, results: Dict) -> str:
        """Format notification message"""
        mode = "DRY RUN" if results['dry_run'] else "EXECUTION"
        
        message = f"""
S3 Lifecycle Optimization Report ({mode})
==========================================

📊 SUMMARY:
• Buckets Processed: {results['total_buckets_processed']}
• Lifecycle Policies Created: {results['lifecycle_policies_created']}
• Incomplete Uploads Cleaned: {results['incomplete_uploads_cleaned']}
• Empty Buckets Identified: {results['empty_buckets_identified']}
• Estimated Monthly Savings: ${results['total_estimated_savings']:.2f}

🎯 ACTIONS TAKEN:
"""
        
        for action in results.get('actions_taken', []):
            message += f"• {action}\n"
        
        if results.get('errors'):
            message += f"\n❌ ERRORS ({len(results['errors'])}):\n"
            for error in results['errors']:
                message += f"• {error}\n"
        
        message += f"""
💡 RECOMMENDATIONS:
• Review empty buckets for deletion
• Monitor CloudWatch metrics for optimization effectiveness
• Consider additional cost optimization strategies
• Schedule regular lifecycle policy reviews

Report Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC')}
"""
        
        return message
    
    def send_cloudwatch_metrics(self, results: Dict) -> None:
        """Send custom CloudWatch metrics"""
        try:
            metrics = [
                {
                    'MetricName': 'BucketsProcessed',
                    'Value': results['total_buckets_processed'],
                    'Unit': 'Count'
                },
                {
                    'MetricName': 'LifecyclePoliciesCreated',
                    'Value': results['lifecycle_policies_created'],
                    'Unit': 'Count'
                },
                {
                    'MetricName': 'EstimatedMonthlySavings',
                    'Value': results['total_estimated_savings'],
                    'Unit': 'None'
                }
            ]
            
            for metric in metrics:
                cloudwatch.put_metric_data(
                    Namespace='AWS/S3/LifecycleOptimization',
                    MetricData=[{
                        'MetricName': metric['MetricName'],
                        'Value': metric['Value'],
                        'Unit': metric['Unit'],
                        'Timestamp': datetime.utcnow()
                    }]
                )
            
            logger.info("CloudWatch metrics sent successfully")
            
        except Exception as e:
            logger.error(f"Failed to send CloudWatch metrics: {str(e)}")


# Initialize optimizer
optimizer = S3LifecycleOptimizer()

# Lambda handler function (entry point)
def lambda_handler(event, context):
    """Main Lambda entry point"""
    return optimizer.lambda_handler(event, context)


# For local testing
if __name__ == '__main__':
    # Test event
    test_event = {}
    
    # Mock context
    class MockContext:
        def get_remaining_time_in_millis(self):
            return 300000
    
    result = lambda_handler(test_event, MockContext())
    print(json.dumps(result, indent=2))