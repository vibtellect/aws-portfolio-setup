# Free Tier Monitoring - Quick Setup

## Automated Monitoring Setup

**Run the complete monitoring setup:**
```bash
# Setup all monitoring infrastructure
./scripts/monitoring/cost-management.sh setup

# Deploy Lambda alerts
./scripts/monitoring/deploy-lambda.sh --email your-email@domain.com

# Create CloudWatch dashboard
./scripts/monitoring/setup-dashboard.sh
```

## Daily Commands

**Check current usage:**
```bash
./scripts/monitoring/free-tier-monitor.py
```

**Resource management:**
```bash
# Start development environment
./scripts/monitoring/cost-management.sh start

# Stop development environment (save costs)
./scripts/monitoring/cost-management.sh stop

# Monitor costs
./scripts/monitoring/cost-management.sh monitor

# Analyze trends
./scripts/monitoring/cost-management.sh analyze

# Clean up unused resources
./scripts/monitoring/cost-management.sh cleanup
```

## Key Dashboards & Alerts

**Access AWS Free Tier Dashboard:**
- Console → Billing → Free Tier
- URL: https://console.aws.amazon.com/billing/home#/freetier

**CloudWatch Dashboard:** 
- Created automatically by setup scripts
- Shows real-time usage across all Free Tier services

## Automated Scheduling

**Daily monitoring (automatic):**
- Lambda function runs at 08:00 UTC daily
- Sends email alerts for >75% usage
- Logs to CloudWatch

**Manual scheduling:**
```bash
# Add to crontab for additional monitoring
crontab -e
# Add: 0 20 * * * /path/to/cost-management.sh monitor
```

## Troubleshooting

**No usage data:**
```bash
# Check account type and API availability
aws sts get-caller-identity
aws ce get-free-tier-usage --time-period Start=2024-01-01,End=2024-02-01
```

**Alerts not working:**
```bash
# Check SNS subscriptions
aws sns list-subscriptions
```

## Best Practices

1. **Tag all resources** with Project/Environment tags
2. **Use start/stop scripts** for development environments
3. **Check usage daily** during first month
4. **Set up cleanup automation** for unused resources
