"""
AWS Budget Shutdown Handler Lambda Function
Automatically stops AWS resources when budget thresholds are exceeded
"""

import boto3
import json
import logging
from datetime import datetime
from typing import List, Dict, Any

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

class BudgetShutdownHandler:
    def __init__(self):
        """Initialize AWS service clients"""
        self.ec2 = boto3.client('ec2')
        self.rds = boto3.client('rds')
        self.ecs = boto3.client('ecs')
        self.lambda_client = boto3.client('lambda')
        self.sns = boto3.client('sns')
        
        # Configuration from environment variables
        import os
        self.sns_topic_arn = os.environ.get('SNS_TOPIC_ARN')
        self.shutdown_disabled = os.environ.get('SHUTDOWN_DISABLED', 'false').lower() == 'true'
        self.essential_tag_key = os.environ.get('ESSENTIAL_TAG_KEY', 'Essential')
        self.essential_tag_value = os.environ.get('ESSENTIAL_TAG_VALUE', 'true')
        
        # Thresholds
        self.WARNING_THRESHOLD = 50.0
        self.CRITICAL_THRESHOLD = 80.0
        self.EMERGENCY_THRESHOLD = 100.0
    
    def stop_ecs_services(self, essential_only: bool = False) -> List[str]:
        """Stop ECS services"""
        actions = []
        
        try:
            clusters = self.ecs.list_clusters()['clusterArns']
            
            for cluster_arn in clusters:
                services = self.ecs.list_services(cluster=cluster_arn)['serviceArns']
                
                for service_arn in services:
                    service_name = service_arn.split('/')[-1]
                    
                    # Check if service is tagged as essential
                    if essential_only and self._is_ecs_service_essential(cluster_arn, service_arn):
                        continue
                    
                    self.ecs.update_service(
                        cluster=cluster_arn,
                        service=service_arn,
                        desiredCount=0
                    )
                    actions.append(f"Stopped ECS service: {service_name}")
                    
        except Exception as e:
            actions.append(f"ECS stop error: {str(e)}")
            logger.error(f"Error stopping ECS services: {e}")
        
        return actions
    
    def stop_ec2_instances(self, essential_only: bool = False) -> List[str]:
        """Stop EC2 instances"""
        actions = []
        
        try:
            # Get running instances
            if essential_only:
                # Only stop non-essential instances
                reservations = self.ec2.describe_instances(
                    Filters=[
                        {'Name': 'instance-state-name', 'Values': ['running']}
                    ]
                )['Reservations']
                
                instances_to_stop = []
                for reservation in reservations:
                    for instance in reservation['Instances']:
                        if not self._is_instance_essential(instance):
                            instances_to_stop.append(instance['InstanceId'])
            else:
                # Stop all running instances
                reservations = self.ec2.describe_instances(
                    Filters=[
                        {'Name': 'instance-state-name', 'Values': ['running']}
                    ]
                )['Reservations']
                
                instances_to_stop = []
                for reservation in reservations:
                    for instance in reservation['Instances']:
                        instances_to_stop.append(instance['InstanceId'])
            
            # Stop instances
            if instances_to_stop:
                self.ec2.stop_instances(InstanceIds=instances_to_stop)
                for instance_id in instances_to_stop:
                    action_type = "EMERGENCY STOP" if not essential_only else "Stopped"
                    actions.append(f"{action_type} - EC2: {instance_id}")
                    
        except Exception as e:
            actions.append(f"EC2 stop error: {str(e)}")
            logger.error(f"Error stopping EC2 instances: {e}")
        
        return actions
    
    def stop_rds_instances(self) -> List[str]:
        """Stop RDS instances"""
        actions = []
        
        try:
            instances = self.rds.describe_db_instances()['DBInstances']
            
            for instance in instances:
                if instance['DBInstanceStatus'] == 'available':
                    # Check if instance is tagged as essential
                    if self._is_rds_instance_essential(instance['DBInstanceIdentifier']):
                        continue
                    
                    try:
                        self.rds.stop_db_instance(
                            DBInstanceIdentifier=instance['DBInstanceIdentifier']
                        )
                        actions.append(f"Stopped RDS instance: {instance['DBInstanceIdentifier']}")
                    except Exception as stop_error:
                        # Some RDS instances can't be stopped (e.g., Multi-AZ)
                        actions.append(f"Could not stop RDS {instance['DBInstanceIdentifier']}: {stop_error}")
                        
        except Exception as e:
            actions.append(f"RDS stop error: {str(e)}")
            logger.error(f"Error stopping RDS instances: {e}")
        
        return actions
    
    def _is_instance_essential(self, instance: Dict) -> bool:
        """Check if EC2 instance is tagged as essential"""
        tags = instance.get('Tags', [])
        for tag in tags:
            if (tag['Key'] == self.essential_tag_key and 
                tag['Value'] == self.essential_tag_value):
                return True
        return False
    
    def _is_rds_instance_essential(self, db_identifier: str) -> bool:
        """Check if RDS instance is tagged as essential"""
        try:
            response = self.rds.list_tags_for_resource(
                ResourceName=f"arn:aws:rds:*:*:db:{db_identifier}"
            )
            
            tags = response.get('TagList', [])
            for tag in tags:
                if (tag['Key'] == self.essential_tag_key and 
                    tag['Value'] == self.essential_tag_value):
                    return True
        except Exception:
            pass  # If can't check tags, assume not essential
        
        return False
    
    def _is_ecs_service_essential(self, cluster_arn: str, service_arn: str) -> bool:
        """Check if ECS service is tagged as essential"""
        try:
            response = self.ecs.list_tags_for_resource(resourceArn=service_arn)
            
            tags = response.get('tags', [])
            for tag in tags:
                if (tag['key'] == self.essential_tag_key and 
                    tag['value'] == self.essential_tag_value):
                    return True
        except Exception:
            pass  # If can't check tags, assume not essential
        
        return False
    
    def send_notification(self, message: str, subject: str) -> None:
        """Send SNS notification"""
        if not self.sns_topic_arn:
            logger.warning("SNS topic ARN not configured - notification not sent")
            return
        
        try:
            self.sns.publish(
                TopicArn=self.sns_topic_arn,
                Message=message,
                Subject=subject
            )
            logger.info(f"Notification sent: {subject}")
        except Exception as e:
            logger.error(f"Failed to send SNS notification: {e}")
    
    def process_budget_alert(self, budget_name: str, alert_type: str, 
                           threshold_percentage: float) -> Dict[str, Any]:
        """Process budget alert and take appropriate action"""
        
        logger.info(f"Processing budget alert: {budget_name}, {alert_type}, {threshold_percentage}%")
        
        if self.shutdown_disabled:
            logger.info("Shutdown is disabled - only sending notification")
            self.send_notification(
                f"⚠️ Budget alert received but shutdown is disabled: {budget_name} reached {threshold_percentage}%",
                "Budget Alert - Shutdown Disabled"
            )
            return {
                'statusCode': 200,
                'actions_taken': ['Notification sent - shutdown disabled'],
                'shutdown_disabled': True
            }
        
        actions_taken = []
        
        try:
            # Level 1: Warning (50-80%)
            if self.WARNING_THRESHOLD <= threshold_percentage < self.CRITICAL_THRESHOLD:
                message = f"⚠️ BUDGET WARNING: {budget_name} reached {threshold_percentage:.1f}%\n"
                message += "Consider reviewing resource usage to avoid exceeding limits."
                
                self.send_notification(message, f"Budget Warning - {budget_name}")
                actions_taken.append("Warning notification sent")
            
            # Level 2: Critical (80-100%) - Stop non-essential resources
            elif self.CRITICAL_THRESHOLD <= threshold_percentage < self.EMERGENCY_THRESHOLD:
                logger.warning(f"CRITICAL: Budget {budget_name} at {threshold_percentage}% - stopping non-essential resources")
                
                # Stop non-essential ECS services
                ecs_actions = self.stop_ecs_services(essential_only=True)
                actions_taken.extend(ecs_actions)
                
                # Stop non-essential EC2 instances
                ec2_actions = self.stop_ec2_instances(essential_only=True)
                actions_taken.extend(ec2_actions)
                
                message = f"🔴 BUDGET CRITICAL: {budget_name} reached {threshold_percentage:.1f}%\n\n"
                message += "Non-essential services have been stopped:\n"
                message += "\n".join([f"• {action}" for action in actions_taken])
                message += "\n\nEssential services remain running."
                
                self.send_notification(message, f"Budget Critical - Services Stopped - {budget_name}")
            
            # Level 3: Emergency (≥100%) - Stop all resources
            elif threshold_percentage >= self.EMERGENCY_THRESHOLD:
                logger.error(f"EMERGENCY: Budget {budget_name} exceeded 100% - stopping all resources")
                
                # Stop all EC2 instances
                all_ec2_actions = self.stop_ec2_instances(essential_only=False)
                actions_taken.extend(all_ec2_actions)
                
                # Stop all RDS instances
                rds_actions = self.stop_rds_instances()
                actions_taken.extend(rds_actions)
                
                # Stop all ECS services
                all_ecs_actions = self.stop_ecs_services(essential_only=False)
                actions_taken.extend(all_ecs_actions)
                
                message = f"🚨 EMERGENCY SHUTDOWN: {budget_name} exceeded 100%\n\n"
                message += "ALL services have been stopped to prevent further costs:\n"
                message += "\n".join([f"• {action}" for action in actions_taken])
                message += "\n\nManual intervention required to restart services."
                
                self.send_notification(message, f"EMERGENCY SHUTDOWN - {budget_name}")
            
            logger.info(f"Actions completed: {actions_taken}")
            
            return {
                'statusCode': 200,
                'body': {
                    'message': f'Budget alert processed for {budget_name}',
                    'actions_taken': actions_taken,
                    'threshold': f'{threshold_percentage}%',
                    'alert_type': alert_type,
                    'timestamp': datetime.utcnow().isoformat()
                }
            }
            
        except Exception as e:
            logger.error(f"Error processing budget alert: {str(e)}")
            
            # Send error notification
            error_message = f"❌ ERROR: Budget shutdown function failed for {budget_name}\n"
            error_message += f"Error: {str(e)}\n"
            error_message += "Manual intervention required."
            
            self.send_notification(error_message, "Budget Function Error")
            
            return {
                'statusCode': 500,
                'body': {
                    'error': str(e),
                    'budget': budget_name,
                    'timestamp': datetime.utcnow().isoformat()
                }
            }

def lambda_handler(event, context):
    """
    Lambda entry point for budget alert processing
    
    Expected event format:
    {
        "budgetName": "Development-Budget",
        "alertType": "ACTUAL",
        "thresholdPercentage": 75.0
    }
    """
    
    logger.info(f"Received event: {json.dumps(event)}")
    
    # Extract budget information from event
    budget_name = event.get('budgetName', 'Unknown')
    alert_type = event.get('alertType', 'UNKNOWN')
    threshold_percentage = float(event.get('thresholdPercentage', 0))
    
    # Initialize handler and process alert
    handler = BudgetShutdownHandler()
    result = handler.process_budget_alert(budget_name, alert_type, threshold_percentage)
    
    logger.info(f"Processing completed with result: {result}")
    
    return result

# For testing purposes
if __name__ == "__main__":
    # Test event
    test_event = {
        "budgetName": "Test-Budget",
        "alertType": "ACTUAL", 
        "thresholdPercentage": 85.0
    }
    
    result = lambda_handler(test_event, None)
    print(json.dumps(result, indent=2))