# AWS Free Tier Monitoring Scripts

Comprehensive monitoring and cost management tools for AWS Free Tier usage.

## Quick Setup

**Prerequisites:**
- AWS CLI installed and configured
- Python 3.7+ with boto3
- Bash shell

**One-time setup:**
```bash
# 1. Run complete monitoring setup
./cost-management.sh setup

# 2. Deploy automated Lambda alerts
./deploy-lambda.sh --email your-email@domain.com

# 3. Create CloudWatch dashboard
./setup-dashboard.sh
```

## Daily Usage

**Check Free Tier usage:**
```bash
./free-tier-monitor.py
```

**Resource management:**
```bash
# Start development environment
./cost-management.sh start

# Stop development environment (saves costs)
./cost-management.sh stop

# Monitor current usage
./cost-management.sh monitor

# Clean up unused resources
./cost-management.sh cleanup
```

## Files Overview

| File | Description |
|------|-------------|
| `free-tier-monitor.py` | Python script for detailed usage monitoring |
| `cost-management.sh` | Main automation script for resource management |
| `deploy-lambda.sh` | Deploy serverless monitoring function |
| `lambda-alert-function.py` | Lambda function code for automated alerts |
| `setup-dashboard.sh` | Create CloudWatch monitoring dashboard |
| `cloudwatch-dashboard.json` | Dashboard configuration |

## Automation Features

- **Daily monitoring**: Lambda runs at 08:00 UTC, sends alerts >75% usage
- **Resource start/stop**: Automated development environment management
- **Usage cleanup**: Removes unused EBS volumes, Elastic IPs, old snapshots
- **Cost tracking**: Detailed analysis and forecasting
- **Alert system**: SNS notifications for threshold breaches

## Monitoring Thresholds

- **Warning**: 75% of Free Tier limit
- **Critical**: 90% of Free Tier limit
- **Forecast alerts**: Predicted month-end overages

## Key Benefits

1. **Proactive monitoring** - Catch usage spikes before they cost money
2. **Automated resource management** - Start/stop dev environments on schedule
3. **Cost optimization** - Clean up unused resources automatically  
4. **Visual dashboards** - Real-time usage tracking in CloudWatch
5. **Email alerts** - Get notified before hitting limits

## Troubleshooting

**Script not executable:**
```bash
chmod +x *.sh *.py
```

**AWS credentials:**
```bash
aws configure
# or
export AWS_DEFAULT_REGION=eu-central-1
```

**Python dependencies:**
```bash
pip install boto3
```

**No usage data:**
- Check account type (must be pre-July 2025)
- Verify Cost Explorer API access
- Scripts fall back to basic cost analysis

---

For detailed Free Tier information, see [`/docs/02-free-tier/`](../../docs/02-free-tier/).