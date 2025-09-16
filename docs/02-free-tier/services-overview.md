# Free Tier Services - Quick Reference

**Account Type:** Pre-July 2025 (12 months Free Tier)  
**Limits:** Monthly, cannot accumulate, region-wide calculation

## Core Services for Projects

### **12-Month Free Tier (expires after 12 months)**
- **EC2:** 750h/month t3.micro + 30GB EBS + 15GB data transfer
- **RDS:** 750h/month db.t3.micro + 20GB storage + 10M I/Os
- **S3:** 5GB storage + 20k GET + 2k PUT requests
- **ALB:** 750h/month + 15 LCU

### **Always Free (permanent)**
- **Lambda:** 1M requests + 400k GB-seconds/month
- **DynamoDB:** 25 RCU/WCU + 25GB storage
- **CloudFront:** 1TB transfer + 10M requests/month
- **SNS:** 1M publishes + 100k HTTP/1k email deliveries
- **SQS:** 1M requests/month
- **CloudWatch:** 10 metrics + 10 alarms + 5GB logs

## Quick Start Project Combinations

**Traditional Web App:**
- EC2 t3.micro + RDS t3.micro + S3 + CloudFront
- Cost: $0-5/month (first 12 months)

**Serverless App:**
- Lambda + DynamoDB + S3 + CloudFront
- Cost: $0/month (permanent with Always Free)

## Cost Traps to Avoid
- **Elastic IPs:** $0.005/hour when unattached
- **NAT Gateways:** ~$45/month (not in Free Tier)
- **Multi-AZ RDS:** Only Single-AZ is free
- **EBS GP3:** Only GP2 included (30GB)

## Monitoring Setup
Use the monitoring scripts in `scripts/monitoring/` to track usage and avoid overages.
