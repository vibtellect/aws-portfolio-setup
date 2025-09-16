#!/bin/bash
# =============================================================================
# CloudWatch Dashboard Setup Script
# =============================================================================
# Creates a comprehensive CloudWatch dashboard for Free Tier monitoring
# Usage: ./setup-dashboard.sh [--region REGION] [--update-buckets]
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DASHBOARD_CONFIG="${SCRIPT_DIR}/cloudwatch-dashboard.json"
DASHBOARD_NAME="AWS-Free-Tier-Monitoring"
DEFAULT_REGION="eu-central-1"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date '+%H:%M:%S')]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[$(date '+%H:%M:%S')] WARNING:${NC} $1"
}

error() {
    echo -e "${RED}[$(date '+%H:%M:%S')] ERROR:${NC} $1"
}

# Parse arguments
REGION="$DEFAULT_REGION"
UPDATE_BUCKETS=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --region)
            REGION="$2"
            shift 2
            ;;
        --update-buckets)
            UPDATE_BUCKETS=true
            shift
            ;;
        --help)
            echo "Usage: $0 [--region REGION] [--update-buckets]"
            echo "  --region        AWS region (default: $DEFAULT_REGION)"
            echo "  --update-buckets Update S3 bucket names in dashboard"
            exit 0
            ;;
        *)
            error "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    error "AWS CLI not found. Please install AWS CLI."
    exit 1
fi

# Check AWS credentials
if ! aws sts get-caller-identity --region "$REGION" &> /dev/null; then
    error "AWS credentials not configured for region $REGION"
    exit 1
fi

log "Setting up CloudWatch dashboard in region: $REGION"

# Update dashboard configuration with actual bucket names if requested
if [ "$UPDATE_BUCKETS" = true ]; then
    log "Updating S3 bucket names in dashboard configuration..."
    
    # Get first S3 bucket name
    BUCKET_NAME=$(aws s3api list-buckets --query 'Buckets[0].Name' --output text 2>/dev/null || echo "YOUR_BUCKET_NAME")
    
    if [ "$BUCKET_NAME" != "YOUR_BUCKET_NAME" ] && [ "$BUCKET_NAME" != "None" ]; then
        log "Found S3 bucket: $BUCKET_NAME"
        # Create temporary dashboard config with updated bucket name
        sed "s/YOUR_BUCKET_NAME/$BUCKET_NAME/g" "$DASHBOARD_CONFIG" > "${DASHBOARD_CONFIG}.tmp"
        DASHBOARD_CONFIG="${DASHBOARD_CONFIG}.tmp"
    else
        warn "No S3 buckets found - using placeholder name"
    fi
fi

# Enable billing metrics (required for billing dashboard)
log "Enabling billing metrics in us-east-1..."
aws cloudwatch put-metric-data \
    --namespace "AWS/Billing" \
    --metric-data MetricName=EstimatedCharges,Value=0,Unit=Count \
    --region us-east-1 2>/dev/null || warn "Could not enable billing metrics"

# Create the dashboard
log "Creating CloudWatch dashboard: $DASHBOARD_NAME"

aws cloudwatch put-dashboard \
    --region "$REGION" \
    --dashboard-name "$DASHBOARD_NAME" \
    --dashboard-body "file://$DASHBOARD_CONFIG"

if [ $? -eq 0 ]; then
    log "Dashboard created successfully!"
    log "Access it at: https://console.aws.amazon.com/cloudwatch/home?region=$REGION#dashboards:name=$DASHBOARD_NAME"
else
    error "Failed to create dashboard"
    exit 1
fi

# Clean up temporary file
if [ -f "${DASHBOARD_CONFIG}.tmp" ]; then
    rm "${DASHBOARD_CONFIG}.tmp"
fi

# Create CloudWatch alarms for key Free Tier services
log "Setting up Free Tier usage alarms..."

# Billing alarm (must be in us-east-1)
aws cloudwatch put-metric-alarm \
    --region us-east-1 \
    --alarm-name "FreeTier-BillingAlert-5USD" \
    --alarm-description "Alert when estimated charges exceed $5" \
    --metric-name EstimatedCharges \
    --namespace AWS/Billing \
    --statistic Maximum \
    --period 86400 \
    --threshold 5.0 \
    --comparison-operator GreaterThanThreshold \
    --dimensions Name=Currency,Value=USD \
    --evaluation-periods 1 \
    --alarm-actions arn:aws:sns:us-east-1:$(aws sts get-caller-identity --query 'Account' --output text):free-tier-alerts 2>/dev/null || warn "Billing alarm creation failed"

# EC2 instance running hours alarm (approximate)
aws cloudwatch put-metric-alarm \
    --region "$REGION" \
    --alarm-name "FreeTier-EC2-HighUsage" \
    --alarm-description "Alert when EC2 usage approaches Free Tier limit" \
    --metric-name CPUUtilization \
    --namespace AWS/EC2 \
    --statistic Average \
    --period 86400 \
    --threshold 80 \
    --comparison-operator GreaterThanThreshold \
    --evaluation-periods 1 \
    --treat-missing-data notBreaching 2>/dev/null || warn "EC2 alarm creation failed"

log "Free Tier monitoring dashboard setup complete!"
log ""
log "Next steps:"
log "1. Visit the dashboard: https://console.aws.amazon.com/cloudwatch/home?region=$REGION#dashboards:name=$DASHBOARD_NAME"
log "2. Set up SNS topic for alerts: aws sns create-topic --name free-tier-alerts"
log "3. Subscribe to alerts: aws sns subscribe --topic-arn <ARN> --protocol email --notification-endpoint your-email@example.com"
log "4. Run daily monitoring: ./cost-management.sh monitor"