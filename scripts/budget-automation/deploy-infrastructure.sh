#!/bin/bash
#
# Deploy Budget Automation Infrastructure
# Deploys CloudFormation stack with budget monitoring and automation
#

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STACK_NAME=${STACK_NAME:-"aws-budget-automation"}
BUDGET_LIMIT=${BUDGET_LIMIT:-20}
ALERT_EMAIL=${ALERT_EMAIL:-""}
ENABLE_SHUTDOWN=${ENABLE_SHUTDOWN:-"true"}
SCHEDULER_TAG_KEY=${SCHEDULER_TAG_KEY:-"AutoSchedule"}
ENVIRONMENT=${ENVIRONMENT:-"dev"}

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1"
}

# Check prerequisites
check_prerequisites() {
    if ! command -v aws &> /dev/null; then
        echo -e "${RED}ERROR: AWS CLI not found${NC}" >&2
        exit 1
    fi
    
    if ! aws sts get-caller-identity &> /dev/null; then
        echo -e "${RED}ERROR: AWS credentials not configured${NC}" >&2
        exit 1
    fi
    
    if [[ -z "$ALERT_EMAIL" ]]; then
        echo -e "${RED}ERROR: ALERT_EMAIL environment variable is required${NC}" >&2
        echo "Usage: ALERT_EMAIL=your@email.com $0"
        exit 1
    fi
}

# Validate email format
validate_email() {
    local email="$1"
    if [[ ! "$email" =~ ^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$ ]]; then
        echo -e "${RED}ERROR: Invalid email format: $email${NC}" >&2
        exit 1
    fi
}

# Deploy CloudFormation stack
deploy_stack() {
    local template_file="$SCRIPT_DIR/budget-automation-infrastructure.yaml"
    
    if [[ ! -f "$template_file" ]]; then
        echo -e "${RED}ERROR: CloudFormation template not found: $template_file${NC}" >&2
        exit 1
    fi
    
    log "🚀 Deploying budget automation infrastructure..."
    log "📊 Stack Name: $STACK_NAME"
    log "💰 Budget Limit: \$${BUDGET_LIMIT}"
    log "📧 Alert Email: $ALERT_EMAIL"
    log "🔄 Auto Shutdown: $ENABLE_SHUTDOWN"
    log "🏷️  Scheduler Tag: $SCHEDULER_TAG_KEY"
    log "🌍 Environment: $ENVIRONMENT"
    
    # Check if stack exists
    if aws cloudformation describe-stacks --stack-name "$STACK_NAME" &>/dev/null; then
        log "📦 Stack exists, updating..."
        OPERATION="update-stack"
        WAITER="stack-update-complete"
    else
        log "📦 Stack does not exist, creating..."
        OPERATION="create-stack"
        WAITER="stack-create-complete"
    fi
    
    # Deploy/Update stack
    aws cloudformation $OPERATION \
        --stack-name "$STACK_NAME" \
        --template-body "file://$template_file" \
        --parameters \
            ParameterKey=BudgetLimit,ParameterValue="$BUDGET_LIMIT" \
            ParameterKey=AlertEmail,ParameterValue="$ALERT_EMAIL" \
            ParameterKey=EnableAutomatedShutdown,ParameterValue="$ENABLE_SHUTDOWN" \
            ParameterKey=SchedulerTagKey,ParameterValue="$SCHEDULER_TAG_KEY" \
            ParameterKey=Environment,ParameterValue="$ENVIRONMENT" \
        --capabilities CAPABILITY_NAMED_IAM \
        --tags \
            Key=Project,Value=AwsBudgetAutomation \
            Key=Environment,Value="$ENVIRONMENT" \
            Key=ManagedBy,Value=CloudFormation
    
    log "⏳ Waiting for stack operation to complete..."
    aws cloudformation wait $WAITER --stack-name "$STACK_NAME"
    
    log "✅ Stack operation completed successfully!"
}

# Get and display stack outputs
show_stack_outputs() {
    log "📋 Stack Outputs:"
    
    local outputs
    outputs=$(aws cloudformation describe-stacks \
        --stack-name "$STACK_NAME" \
        --query 'Stacks[0].Outputs' \
        --output table 2>/dev/null || echo "[]")
    
    if [[ "$outputs" != "[]" ]]; then
        echo "$outputs"
    else
        echo "No outputs available"
    fi
    
    # Get specific outputs for easier access
    local sns_topic_arn
    sns_topic_arn=$(aws cloudformation describe-stacks \
        --stack-name "$STACK_NAME" \
        --query 'Stacks[0].Outputs[?OutputKey==`SNSTopicArn`].OutputValue' \
        --output text 2>/dev/null || echo "Not available")
    
    local dashboard_url
    dashboard_url=$(aws cloudformation describe-stacks \
        --stack-name "$STACK_NAME" \
        --query 'Stacks[0].Outputs[?OutputKey==`DashboardURL`].OutputValue' \
        --output text 2>/dev/null || echo "Not available")
    
    echo
    log "🔗 Quick Links:"
    echo "📈 CloudWatch Dashboard: $dashboard_url"
    echo "🔔 SNS Topic ARN: $sns_topic_arn"
}

# Update Lambda function code
update_lambda_code() {
    local function_name="$1"
    local code_file="$2"
    
    if [[ ! -f "$code_file" ]]; then
        log "⚠️  Warning: Lambda code file not found: $code_file"
        return 0
    fi
    
    log "📦 Updating Lambda function code: $function_name"
    
    # Create deployment package
    local temp_dir
    temp_dir=$(mktemp -d)
    cp "$code_file" "$temp_dir/lambda_function.py"
    
    cd "$temp_dir"
    zip -q function.zip lambda_function.py
    
    # Update function code
    aws lambda update-function-code \
        --function-name "$function_name" \
        --zip-file fileb://function.zip \
        > /dev/null
    
    cd - > /dev/null
    rm -rf "$temp_dir"
    
    log "✅ Lambda function updated: $function_name"
}

# Deploy Lambda function code
deploy_lambda_functions() {
    log "🔧 Deploying Lambda function code..."
    
    # Get function names from stack outputs
    local budget_function
    budget_function=$(aws cloudformation describe-stacks \
        --stack-name "$STACK_NAME" \
        --query 'Stacks[0].Outputs[?OutputKey==`BudgetShutdownFunctionArn`].OutputValue' \
        --output text 2>/dev/null || echo "")
    
    local scheduler_function
    scheduler_function=$(aws cloudformation describe-stacks \
        --stack-name "$STACK_NAME" \
        --query 'Stacks[0].Outputs[?OutputKey==`ResourceSchedulerFunctionArn`].OutputValue' \
        --output text 2>/dev/null || echo "")
    
    local s3_optimizer_function
    s3_optimizer_function=$(aws cloudformation describe-stacks \
        --stack-name "$STACK_NAME" \
        --query 'Stacks[0].Outputs[?OutputKey==`S3LifecycleOptimizerFunctionArn`].OutputValue' \
        --output text 2>/dev/null || echo "")
    
    # Update function codes if files exist
    if [[ -n "$budget_function" && "$budget_function" != "None" ]]; then
        local function_name
        function_name=$(basename "$budget_function")
        update_lambda_code "$function_name" "$SCRIPT_DIR/../lambda-functions/budget-shutdown-handler.py"
    fi
    
    if [[ -n "$scheduler_function" && "$scheduler_function" != "None" ]]; then
        local function_name
        function_name=$(basename "$scheduler_function")
        update_lambda_code "$function_name" "$SCRIPT_DIR/../lambda-functions/resource-scheduler.py"
    fi
    
    if [[ -n "$s3_optimizer_function" && "$s3_optimizer_function" != "None" ]]; then
        local function_name
        function_name=$(basename "$s3_optimizer_function")
        update_lambda_code "$function_name" "$SCRIPT_DIR/../lambda-functions/s3-lifecycle-optimizer.py"
    fi
}

# Test deployment
test_deployment() {
    log "🧪 Testing deployment..."
    
    # Test SNS topic
    local sns_topic_arn
    sns_topic_arn=$(aws cloudformation describe-stacks \
        --stack-name "$STACK_NAME" \
        --query 'Stacks[0].Outputs[?OutputKey==`SNSTopicArn`].OutputValue' \
        --output text 2>/dev/null || echo "")
    
    if [[ -n "$sns_topic_arn" && "$sns_topic_arn" != "None" ]]; then
        log "✅ SNS Topic accessible: $sns_topic_arn"
        
        # Send test message
        aws sns publish \
            --topic-arn "$sns_topic_arn" \
            --message "Test message from budget automation deployment" \
            --subject "Budget Automation Test" \
            > /dev/null
        
        log "📧 Test notification sent"
    else
        log "⚠️  Warning: SNS Topic ARN not found"
    fi
    
    # Check budget
    local budget_name="$STACK_NAME-monthly-budget"
    if aws budgets describe-budget --account-id "$(aws sts get-caller-identity --query Account --output text)" --budget-name "$budget_name" &>/dev/null; then
        log "✅ Budget created successfully: $budget_name"
    else
        log "⚠️  Warning: Budget not found: $budget_name"
    fi
    
    # Check Lambda functions
    local functions=(
        "$STACK_NAME-budget-shutdown"
        "$STACK_NAME-resource-scheduler"
        "$STACK_NAME-s3-lifecycle-optimizer"
    )
    
    for func in "${functions[@]}"; do
        if aws lambda get-function --function-name "$func" &>/dev/null; then
            log "✅ Lambda function ready: $func"
        else
            log "⚠️  Warning: Lambda function not found: $func"
        fi
    done
}

# Generate post-deployment instructions
show_next_steps() {
    log "🎯 Next Steps:"
    echo
    echo "1. 📧 Check your email ($ALERT_EMAIL) and confirm SNS subscription"
    echo "2. 📈 Visit CloudWatch Dashboard to monitor costs"
    echo "3. 🏷️  Tag your resources with '$SCHEDULER_TAG_KEY' for automated scheduling"
    echo "4. 🔧 Configure resource schedules using the resource-scheduler script"
    echo "5. 📊 Run cost analysis scripts to establish baseline costs"
    echo
    echo "📋 Useful Commands:"
    echo "  • View stack: aws cloudformation describe-stacks --stack-name $STACK_NAME"
    echo "  • Update budget: BUDGET_LIMIT=30 $0"
    echo "  • Delete stack: aws cloudformation delete-stack --stack-name $STACK_NAME"
    echo "  • Check logs: aws logs tail /aws/lambda/$STACK_NAME-budget-shutdown"
    echo
    echo "🗂️  Available Scripts:"
    echo "  • Daily cost report: $SCRIPT_DIR/../cost-management/daily-cost-report.sh"
    echo "  • Resource scheduler: $SCRIPT_DIR/resource-scheduler.sh"
    echo "  • Unused cleanup: $SCRIPT_DIR/unused-resource-cleanup.sh"
    echo
    echo "⚠️  Important:"
    echo "  • Budget alerts may take 24-48 hours to become active"
    echo "  • Test automated shutdown in a non-production environment first"
    echo "  • Monitor CloudWatch logs for function execution"
    echo "  • Review and adjust budget thresholds as needed"
}

# Main execution
main() {
    local action="${1:-deploy}"
    
    case "$action" in
        "deploy")
            echo -e "${BLUE}🚀 AWS Budget Automation Infrastructure Deployment${NC}"
            echo "=================================================="
            
            check_prerequisites
            validate_email "$ALERT_EMAIL"
            deploy_stack
            show_stack_outputs
            deploy_lambda_functions
            test_deployment
            show_next_steps
            
            echo
            log "✅ Budget automation infrastructure deployed successfully!"
            ;;
        
        "update")
            log "🔄 Updating stack..."
            check_prerequisites
            validate_email "$ALERT_EMAIL"
            deploy_stack
            deploy_lambda_functions
            log "✅ Stack updated successfully!"
            ;;
        
        "status")
            log "📋 Stack Status:"
            aws cloudformation describe-stacks --stack-name "$STACK_NAME" --query 'Stacks[0].StackStatus' --output text 2>/dev/null || echo "Stack not found"
            show_stack_outputs
            ;;
        
        "delete")
            log "🗑️  Deleting stack..."
            echo -e "${YELLOW}Are you sure you want to delete the stack '$STACK_NAME'? (y/N)${NC}"
            read -r confirmation
            if [[ "$confirmation" =~ ^[Yy]$ ]]; then
                aws cloudformation delete-stack --stack-name "$STACK_NAME"
                log "⏳ Waiting for stack deletion..."
                aws cloudformation wait stack-delete-complete --stack-name "$STACK_NAME"
                log "✅ Stack deleted successfully!"
            else
                log "❌ Stack deletion cancelled"
            fi
            ;;
        
        "help"|"-h"|"--help")
            echo "Budget Automation Infrastructure Deployment"
            echo "==========================================="
            echo ""
            echo "USAGE:"
            echo "  ALERT_EMAIL=your@email.com $0 [COMMAND]"
            echo ""
            echo "COMMANDS:"
            echo "  deploy       Deploy the complete infrastructure (default)"
            echo "  update       Update existing stack"
            echo "  status       Show stack status and outputs"
            echo "  delete       Delete the stack"
            echo "  help         Show this help message"
            echo ""
            echo "ENVIRONMENT VARIABLES:"
            echo "  ALERT_EMAIL          Email for budget alerts (required)"
            echo "  STACK_NAME           CloudFormation stack name (default: aws-budget-automation)"
            echo "  BUDGET_LIMIT         Monthly budget limit in USD (default: 20)"
            echo "  ENABLE_SHUTDOWN      Enable automated shutdown (default: true)"
            echo "  SCHEDULER_TAG_KEY    Tag key for resource scheduling (default: AutoSchedule)"
            echo "  ENVIRONMENT          Environment name (default: dev)"
            echo ""
            echo "EXAMPLES:"
            echo "  ALERT_EMAIL=admin@company.com $0 deploy"
            echo "  BUDGET_LIMIT=50 ALERT_EMAIL=admin@company.com $0 update"
            echo "  $0 status"
            echo "  $0 delete"
            ;;
        
        *)
            echo -e "${RED}Unknown command: $action${NC}"
            echo "Use '$0 help' for usage information"
            exit 1
            ;;
    esac
}

# Execute main function with all arguments
main "$@"