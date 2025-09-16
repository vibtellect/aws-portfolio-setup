# Official Free Tier Limits (Pre-July 2025)

**Account Type:** 12-month Free Tier  
**Duration:** 12 months from account activation  
**Calculation:** Region-wide, monthly limits

## Free Tier Limits

| Service | Limit | Duration | Notes |
|---------|-------|----------|-------|
| **EC2** | 750h/month t3.micro | 12 months | +30GB EBS, 15GB transfer |
| **RDS** | 750h/month db.t3.micro | 12 months | +20GB storage, Single-AZ only |
| **S3** | 5GB + 20k GET + 2k PUT | 12 months | Standard storage class |
| **ALB** | 750h/month + 15 LCU | 12 months | Application Load Balancer |
| **Lambda** | 1M requests + 400k GB-sec | Always Free | Permanent |
| **DynamoDB** | 25 RCU/WCU + 25GB | Always Free | Permanent |
| **CloudFront** | 1TB transfer + 10M requests | Always Free | Permanent |
| **SNS** | 1M publishes + 100k HTTP | Always Free | Permanent |
| **SQS** | 1M requests | Always Free | Permanent |
| **CloudWatch** | 10 metrics + 10 alarms | Always Free | +5GB logs |

## Important Rules

**Regional Calculation:**
- Limits apply across ALL regions (not per-region)
- Usage aggregated globally, billed monthly

**Monthly Reset:**
- Unused capacity expires at month end
- No rollover to next month

**After 12 Months:**
- 12-month services become paid
- Always Free services remain free forever

## Cost Optimization

**Recommended Architecture:**
```
EC2 t3.micro + RDS t3.micro + S3 + CloudFront
Estimated cost: $0-5/month (first 12 months)
```

**Avoid These Costs:**
- NAT Gateway: ~$45/month
- Unattached Elastic IPs: $0.005/hour
- Multi-AZ RDS: Only Single-AZ is free
- EBS GP3: Only GP2 included

## Monitoring

- **Built-in alerts** at 85% usage
- **Free Tier Dashboard** in AWS Console
- **Use monitoring scripts** in this repo

---

**📚 References:**  
[AWS Free Tier Documentation](https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/billing-free-tier.html)
