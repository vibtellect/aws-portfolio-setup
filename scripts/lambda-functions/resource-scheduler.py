#!/usr/bin/env python3
"""
AWS Resource Scheduler Lambda Function
Automatically starts/stops EC2 and RDS resources based on tags and schedules
"""

import json
import boto3
import logging
import os
from datetime import datetime, timezone, time
from typing import Dict, List, Any, Optional

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# AWS Clients
ec2_client = boto3.client('ec2')
rds_client = boto3.client('rds')
sns_client = boto3.client('sns')

# Configuration from environment variables
SCHEDULER_TAG_KEY = os.environ.get('SCHEDULER_TAG_KEY', 'AutoSchedule')
SNS_TOPIC_ARN = os.environ.get('SNS_TOPIC_ARN')
DRY_RUN = os.environ.get('DRY_RUN', 'false').lower() == 'true'
TIMEZONE_OFFSET = int(os.environ.get('TIMEZONE_OFFSET', '0'))  # Hours offset from UTC

class ResourceScheduler:
    """Manages scheduled starting and stopping of AWS resources"""
    
    def __init__(self):
        self.actions_taken = []
        self.errors = []
        self.current_time = datetime.now(timezone.utc)
        
        # Predefined schedules (24-hour format)
        self.schedules = {
            'business-hours': {'days': 'Mon-Fri', 'start': '08:00', 'stop': '18:00'},
            'dev-hours': {'days': 'Mon-Fri', 'start': '09:00', 'stop': '17:00'},
            'demo-only': {'days': 'Mon-Sun', 'start': 'manual', 'stop': 'manual'},
            '24x7': {'days': 'Mon-Sun', 'start': 'always', 'stop': 'never'},
            'never': {'days': 'Mon-Sun', 'start': 'never', 'stop': 'always'}
        }
    
    def lambda_handler(self, event: Dict[str, Any], context: Any) -> Dict[str, Any]:
        """Main Lambda handler function"""
        try:
            logger.info("Starting Resource Scheduler execution")
            
            # Process all scheduled resources
            ec2_results = self.schedule_ec2_instances()
            rds_results = self.schedule_rds_instances()
            
            results = {
                'statusCode': 200,
                'timestamp': self.current_time.isoformat(),
                'dry_run': DRY_RUN,
                'ec2_processed': ec2_results['processed'],
                'ec2_started': ec2_results['started'],
                'ec2_stopped': ec2_results['stopped'],
                'rds_processed': rds_results['processed'],
                'rds_started': rds_results['started'],
                'rds_stopped': rds_results['stopped'],
                'actions_taken': self.actions_taken,
                'errors': self.errors
            }
            
            # Send notification if actions were taken or errors occurred
            if (self.actions_taken or self.errors) and SNS_TOPIC_ARN:
                self.send_notification(results)
            
            logger.info("Resource Scheduler execution completed successfully")
            return results
            
        except Exception as e:
            logger.error(f"Resource Scheduler execution failed: {str(e)}")
            return {
                'statusCode': 500,
                'error': str(e),
                'timestamp': self.current_time.isoformat()
            }
    
    def schedule_ec2_instances(self) -> Dict[str, int]:
        """Process scheduled EC2 instances"""
        results = {'processed': 0, 'started': 0, 'stopped': 0}
        
        try:
            # Get all instances with the scheduler tag
            response = ec2_client.describe_instances(
                Filters=[
                    {'Name': f'tag:{SCHEDULER_TAG_KEY}', 'Values': ['*']}
                ]
            )
            
            for reservation in response['Reservations']:
                for instance in reservation['Instances']:
                    try:
                        instance_id = instance['InstanceId']
                        current_state = instance['State']['Name']
                        
                        # Skip terminated instances
                        if current_state == 'terminated':
                            continue
                        
                        results['processed'] += 1
                        
                        # Get schedule from tags
                        schedule_value = self.get_tag_value(instance.get('Tags', []), SCHEDULER_TAG_KEY)
                        if not schedule_value:
                            continue
                        
                        # Determine desired action
                        desired_action = self.get_desired_action(schedule_value)
                        
                        if desired_action == 'start' and current_state == 'stopped':
                            if not DRY_RUN:
                                ec2_client.start_instances(InstanceIds=[instance_id])
                            
                            self.actions_taken.append(f"Started EC2 instance: {instance_id}")
                            results['started'] += 1
                            logger.info(f"Started EC2 instance {instance_id}")
                            
                        elif desired_action == 'stop' and current_state == 'running':
                            # Check for protection tag
                            if self.is_protected(instance.get('Tags', [])):
                                logger.info(f"EC2 instance {instance_id} is protected from stopping")
                                continue
                            
                            if not DRY_RUN:
                                ec2_client.stop_instances(InstanceIds=[instance_id])
                            
                            self.actions_taken.append(f"Stopped EC2 instance: {instance_id}")
                            results['stopped'] += 1
                            logger.info(f"Stopped EC2 instance {instance_id}")
                    
                    except Exception as e:
                        error_msg = f"Error processing EC2 instance {instance_id}: {str(e)}"
                        logger.error(error_msg)
                        self.errors.append(error_msg)
        
        except Exception as e:
            error_msg = f"Error listing EC2 instances: {str(e)}"
            logger.error(error_msg)
            self.errors.append(error_msg)
        
        return results
    
    def schedule_rds_instances(self) -> Dict[str, int]:
        """Process scheduled RDS instances"""
        results = {'processed': 0, 'started': 0, 'stopped': 0}
        
        try:
            # Get all RDS instances
            response = rds_client.describe_db_instances()
            
            for instance in response['DBInstances']:
                try:
                    db_identifier = instance['DBInstanceIdentifier']
                    current_state = instance['DBInstanceStatus']
                    
                    # Skip instances that can't be stopped/started
                    if instance.get('MultiAZ', False):
                        logger.info(f"Skipping Multi-AZ RDS instance {db_identifier}")
                        continue
                    
                    results['processed'] += 1
                    
                    # Get tags for this RDS instance
                    try:
                        tags_response = rds_client.list_tags_for_resource(
                            ResourceName=instance['DBInstanceArn']
                        )
                        tags = tags_response.get('TagList', [])
                    except Exception as e:
                        logger.warning(f"Could not get tags for RDS instance {db_identifier}: {e}")
                        continue
                    
                    # Get schedule from tags
                    schedule_value = self.get_tag_value_rds(tags, SCHEDULER_TAG_KEY)
                    if not schedule_value:
                        continue
                    
                    # Determine desired action
                    desired_action = self.get_desired_action(schedule_value)
                    
                    if desired_action == 'start' and current_state == 'stopped':
                        if not DRY_RUN:
                            rds_client.start_db_instance(DBInstanceIdentifier=db_identifier)
                        
                        self.actions_taken.append(f"Started RDS instance: {db_identifier}")
                        results['started'] += 1
                        logger.info(f"Started RDS instance {db_identifier}")
                        
                    elif desired_action == 'stop' and current_state == 'available':
                        # Check for protection tag
                        if self.is_protected_rds(tags):
                            logger.info(f"RDS instance {db_identifier} is protected from stopping")
                            continue
                        
                        if not DRY_RUN:
                            rds_client.stop_db_instance(DBInstanceIdentifier=db_identifier)
                        
                        self.actions_taken.append(f"Stopped RDS instance: {db_identifier}")
                        results['stopped'] += 1
                        logger.info(f"Stopped RDS instance {db_identifier}")
                
                except Exception as e:
                    error_msg = f"Error processing RDS instance {db_identifier}: {str(e)}"
                    logger.error(error_msg)
                    self.errors.append(error_msg)
        
        except Exception as e:
            error_msg = f"Error listing RDS instances: {str(e)}"
            logger.error(error_msg)
            self.errors.append(error_msg)
        
        return results
    
    def get_tag_value(self, tags: List[Dict], key: str) -> Optional[str]:
        """Get tag value from EC2 tag list"""
        for tag in tags:
            if tag.get('Key') == key:
                return tag.get('Value')
        return None
    
    def get_tag_value_rds(self, tags: List[Dict], key: str) -> Optional[str]:
        """Get tag value from RDS tag list"""
        for tag in tags:
            if tag.get('Key') == key:
                return tag.get('Value')
        return None
    
    def is_protected(self, tags: List[Dict]) -> bool:
        """Check if EC2 resource is protected from stopping"""
        protection_value = self.get_tag_value(tags, 'DoNotShutdown')
        return protection_value and protection_value.lower() == 'true'
    
    def is_protected_rds(self, tags: List[Dict]) -> bool:
        """Check if RDS resource is protected from stopping"""
        protection_value = self.get_tag_value_rds(tags, 'DoNotShutdown')
        return protection_value and protection_value.lower() == 'true'
    
    def get_desired_action(self, schedule_value: str) -> str:
        """Determine if resource should be started or stopped based on schedule"""
        # Handle special cases
        if schedule_value == '24x7':
            return 'start'
        elif schedule_value == 'never':
            return 'stop'
        elif schedule_value == 'demo-only':
            return 'none'  # Manual control only
        
        # Handle predefined schedules
        if schedule_value in self.schedules:
            schedule_config = self.schedules[schedule_value]
            return self.evaluate_schedule(schedule_config)
        
        # Handle custom schedule format: "Mon-Fri:09:00-17:00"
        if ':' in schedule_value and '-' in schedule_value:
            try:
                parts = schedule_value.split(':')
                days_part = parts[0]
                time_part = ':'.join(parts[1:])
                
                schedule_config = {
                    'days': days_part,
                    'start': time_part.split('-')[0],
                    'stop': time_part.split('-')[1]
                }
                
                return self.evaluate_schedule(schedule_config)
            except Exception as e:
                logger.error(f"Error parsing custom schedule '{schedule_value}': {e}")
                return 'none'
        
        logger.warning(f"Unknown schedule format: {schedule_value}")
        return 'none'
    
    def evaluate_schedule(self, schedule_config: Dict[str, str]) -> str:
        """Evaluate if current time is within schedule"""
        # Get current day and time
        current_day = self.current_time.strftime('%a')  # Mon, Tue, etc.
        current_time = self.current_time.time()
        
        # Check if current day is in schedule
        days_range = schedule_config['days']
        if not self.is_current_day_in_range(current_day, days_range):
            return 'stop'
        
        # Parse start and stop times
        try:
            start_time_str = schedule_config['start']
            stop_time_str = schedule_config['stop']
            
            # Handle special values
            if start_time_str == 'always' or start_time_str == 'manual':
                return 'start'
            if start_time_str == 'never':
                return 'stop'
            
            start_time = time.fromisoformat(start_time_str)
            stop_time = time.fromisoformat(stop_time_str)
            
            # Check if current time is within schedule
            if start_time <= current_time <= stop_time:
                return 'start'
            else:
                return 'stop'
                
        except Exception as e:
            logger.error(f"Error parsing schedule times: {e}")
            return 'none'
    
    def is_current_day_in_range(self, current_day: str, days_range: str) -> bool:
        """Check if current day is within the specified range"""
        days_map = {
            'Mon': 0, 'Tue': 1, 'Wed': 2, 'Thu': 3,
            'Fri': 4, 'Sat': 5, 'Sun': 6
        }
        
        if days_range == 'Mon-Sun':
            return True
        elif days_range == 'Mon-Fri':
            return days_map[current_day] <= 4
        elif days_range == 'Sat-Sun':
            return days_map[current_day] >= 5
        else:
            # Handle specific days like "Mon,Wed,Fri" or single day "Mon"
            if ',' in days_range:
                allowed_days = [day.strip() for day in days_range.split(',')]
                return current_day in allowed_days
            else:
                return current_day == days_range
    
    def send_notification(self, results: Dict) -> None:
        """Send SNS notification with scheduling results"""
        try:
            message = self.format_notification_message(results)
            
            sns_client.publish(
                TopicArn=SNS_TOPIC_ARN,
                Message=message,
                Subject=f"AWS Resource Scheduler Report - {datetime.now().strftime('%Y-%m-%d %H:%M')}"
            )
            
            logger.info("Notification sent successfully")
            
        except Exception as e:
            logger.error(f"Failed to send notification: {str(e)}")
    
    def format_notification_message(self, results: Dict) -> str:
        """Format notification message"""
        mode = "DRY RUN" if results['dry_run'] else "EXECUTION"
        
        message = f"""
AWS Resource Scheduler Report ({mode})
=====================================

⏰ Execution Time: {results['timestamp']}

📊 SUMMARY:
• EC2 Instances Processed: {results['ec2_processed']}
• EC2 Instances Started: {results['ec2_started']}
• EC2 Instances Stopped: {results['ec2_stopped']}
• RDS Instances Processed: {results['rds_processed']}  
• RDS Instances Started: {results['rds_started']}
• RDS Instances Stopped: {results['rds_stopped']}

🎯 ACTIONS TAKEN:
"""
        
        for action in results.get('actions_taken', []):
            message += f"• {action}\n"
        
        if results.get('errors'):
            message += f"\n❌ ERRORS ({len(results['errors'])}):\n"
            for error in results['errors']:
                message += f"• {error}\n"
        
        message += f"""
💡 SCHEDULE TYPES:
• business-hours: Mon-Fri 08:00-18:00
• dev-hours: Mon-Fri 09:00-17:00  
• demo-only: Manual control only
• 24x7: Always running
• never: Always stopped
• custom: Format like "Mon-Fri:09:00-17:00"

🏷️ TAGGING:
Tag resources with "{SCHEDULER_TAG_KEY}=<schedule>" to enable scheduling.
Add "DoNotShutdown=true" to protect critical resources.

Report Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC')}
"""
        
        return message


# Initialize scheduler
scheduler = ResourceScheduler()

# Lambda handler function (entry point)
def lambda_handler(event, context):
    """Main Lambda entry point"""
    return scheduler.lambda_handler(event, context)


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