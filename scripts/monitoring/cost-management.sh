#!/bin/bash
# =============================================================================
# AWS Cost Management & Free Tier Monitoring Script
# =============================================================================
# Automates cost monitoring, resource optimization, and Free Tier management
# Supports start/stop operations for development environments
#
# Usage: ./cost-management.sh [command] [options]
# Commands: start, stop, monitor, analyze, cleanup, setup
# =============================================================================

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="${SCRIPT_DIR}/../../logs"
CONFIG_FILE="${SCRIPT_DIR}/cost-management.conf"
PYTHON_SCRIPT="${SCRIPT_DIR}/free-tier-monitor.py"

# Colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default configuration
DEFAULT_REGION="eu-central-1"
DEFAULT_ENVIRONMENT="development"
DEFAULT_PROJECT_TAG="aws-portfolio"

# Initialize log directory
mkdir -p "$LOG_DIR"

# =============================================================================
# Utility Functions
# =============================================================================

log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_DIR/cost-management.log"
}

warn() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1" | tee -a "$LOG_DIR/cost-management.log"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" | tee -a "$LOG_DIR/cost-management.log"
}

check_aws_cli() {
    if ! command -v aws &> /dev/null; then
        error "AWS CLI not found. Please install AWS CLI."
        exit 1
    fi
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        error "AWS credentials not configured. Run 'aws configure' first."
        exit 1
    fi
    
    log "AWS CLI configured correctly"
}

check_python_requirements() {
    if ! python3 -c "import boto3" &> /dev/null; then
        warn "boto3 not installed. Installing..."
        pip3 install boto3 || {
            error "Failed to install boto3"
            exit 1
        }
    fi
    log "Python requirements satisfied"
}

# =============================================================================
# Resource Management Functions
# =============================================================================

start_development_environment() {
    log "Starting development environment..."
    
    # Start stopped EC2 instances tagged for development
    local instance_ids=$(aws ec2 describe-instances \
        --region "$DEFAULT_REGION" \
        --filters "Name=tag:Environment,Values=development" \
                  "Name=tag:Project,Values=$DEFAULT_PROJECT_TAG" \
                  "Name=instance-state-name,Values=stopped" \
        --query 'Reservations[].Instances[].InstanceId' \
        --output text)
    
    if [ -n "$instance_ids" ]; then
        log "Starting EC2 instances: $instance_ids"
        aws ec2 start-instances --region "$DEFAULT_REGION" --instance-ids $instance_ids
        
        # Wait for instances to be running
        aws ec2 wait instance-running --region "$DEFAULT_REGION" --instance-ids $instance_ids
        log "EC2 instances started successfully"
    else
        log "No stopped development instances found"
    fi
    
    # Start stopped RDS instances
    local rds_instances=$(aws rds describe-db-instances \
        --region "$DEFAULT_REGION" \
        --query 'DBInstances[?DBInstanceStatus==`stopped` && contains(TagList[?Key==`Environment`].Value, `development`)].DBInstanceIdentifier' \
        --output text)
    
    if [ -n "$rds_instances" ]; then
        for db in $rds_instances; do
            log "Starting RDS instance: $db"
            aws rds start-db-instance --region "$DEFAULT_REGION" --db-instance-identifier "$db"
        done
    else
        log "No stopped development RDS instances found"
    fi
    
    log "Development environment startup complete"
}

stop_development_environment() {
    log "Stopping development environment..."
    
    # Stop running EC2 instances tagged for development
    local instance_ids=$(aws ec2 describe-instances \
        --region "$DEFAULT_REGION" \
        --filters "Name=tag:Environment,Values=development" \
                  "Name=tag:Project,Values=$DEFAULT_PROJECT_TAG" \
                  "Name=instance-state-name,Values=running" \
        --query 'Reservations[].Instances[].InstanceId' \
        --output text)
    
    if [ -n "$instance_ids" ]; then
        log "Stopping EC2 instances: $instance_ids"
        aws ec2 stop-instances --region "$DEFAULT_REGION" --instance-ids $instance_ids
        
        # Wait for instances to be stopped
        aws ec2 wait instance-stopped --region "$DEFAULT_REGION" --instance-ids $instance_ids
        log "EC2 instances stopped successfully"
    else
        log "No running development instances found"
    fi
    
    # Stop running RDS instances
    local rds_instances=$(aws rds describe-db-instances \
        --region "$DEFAULT_REGION" \
        --query 'DBInstances[?DBInstanceStatus==`available` && contains(TagList[?Key==`Environment`].Value, `development`)].DBInstanceIdentifier' \
        --output text)
    
    if [ -n "$rds_instances" ]; then
        for db in $rds_instances; do
            log "Stopping RDS instance: $db"
            aws rds stop-db-instance --region "$DEFAULT_REGION" --db-instance-identifier "$db"
        done
    else
        log "No running development RDS instances found"
    fi
    
    log "Development environment shutdown complete"
}

# =============================================================================
# Monitoring Functions
# =============================================================================

monitor_free_tier() {
    log "Monitoring Free Tier usage..."
    
    if [ -f "$PYTHON_SCRIPT" ]; then
        python3 "$PYTHON_SCRIPT" --format text
    else
        warn "Free Tier monitoring script not found at $PYTHON_SCRIPT"
        # Fallback to basic cost monitoring
        monitor_costs_basic
    fi
}

monitor_costs_basic() {
    log "Running basic cost monitoring..."
    
    # Get current month costs
    local start_date=$(date -d "$(date +%Y-%m-01)" +%Y-%m-%d)
    local end_date=$(date -d "$(date +%Y-%m-01) +1 month" +%Y-%m-%d)
    
    echo -e "\n${BLUE}=== COST REPORT FOR $(date +"%B %Y") ===${NC}"
    
    # Get costs by service
    aws ce get-cost-and-usage \
        --time-period Start="$start_date",End="$end_date" \
        --granularity MONTHLY \
        --metrics BlendedCost \
        --group-by Type=DIMENSION,Key=SERVICE \
        --query 'ResultsByTime[0].Groups[?Metrics.BlendedCost.Amount != `0`].[Keys[0], Metrics.BlendedCost.Amount, Metrics.BlendedCost.Unit]' \
        --output table
    
    # Get total cost
    local total_cost=$(aws ce get-cost-and-usage \
        --time-period Start="$start_date",End="$end_date" \
        --granularity MONTHLY \
        --metrics BlendedCost \
        --query 'ResultsByTime[0].Total.BlendedCost.Amount' \
        --output text)
    
    echo -e "\n${YELLOW}Total Cost This Month: \$${total_cost}${NC}"
    
    # Check if over Free Tier threshold
    if (( $(echo "$total_cost > 5.0" | bc -l 2>/dev/null || echo 0) )); then
        warn "Cost is above \$5.00 - review usage immediately!"
    fi
}

analyze_usage_trends() {
    log "Analyzing usage trends..."
    
    local start_date=$(date -d "$(date +%Y-%m-01) -2 months" +%Y-%m-%d)
    local end_date=$(date +%Y-%m-%d)
    
    echo -e "\n${BLUE}=== USAGE TREND ANALYSIS ===${NC}"
    
    # EC2 usage trend
    echo "EC2 Instance Hours (Last 3 months):"
    aws ce get-cost-and-usage \
        --time-period Start="$start_date",End="$end_date" \
        --granularity MONTHLY \
        --metrics UsageQuantity \
        --group-by Type=DIMENSION,Key=SERVICE \
        --filter file://<(echo '{
            "Dimensions": {
                "Key": "SERVICE",
                "Values": ["Amazon Elastic Compute Cloud - Compute"],
                "MatchOptions": ["EQUALS"]
            }
        }') \
        --query 'ResultsByTime[].{Month:TimePeriod.Start,Usage:Total.UsageQuantity.Amount}' \
        --output table 2>/dev/null || echo "No EC2 usage data available"
    
    # RDS usage trend
    echo -e "\nRDS Instance Hours (Last 3 months):"
    aws ce get-cost-and-usage \
        --time-period Start="$start_date",End="$end_date" \
        --granularity MONTHLY \
        --metrics UsageQuantity \
        --group-by Type=DIMENSION,Key=SERVICE \
        --filter file://<(echo '{
            "Dimensions": {
                "Key": "SERVICE",
                "Values": ["Amazon Relational Database Service"],
                "MatchOptions": ["EQUALS"]
            }
        }') \
        --query 'ResultsByTime[].{Month:TimePeriod.Start,Usage:Total.UsageQuantity.Amount}' \
        --output table 2>/dev/null || echo "No RDS usage data available"
}

# =============================================================================
# Cleanup Functions
# =============================================================================

cleanup_resources() {
    log "Running resource cleanup..."
    
    # Cleanup unused EBS volumes
    cleanup_ebs_volumes
    
    # Cleanup unused Elastic IPs
    cleanup_elastic_ips
    
    # Cleanup old snapshots
    cleanup_old_snapshots
    
    # Cleanup empty S3 buckets (with user confirmation)
    cleanup_empty_s3_buckets
}

cleanup_ebs_volumes() {
    log "Checking for unused EBS volumes..."
    
    local unused_volumes=$(aws ec2 describe-volumes \
        --region "$DEFAULT_REGION" \
        --filters "Name=status,Values=available" \
        --query 'Volumes[].{VolumeId:VolumeId,Size:Size,CreateTime:CreateTime}' \
        --output table)
    
    if [ -n "$unused_volumes" ]; then
        echo -e "\n${YELLOW}Found unused EBS volumes:${NC}"
        echo "$unused_volumes"
        
        read -p "Delete unused volumes? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            local volume_ids=$(aws ec2 describe-volumes \
                --region "$DEFAULT_REGION" \
                --filters "Name=status,Values=available" \
                --query 'Volumes[].VolumeId' \
                --output text)
            
            for volume_id in $volume_ids; do
                log "Deleting volume: $volume_id"
                aws ec2 delete-volume --region "$DEFAULT_REGION" --volume-id "$volume_id"
            done
        fi
    else
        log "No unused EBS volumes found"
    fi
}

cleanup_elastic_ips() {
    log "Checking for unused Elastic IPs..."
    
    local unassociated_eips=$(aws ec2 describe-addresses \
        --region "$DEFAULT_REGION" \
        --query 'Addresses[?AssociationId==null].{AllocationId:AllocationId,PublicIp:PublicIp}' \
        --output table)
    
    if [ -n "$unassociated_eips" ]; then
        echo -e "\n${YELLOW}Found unassociated Elastic IPs (these cost money!):${NC}"
        echo "$unassociated_eips"
        
        read -p "Release unassociated EIPs? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            local allocation_ids=$(aws ec2 describe-addresses \
                --region "$DEFAULT_REGION" \
                --query 'Addresses[?AssociationId==null].AllocationId' \
                --output text)
            
            for allocation_id in $allocation_ids; do
                log "Releasing Elastic IP: $allocation_id"
                aws ec2 release-address --region "$DEFAULT_REGION" --allocation-id "$allocation_id"
            done
        fi
    else
        log "No unused Elastic IPs found"
    fi
}

cleanup_old_snapshots() {
    log "Checking for old snapshots (>30 days)..."
    
    local old_date=$(date -d "30 days ago" +%Y-%m-%d)
    local old_snapshots=$(aws ec2 describe-snapshots \
        --region "$DEFAULT_REGION" \
        --owner-ids self \
        --query "Snapshots[?StartTime<'${old_date}'].{SnapshotId:SnapshotId,Description:Description,StartTime:StartTime,VolumeSize:VolumeSize}" \
        --output table)
    
    if [ -n "$old_snapshots" ]; then
        echo -e "\n${YELLOW}Found old snapshots (>30 days):${NC}"
        echo "$old_snapshots"
        
        read -p "Delete old snapshots? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            local snapshot_ids=$(aws ec2 describe-snapshots \
                --region "$DEFAULT_REGION" \
                --owner-ids self \
                --query "Snapshots[?StartTime<'${old_date}'].SnapshotId" \
                --output text)
            
            for snapshot_id in $snapshot_ids; do
                log "Deleting snapshot: $snapshot_id"
                aws ec2 delete-snapshot --region "$DEFAULT_REGION" --snapshot-id "$snapshot_id"
            done
        fi
    else
        log "No old snapshots found"
    fi
}

cleanup_empty_s3_buckets() {
    log "Checking for empty S3 buckets..."
    
    local buckets=$(aws s3api list-buckets --query 'Buckets[].Name' --output text)
    
    for bucket in $buckets; do
        local object_count=$(aws s3api list-objects-v2 --bucket "$bucket" --query 'KeyCount' --output text 2>/dev/null || echo "0")
        
        if [ "$object_count" = "0" ]; then
            echo -e "\n${YELLOW}Empty bucket found: $bucket${NC}"
            read -p "Delete empty bucket $bucket? (y/N): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                log "Deleting empty bucket: $bucket"
                aws s3api delete-bucket --bucket "$bucket"
            fi
        fi
    done
}

# =============================================================================
# Setup Functions
# =============================================================================

setup_monitoring() {
    log "Setting up Free Tier monitoring..."
    
    # Create SNS topic for alerts
    local topic_arn=$(aws sns create-topic --name free-tier-alerts --query 'TopicArn' --output text 2>/dev/null || true)
    if [ -n "$topic_arn" ]; then
        log "Created SNS topic: $topic_arn"
        
        # Subscribe to topic
        read -p "Enter email for alerts: " email
        if [ -n "$email" ]; then
            aws sns subscribe \
                --topic-arn "$topic_arn" \
                --protocol email \
                --notification-endpoint "$email"
            log "Email subscription created (check your email to confirm)"
        fi
        
        # Save topic ARN to config
        echo "SNS_TOPIC_ARN=$topic_arn" >> "$CONFIG_FILE"
    fi
    
    # Setup CloudWatch billing alerts
    aws cloudwatch put-metric-alarm \
        --alarm-name "FreeTier-BillingAlert" \
        --alarm-description "Alert when estimated charges exceed \$5" \
        --metric-name EstimatedCharges \
        --namespace AWS/Billing \
        --statistic Maximum \
        --period 86400 \
        --threshold 5.0 \
        --comparison-operator GreaterThanThreshold \
        --dimensions Name=Currency,Value=USD \
        --evaluation-periods 1 \
        --alarm-actions "$topic_arn" 2>/dev/null || warn "Failed to create CloudWatch billing alarm"
    
    # Setup cron job for daily monitoring
    local cron_entry="0 8 * * * $SCRIPT_DIR/cost-management.sh monitor >> $LOG_DIR/daily-monitor.log 2>&1"
    (crontab -l 2>/dev/null | grep -v "cost-management.sh monitor"; echo "$cron_entry") | crontab -
    log "Daily monitoring cron job configured"
    
    log "Monitoring setup complete"
}

# =============================================================================
# Main Function
# =============================================================================

usage() {
    echo "AWS Cost Management & Free Tier Monitoring Script"
    echo "Usage: $0 [command] [options]"
    echo ""
    echo "Commands:"
    echo "  start      - Start development environment"
    echo "  stop       - Stop development environment"
    echo "  monitor    - Run Free Tier monitoring"
    echo "  analyze    - Analyze usage trends"
    echo "  cleanup    - Clean up unused resources"
    echo "  setup      - Setup monitoring infrastructure"
    echo ""
    echo "Options:"
    echo "  --region   - AWS region (default: $DEFAULT_REGION)"
    echo "  --help     - Show this help message"
}

main() {
    # Parse arguments
    local command=""
    local region="$DEFAULT_REGION"
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            start|stop|monitor|analyze|cleanup|setup)
                command="$1"
                shift
                ;;
            --region)
                region="$2"
                shift 2
                ;;
            --help)
                usage
                exit 0
                ;;
            *)
                error "Unknown option: $1"
                usage
                exit 1
                ;;
        esac
    done
    
    if [ -z "$command" ]; then
        usage
        exit 1
    fi
    
    # Set region
    DEFAULT_REGION="$region"
    export AWS_DEFAULT_REGION="$region"
    
    # Check prerequisites
    check_aws_cli
    check_python_requirements
    
    log "Starting cost management script with command: $command"
    
    # Execute command
    case $command in
        start)
            start_development_environment
            ;;
        stop)
            stop_development_environment
            ;;
        monitor)
            monitor_free_tier
            ;;
        analyze)
            analyze_usage_trends
            ;;
        cleanup)
            cleanup_resources
            ;;
        setup)
            setup_monitoring
            ;;
        *)
            error "Unknown command: $command"
            exit 1
            ;;
    esac
    
    log "Cost management script completed successfully"
}

# Execute main function with all arguments
main "$@"