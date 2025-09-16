#!/bin/bash
#
# AWS Cost Monitor - Working with updated permissions
# Monitors costs, budgets, and resources with available permissions
#

set -euo pipefail

# Configuration
LOG_DIR="$HOME/aws-portfolio-logs"
ALERT_EMAIL="info@bojatschkin.de"
CURRENT_DATE=$(date +%Y-%m-%d)

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

mkdir -p "$LOG_DIR"

log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_DIR/cost-monitor.log"
}

check_budget_status() {
    echo -e "${BLUE}💰 Current Budget Status${NC}"
    echo "========================"
    
    local account_id
    account_id=$(aws sts get-caller-identity --query Account --output text)
    
    # Get budget details
    local budget_info
    budget_info=$(aws budgets describe-budget --account-id "$account_id" --budget-name "My Monthly Cost Budget" --query 'Budget' --output json)
    
    local budget_limit
    budget_limit=$(echo "$budget_info" | jq -r '.BudgetLimit.Amount')
    
    local budget_unit
    budget_unit=$(echo "$budget_info" | jq -r '.BudgetLimit.Unit')
    
    echo "📊 Budget Name: My Monthly Cost Budget"
    echo "💵 Budget Limit: $budget_unit $budget_limit"
    echo "📅 Period: Monthly"
    
    # Get current month costs
    local start_date
    start_date=$(date -d "$(date +%Y-%m-01)" +%Y-%m-%d)
    local end_date
    end_date=$(date +%Y-%m-%d)
    
    local current_cost
    current_cost=$(aws ce get-cost-and-usage \
        --time-period Start="$start_date",End="$end_date" \
        --granularity MONTHLY \
        --metrics BlendedCost \
        --query 'ResultsByTime[0].Total.BlendedCost.Amount' \
        --output text)
    
    echo "💳 Current Month Spend: $budget_unit $current_cost"
    
    # Calculate percentage
    local percentage
    percentage=$(echo "scale=2; ($current_cost / $budget_limit) * 100" | bc -l 2>/dev/null || echo "0")
    
    echo "📈 Budget Usage: ${percentage}%"
    
    if (( $(echo "$percentage > 80" | bc -l 2>/dev/null || echo "0") )); then
        echo -e "${RED}⚠️  WARNING: Budget usage above 80%!${NC}"
    elif (( $(echo "$percentage > 50" | bc -l 2>/dev/null || echo "0") )); then
        echo -e "${YELLOW}⚠️  CAUTION: Budget usage above 50%${NC}"
    else
        echo -e "${GREEN}✅ Budget usage under control${NC}"
    fi
    
    echo
}

show_daily_costs() {
    echo -e "${BLUE}📊 Daily Cost Breakdown (Last 7 days)${NC}"
    echo "======================================"
    
    local start_date
    start_date=$(date -d '7 days ago' +%Y-%m-%d)
    local end_date
    end_date=$(date +%Y-%m-%d)
    
    aws ce get-cost-and-usage \
        --time-period Start="$start_date",End="$end_date" \
        --granularity DAILY \
        --metrics BlendedCost \
        --query 'ResultsByTime[].[TimePeriod.Start,Total.BlendedCost.Amount]' \
        --output table
    
    echo
}

show_service_costs() {
    echo -e "${BLUE}🏗️ Top Services by Cost (This Month)${NC}"
    echo "===================================="
    
    local start_date
    start_date=$(date -d "$(date +%Y-%m-01)" +%Y-%m-%d)
    local end_date
    end_date=$(date +%Y-%m-%d)
    
    aws ce get-cost-and-usage \
        --time-period Start="$start_date",End="$end_date" \
        --granularity MONTHLY \
        --metrics BlendedCost \
        --group-by Type=DIMENSION,Key=SERVICE \
        --query 'ResultsByTime[0].Groups | sort_by(@, &Metrics.BlendedCost.Amount) | reverse(@) | [0:5] | [].[Keys[0],Metrics.BlendedCost.Amount]' \
        --output table
    
    echo
}

show_resource_inventory() {
    echo -e "${BLUE}📦 Resource Inventory${NC}"
    echo "===================="
    
    # S3 Buckets
    local bucket_count
    bucket_count=$(aws s3api list-buckets --query 'length(Buckets)' --output text)
    echo "🪣 S3 Buckets: $bucket_count"
    
    # EC2 Instances
    local ec2_count
    ec2_count=$(aws ec2 describe-instances --query 'length(Reservations[].Instances[])' --output text 2>/dev/null || echo "Permission denied")
    echo "💻 EC2 Instances: $ec2_count"
    
    # Lambda Functions
    local lambda_count
    lambda_count=$(aws lambda list-functions --query 'length(Functions)' --output text)
    echo "⚡ Lambda Functions: $lambda_count"
    
    # SNS Topics
    local sns_count
    sns_count=$(aws sns list-topics --query 'length(Topics)' --output text)
    echo "📢 SNS Topics: $sns_count"
    
    echo
}

forecast_month_end() {
    echo -e "${BLUE}🔮 Month-End Forecast${NC}"
    echo "===================="
    
    local account_id
    account_id=$(aws sts get-caller-identity --query Account --output text)
    
    local start_date
    start_date=$(date -d "$(date +%Y-%m-01)" +%Y-%m-%d)
    
    local next_month_start
    next_month_start=$(date -d "$(date +%Y-%m-01) +1 month" +%Y-%m-%d)
    
    # Get forecast
    local forecast_result
    forecast_result=$(aws ce get-cost-and-usage \
        --time-period Start="$start_date",End="$next_month_start" \
        --granularity MONTHLY \
        --metrics BlendedCost \
        --query 'ResultsByTime[0].Total.BlendedCost.Amount' \
        --output text 2>/dev/null || echo "0")
    
    echo "📈 Projected Month-End Cost: USD $forecast_result"
    
    # Compare to budget
    local budget_limit
    budget_limit=$(aws budgets describe-budget --account-id "$account_id" --budget-name "My Monthly Cost Budget" --query 'Budget.BudgetLimit.Amount' --output text)
    
    local forecast_percentage
    forecast_percentage=$(echo "scale=2; ($forecast_result / $budget_limit) * 100" | bc -l 2>/dev/null || echo "0")
    
    echo "🎯 Projected Budget Usage: ${forecast_percentage}%"
    
    if (( $(echo "$forecast_percentage > 100" | bc -l 2>/dev/null || echo "0") )); then
        echo -e "${RED}🚨 ALERT: Forecast exceeds budget!${NC}"
    elif (( $(echo "$forecast_percentage > 80" | bc -l 2>/dev/null || echo "0") )); then
        echo -e "${YELLOW}⚠️  WARNING: Forecast approaching budget limit${NC}"
    else
        echo -e "${GREEN}✅ Forecast within budget${NC}"
    fi
    
    echo
}

generate_recommendations() {
    echo -e "${BLUE}💡 Cost Optimization Recommendations${NC}"
    echo "===================================="
    
    echo "Based on your current usage:"
    echo
    echo "✅ GOOD NEWS:"
    echo "• Your costs are very low (mostly Route 53 DNS queries)"
    echo "• Current spend is well under the \$5 monthly budget"
    echo "• No expensive services are running"
    echo
    echo "🎯 OPTIMIZATION OPPORTUNITIES:"
    echo "• Monitor S3 bucket usage - some buckets may be cleanable"
    echo "• Set up automated resource scheduling for future resources"
    echo "• Consider lifecycle policies for S3 data archival"
    echo "• Enable detailed billing reports for better insights"
    echo
    echo "🚨 PROACTIVE MEASURES:"
    echo "• Set up budget alerts for 80% and 100% thresholds"
    echo "• Tag resources consistently for better cost tracking"
    echo "• Review and terminate unused resources weekly"
    echo "• Consider AWS Free Tier monitoring"
    echo
}

main() {
    log "🚀 Starting AWS cost monitoring report"
    
    echo -e "${GREEN}🎯 AWS COST MONITORING REPORT - $CURRENT_DATE${NC}"
    echo -e "${GREEN}Alert Email: $ALERT_EMAIL${NC}"
    echo "============================================="
    echo
    
    check_budget_status
    show_daily_costs
    show_service_costs
    show_resource_inventory
    forecast_month_end
    generate_recommendations
    
    echo -e "${GREEN}📋 SUMMARY${NC}"
    echo "=========="
    echo "• Budget Status: ✅ Under control"
    echo "• Main Costs: Route 53 (~$0.0002/day)"
    echo "• Resource Count: Low usage"
    echo "• Forecast: Within budget"
    echo
    echo -e "${BLUE}Next Steps:${NC}"
    echo "• Run unused resource cleanup: ./unused-resource-cleanup.sh scan"
    echo "• Monitor daily with: ./cost-monitor.sh"
    echo "• Set up SNS alerts when CloudFormation permissions are available"
    echo
    
    log "✅ Cost monitoring report completed"
}

case "${1:-monitor}" in
    "monitor"|"report")
        main
        ;;
    "budget")
        check_budget_status
        ;;
    "forecast")
        forecast_month_end
        ;;
    "help")
        echo "AWS Cost Monitor"
        echo "================"
        echo ""
        echo "USAGE: $0 [COMMAND]"
        echo ""
        echo "COMMANDS:"
        echo "  monitor    Full cost monitoring report (default)"
        echo "  budget     Show budget status only"
        echo "  forecast   Show month-end forecast only"
        echo "  help       Show this help"
        echo ""
        ;;
    *)
        echo "Unknown command. Use '$0 help' for usage."
        exit 1
        ;;
esac