#!/bin/bash
# =============================================================================
# Lambda Function Deployment Script
# =============================================================================
# Deploys the Free Tier monitoring Lambda function with proper IAM roles
# Usage: ./deploy-lambda.sh [--region REGION] [--email EMAIL]
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FUNCTION_NAME="free-tier-monitor"
LAMBDA_FILE="${SCRIPT_DIR}/lambda-alert-function.py"
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
EMAIL=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --region)
            REGION="$2"
            shift 2
            ;;
        --email)
            EMAIL="$2"
            shift 2
            ;;
        --help)
            echo "Usage: $0 [--region REGION] [--email EMAIL]"
            echo "  --region  AWS region (default: $DEFAULT_REGION)"
            echo "  --email   Email for SNS alerts"
            exit 0
            ;;
        *)
            error "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Check prerequisites
if ! command -v aws &> /dev/null; then
    error "AWS CLI not found"
    exit 1
fi

if ! aws sts get-caller-identity --region "$REGION" &> /dev/null; then
    error "AWS credentials not configured"
    exit 1
fi

if ! command -v zip &> /dev/null; then
    error "zip command not found"
    exit 1
fi

ACCOUNT_ID=$(aws sts get-caller-identity --query 'Account' --output text)
log "Deploying to AWS Account: $ACCOUNT_ID, Region: $REGION"

# Create SNS topic for alerts
log "Creating SNS topic for alerts..."
SNS_TOPIC_ARN=$(aws sns create-topic \
    --region "$REGION" \
    --name free-tier-alerts \
    --query 'TopicArn' \
    --output text)

log "Created SNS topic: $SNS_TOPIC_ARN"

# Subscribe email if provided
if [ -n "$EMAIL" ]; then
    log "Subscribing email to SNS topic..."
    aws sns subscribe \
        --region "$REGION" \
        --topic-arn "$SNS_TOPIC_ARN" \
        --protocol email \
        --notification-endpoint "$EMAIL"
    log "Email subscription created (check $EMAIL to confirm)"
fi

# Create IAM role for Lambda
log "Creating IAM role for Lambda function..."

TRUST_POLICY=$(cat << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF
)

ROLE_NAME="FreeTierMonitorLambdaRole"

# Create role (ignore error if exists)
aws iam create-role \
    --role-name "$ROLE_NAME" \
    --assume-role-policy-document "$TRUST_POLICY" \
    --description "Role for Free Tier monitoring Lambda function" 2>/dev/null || true

# Create policy for Lambda function
LAMBDA_POLICY=$(cat << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ce:GetFreeTierUsage",
        "ce:GetCostAndUsage"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "sns:Publish"
      ],
      "Resource": "$SNS_TOPIC_ARN"
    }
  ]
}
EOF
)

POLICY_NAME="FreeTierMonitorLambdaPolicy"

# Create policy (ignore error if exists)
aws iam create-policy \
    --policy-name "$POLICY_NAME" \
    --policy-document "$LAMBDA_POLICY" \
    --description "Policy for Free Tier monitoring Lambda function" 2>/dev/null || true

# Attach policy to role
POLICY_ARN="arn:aws:iam::$ACCOUNT_ID:policy/$POLICY_NAME"
aws iam attach-role-policy \
    --role-name "$ROLE_NAME" \
    --policy-arn "$POLICY_ARN"

# Attach basic execution role
aws iam attach-role-policy \
    --role-name "$ROLE_NAME" \
    --policy-arn "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"

ROLE_ARN="arn:aws:iam::$ACCOUNT_ID:role/$ROLE_NAME"

# Wait for role to be available
log "Waiting for IAM role to be available..."
sleep 10

# Create Lambda deployment package
log "Creating Lambda deployment package..."
TEMP_DIR=$(mktemp -d)
cp "$LAMBDA_FILE" "$TEMP_DIR/lambda_function.py"

cd "$TEMP_DIR"
zip -r lambda-function.zip lambda_function.py

# Deploy Lambda function
log "Deploying Lambda function..."

# Delete existing function if it exists
aws lambda delete-function \
    --region "$REGION" \
    --function-name "$FUNCTION_NAME" 2>/dev/null || true

# Create new function
aws lambda create-function \
    --region "$REGION" \
    --function-name "$FUNCTION_NAME" \
    --runtime python3.9 \
    --role "$ROLE_ARN" \
    --handler lambda_function.lambda_handler \
    --zip-file fileb://lambda-function.zip \
    --description "Free Tier usage monitoring and alerting" \
    --timeout 60 \
    --environment Variables="{SNS_TOPIC_ARN=$SNS_TOPIC_ARN,WARNING_THRESHOLD=75,CRITICAL_THRESHOLD=90,REGION=$REGION}"

# Clean up
cd - > /dev/null
rm -rf "$TEMP_DIR"

log "Lambda function deployed successfully!"

# Create EventBridge rule for daily execution
log "Creating EventBridge rule for daily execution..."

RULE_NAME="free-tier-daily-monitor"

# Create rule (ignore error if exists)
aws events put-rule \
    --region "$REGION" \
    --name "$RULE_NAME" \
    --description "Daily Free Tier monitoring" \
    --schedule-expression "cron(0 8 * * ? *)" \
    --state ENABLED 2>/dev/null || true

# Add Lambda as target
LAMBDA_ARN="arn:aws:lambda:$REGION:$ACCOUNT_ID:function:$FUNCTION_NAME"

aws events put-targets \
    --region "$REGION" \
    --rule "$RULE_NAME" \
    --targets "Id=1,Arn=$LAMBDA_ARN"

# Add permission for EventBridge to invoke Lambda
aws lambda add-permission \
    --region "$REGION" \
    --function-name "$FUNCTION_NAME" \
    --statement-id allow-eventbridge \
    --action lambda:InvokeFunction \
    --principal events.amazonaws.com \
    --source-arn "arn:aws:events:$REGION:$ACCOUNT_ID:rule/$RULE_NAME" 2>/dev/null || true

log "EventBridge rule created successfully!"

# Test the function
log "Testing Lambda function..."
aws lambda invoke \
    --region "$REGION" \
    --function-name "$FUNCTION_NAME" \
    --payload '{}' \
    /tmp/lambda-response.json

if [ $? -eq 0 ]; then
    log "Lambda function test successful!"
    cat /tmp/lambda-response.json
    rm /tmp/lambda-response.json
else
    error "Lambda function test failed"
fi

log ""
log "Deployment complete! Summary:"
log "- Lambda function: $FUNCTION_NAME"
log "- SNS topic: $SNS_TOPIC_ARN"
log "- Daily schedule: 08:00 UTC"
log "- CloudWatch logs: /aws/lambda/$FUNCTION_NAME"
log ""
log "Next steps:"
log "1. Confirm email subscription if provided"
log "2. Monitor CloudWatch logs for function execution"
log "3. Adjust thresholds in Lambda environment variables if needed"