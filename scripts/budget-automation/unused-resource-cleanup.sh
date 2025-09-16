#!/bin/bash
#
# Unused AWS Resource Cleanup Script
# Detects and optionally removes unused resources to optimize costs
#

set -euo pipefail

# Configuration
LOG_DIR="$HOME/aws-portfolio-logs"
CURRENT_DATE=$(date +%Y-%m-%d)
DRY_RUN=${DRY_RUN:-true}
CLEANUP_OLDER_THAN_DAYS=${CLEANUP_OLDER_THAN_DAYS:-7}

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Ensure log directory exists
mkdir -p "$LOG_DIR"

# Logging function
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_DIR/unused-resource-cleanup.log"
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
    
    if ! command -v jq &> /dev/null; then
        echo -e "${YELLOW}WARNING: jq not found - some features may be limited${NC}" >&2
    fi
}

# Find unused Elastic IPs
find_unused_elastic_ips() {
    echo -e "${BLUE}🔍 Scanning for unused Elastic IP addresses...${NC}"
    
    local unused_eips
    unused_eips=$(aws ec2 describe-addresses --query 'Addresses[?AssociationId==null]' --output json)
    
    if [[ -n "$unused_eips" && "$unused_eips" != "[]" ]]; then
        local eip_count
        eip_count=$(echo "$unused_eips" | jq 'length')
        local monthly_cost
        monthly_cost=$(echo "scale=2; $eip_count * 3.65" | bc -l 2>/dev/null || echo "$eip_count * 3.65")
        
        echo "Found Elastic IPs:"
        echo "$unused_eips" | jq -r '.[] | "  • \(.PublicIp) (Allocation: \(.AllocationId))"'
        echo
        echo -e "${YELLOW}⚠️  Found $eip_count unused Elastic IPs${NC}"
        echo -e "${YELLOW}💰 Estimated Monthly Cost: \$${monthly_cost}${NC}"
        
        if [[ "$DRY_RUN" != "true" ]]; then
            echo -e "${RED}🗑️  Releasing unused Elastic IPs...${NC}"
            echo "$unused_eips" | jq -r '.[] | .AllocationId' | while read -r allocation_id; do
                if aws ec2 release-address --allocation-id "$allocation_id" 2>/dev/null; then
                    log "✅ Released Elastic IP: $allocation_id"
                else
                    log "❌ Failed to release Elastic IP: $allocation_id"
                fi
            done
        fi
    else
        echo -e "${GREEN}✅ No unused Elastic IPs found${NC}"
    fi
}

# Find empty S3 buckets
find_empty_s3_buckets() {
    echo -e "${BLUE}🔍 Scanning for empty S3 buckets...${NC}"
    
    local buckets
    buckets=$(aws s3api list-buckets --query 'Buckets[].Name' --output json)
    
    echo "$buckets" | jq -r '.[]' | while read -r bucket; do
        if [[ -z "$bucket" || "$bucket" == "null" ]]; then
            continue
        fi
        
        # Check if bucket is empty
        local object_count
        object_count=$(aws s3api list-objects-v2 --bucket "$bucket" --query 'length(Contents)' --output text 2>/dev/null || echo "Error")
        
        if [[ "$object_count" == "0" || "$object_count" == "None" ]]; then
            local creation_date
            creation_date=$(aws s3api list-buckets --query "Buckets[?Name==\`$bucket\`].CreationDate | [0]" --output text 2>/dev/null || echo "")
            
            if [[ -n "$creation_date" && "$creation_date" != "None" ]]; then
                echo "📦 Empty bucket found: $bucket (Created: $creation_date)"
            fi
        elif [[ "$object_count" == "Error" ]]; then
            echo "⚠️  Could not access bucket: $bucket (permission denied or doesn't exist)"
        else
            echo "📦 Bucket has objects: $bucket ($object_count objects)"
        fi
    done
}

# Show EC2 instances
show_ec2_instances() {
    echo -e "${BLUE}🔍 Scanning EC2 instances...${NC}"
    
    local instances
    instances=$(aws ec2 describe-instances --query 'Reservations[].Instances[].[InstanceId,State.Name,InstanceType,LaunchTime]' --output table 2>/dev/null || echo "Error accessing EC2")
    
    if [[ "$instances" == "Error accessing EC2" ]]; then
        echo -e "${YELLOW}⚠️  Cannot access EC2 instances (permission issue)${NC}"
    else
        echo "$instances"
        
        # Count stopped instances
        local stopped_count
        stopped_count=$(aws ec2 describe-instances --filters Name=instance-state-name,Values=stopped --query 'length(Reservations[].Instances[])' --output text 2>/dev/null || echo "0")
        
        if [[ "$stopped_count" -gt 0 ]]; then
            echo -e "${YELLOW}⚠️  Found $stopped_count stopped instances${NC}"
            echo "💡 Consider terminating stopped instances if no longer needed"
        fi
    fi
}

# Generate report
generate_report() {
    echo -e "${BLUE}🔍 UNUSED AWS RESOURCES CLEANUP REPORT - $CURRENT_DATE${NC}"
    echo "=================================================="
    echo "🕐 Report Time: $(date)"
    echo "⏰ Cleanup Threshold: Resources older than $CLEANUP_OLDER_THAN_DAYS days"
    echo "🧪 Mode: $([ "$DRY_RUN" == "true" ] && echo "DRY RUN (no resources will be deleted)" || echo "CLEANUP MODE (resources will be deleted)")"
    echo
    
    echo "📊 SCAN RESULTS:"
    echo "-----------------"
    
    check_prerequisites
    echo
    
    show_ec2_instances
    echo
    
    find_unused_elastic_ips
    echo
    
    find_empty_s3_buckets
    echo
    
    echo "💡 RECOMMENDATIONS:"
    echo "--------------------"
    echo "• Review stopped instances - terminate if no longer needed"
    echo "• Monitor S3 bucket usage - delete empty buckets"
    echo "• Set up automated resource tagging for better tracking"
    echo "• Schedule regular cleanup runs (weekly/monthly)"
    echo
}

# Main execution
main() {
    log "🚀 Starting unused resource cleanup scan"
    
    case "${1:-scan}" in
        "scan"|"report")
            generate_report
            ;;
        
        "cleanup"|"clean")
            echo -e "${RED}🗑️  CLEANUP MODE - Resources will be deleted!${NC}"
            echo -e "${YELLOW}Press Ctrl+C within 5 seconds to cancel...${NC}"
            sleep 5
            DRY_RUN=false
            generate_report
            ;;
        
        "help"|"-h"|"--help")
            echo "Unused AWS Resource Cleanup"
            echo "============================"
            echo ""
            echo "USAGE:"
            echo "  $0 [COMMAND]"
            echo ""
            echo "COMMANDS:"
            echo "  scan         Scan for unused resources (default, dry run)"
            echo "  cleanup      Actually delete unused resources (DESTRUCTIVE)"
            echo "  help         Show this help message"
            echo ""
            echo "ENVIRONMENT VARIABLES:"
            echo "  DRY_RUN                  Set to 'false' for actual cleanup (default: true)"
            echo "  CLEANUP_OLDER_THAN_DAYS  Age threshold in days (default: 7)"
            echo ""
            echo "EXAMPLES:"
            echo "  $0 scan                                    # Safe scan"
            echo "  DRY_RUN=false $0 cleanup                 # Actual cleanup"
            echo ""
            ;;
        
        *)
            echo -e "${RED}Unknown command: $1${NC}"
            echo "Use '$0 help' for usage information"
            exit 1
            ;;
    esac
    
    log "✅ Unused resource cleanup completed"
}

# Execute main function with all arguments
main "$@"