# 💰 AWS Budget Management - Vollständige Kostenkontrolle

**Ziel:** Proaktive Budgetüberwachung mit automatischen Schutzmaßnahmen  
**Budget:** 10-15€/Monat für Portfolio-Projekte  
**Schutzfunktionen:** Automatic Shutdown bei Budgetüberschreitung

---

## 🎯 **Budget-Strategie Übersicht**

### **Dreistufiges Budget-System:**
```
┌─────────────────────────────────────────────────────────┐
│  BUDGET LEVEL          │  AMOUNT  │  ACTION               │
├─────────────────────────────────────────────────────────┤
│  🟢 Development        │  5€      │  Normal Operations    │
│  🟡 Warning            │  10€     │  Email Alerts         │
│  🔴 Critical           │  15€     │  Auto-Shutdown        │
└─────────────────────────────────────────────────────────┘
```

### **Budget-Kategorien:**
- **Free Tier Tracking:** 0€ Budget für Free Tier Überschreitung
- **Development Budget:** 5€ für tägliche Entwicklungsarbeit
- **Demo Budget:** 10€ für Präsentationen und Tests
- **Emergency Budget:** 15€ mit automatischem Shutdown

---

## 🔧 **AWS Budgets Konfiguration**

### **1. Free Tier Overage Budget**
```bash
# AWS Console → Cost Management → Budgets → Create budget

Budget Details:
- Name: "Free-Tier-Overage-Alert"  
- Budget type: Cost budget
- Amount: $0.00
- Time period: Monthly, Recurring
- Start date: Current month
- End date: No end date

Scope:
- Include: All AWS services
- Filters: None (alle Services überwachen)

Alerts:
- Alert 1: Actual cost > $0.01 (sofort bei ersten Kosten)
- Recipients: your-email@domain.com
```

### **2. Development Budget (5€)**
```bash
Budget Details:
- Name: "Development-Portfolio-Budget"
- Budget type: Cost budget  
- Amount: $5.00
- Time period: Monthly, Recurring

Scope:
- Include: All AWS services
- Tags: Environment=Development

Alerts:
Alert 1 (Warning):
- Alert type: Actual
- Threshold: $2.50 (50%)
- Recipients: your-email@domain.com

Alert 2 (Critical):
- Alert type: Forecasted
- Threshold: $5.00 (100%)
- Recipients: your-email@domain.com
- Action: Trigger Lambda shutdown function
```

### **3. Demo/Presentation Budget (10€)**
```bash
Budget Details:
- Name: "Demo-Presentation-Budget"
- Amount: $10.00
- Tags: Environment=Demo

Alerts:
Alert 1: $5.00 (50%) - Email Warning
Alert 2: $8.00 (80%) - Stop non-essential services  
Alert 3: $10.00 (100%) - Full shutdown
```

### **4. Emergency Budget (15€)**
```bash
Budget Details:
- Name: "Emergency-Shutdown-Budget"
- Amount: $15.00
- Period: Monthly

Alerts:
Alert 1: $12.00 (80%) - Final warning + immediate review
Alert 2: $15.00 (100%) - Complete account shutdown
```

---

## 🚨 **Automatische Shutdown-Funktionen**

### **Budget-Triggered Lambda Function**

#### **Setup:**
```bash
# 1. IAM Role für Lambda erstellen
aws iam create-role --role-name BudgetShutdownRole --assume-role-policy-document file://trust-policy.json

# 2. Policy anhängen
aws iam attach-role-policy --role-name BudgetShutdownRole --policy-arn arn:aws:iam::aws:policy/PowerUserAccess

# 3. Lambda Function deployen
aws lambda create-function \
  --function-name budget-shutdown-handler \
  --runtime python3.9 \
  --role arn:aws:iam::ACCOUNT:role/BudgetShutdownRole \
  --handler lambda_function.lambda_handler \
  --zip-file fileb://budget-shutdown.zip \
  --timeout 300
```

#### **Lambda Shutdown Function:**
```python
import boto3
import json
import logging
from datetime import datetime

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event, context):
    """
    Budget Alert Handler - Automatic Cost Control
    Triggered by AWS Budgets when cost thresholds exceeded
    """
    
    # Parse budget alert
    budget_name = event.get('budgetName', 'Unknown')
    alert_type = event.get('alertType', 'UNKNOWN')
    threshold_percentage = float(event.get('thresholdPercentage', 0))
    
    logger.info(f"Budget Alert: {budget_name}, Type: {alert_type}, Threshold: {threshold_percentage}%")
    
    # Initialize AWS clients
    ec2 = boto3.client('ec2')
    rds = boto3.client('rds')
    ecs = boto3.client('ecs')
    lambda_client = boto3.client('lambda')
    sns = boto3.client('sns')
    
    actions_taken = []
    
    try:
        # Level 1: 50% - Warning Only
        if threshold_percentage >= 50 and threshold_percentage < 80:
            message = f"⚠️ BUDGET WARNING: {budget_name} reached {threshold_percentage}%"
            send_notification(sns, message, "Budget Warning")
            actions_taken.append("Warning notification sent")
        
        # Level 2: 80% - Stop Non-Essential Services  
        elif threshold_percentage >= 80 and threshold_percentage < 100:
            # Stop ECS Services
            ecs_actions = stop_ecs_services(ecs)
            actions_taken.extend(ecs_actions)
            
            # Stop non-tagged EC2 instances
            ec2_actions = stop_non_essential_ec2(ec2)
            actions_taken.extend(ec2_actions)
            
            message = f"🔴 BUDGET CRITICAL: {budget_name} reached {threshold_percentage}%. Non-essential services stopped."
            send_notification(sns, message, "Budget Critical - Services Stopped")
        
        # Level 3: 100% - Complete Shutdown
        elif threshold_percentage >= 100:
            # Stop all EC2 instances
            all_ec2_actions = stop_all_ec2_instances(ec2)
            actions_taken.extend(all_ec2_actions)
            
            # Stop all RDS instances  
            rds_actions = stop_all_rds_instances(rds)
            actions_taken.extend(rds_actions)
            
            # Stop all ECS services
            all_ecs_actions = stop_all_ecs_services(ecs)
            actions_taken.extend(all_ecs_actions)
            
            message = f"🚨 EMERGENCY SHUTDOWN: {budget_name} exceeded 100%. All services stopped!"
            send_notification(sns, message, "EMERGENCY - Complete Shutdown")
        
        logger.info(f"Actions taken: {actions_taken}")
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': f'Budget alert processed for {budget_name}',
                'actions_taken': actions_taken,
                'threshold': f'{threshold_percentage}%'
            })
        }
        
    except Exception as e:
        logger.error(f"Error processing budget alert: {str(e)}")
        
        # Send error notification
        error_message = f"❌ ERROR: Budget shutdown function failed. Manual intervention required. Error: {str(e)}"
        send_notification(sns, error_message, "Budget Function Error")
        
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': str(e),
                'budget': budget_name
            })
        }

def stop_ecs_services(ecs):
    """Stop all ECS services"""
    actions = []
    try:
        clusters = ecs.list_clusters()['clusterArns']
        for cluster_arn in clusters:
            services = ecs.list_services(cluster=cluster_arn)['serviceArns']
            for service_arn in services:
                ecs.update_service(
                    cluster=cluster_arn,
                    service=service_arn,
                    desiredCount=0
                )
                actions.append(f"Stopped ECS service: {service_arn.split('/')[-1]}")
    except Exception as e:
        actions.append(f"ECS stop error: {str(e)}")
    return actions

def stop_non_essential_ec2(ec2):
    """Stop EC2 instances not tagged as essential"""
    actions = []
    try:
        # Get instances without 'Essential=true' tag
        reservations = ec2.describe_instances(
            Filters=[
                {'Name': 'instance-state-name', 'Values': ['running']},
                {'Name': 'tag:Essential', 'Values': ['true']}
            ]
        )['Reservations']
        
        # This gets essential instances - we want to stop non-essential
        essential_instance_ids = []
        for reservation in reservations:
            for instance in reservation['Instances']:
                essential_instance_ids.append(instance['InstanceId'])
        
        # Get all running instances
        all_reservations = ec2.describe_instances(
            Filters=[{'Name': 'instance-state-name', 'Values': ['running']}]
        )['Reservations']
        
        # Stop non-essential instances
        for reservation in all_reservations:
            for instance in reservation['Instances']:
                instance_id = instance['InstanceId']
                if instance_id not in essential_instance_ids:
                    ec2.stop_instances(InstanceIds=[instance_id])
                    actions.append(f"Stopped EC2 instance: {instance_id}")
                    
    except Exception as e:
        actions.append(f"EC2 stop error: {str(e)}")
    return actions

def stop_all_ec2_instances(ec2):
    """Emergency stop of all EC2 instances"""
    actions = []
    try:
        reservations = ec2.describe_instances(
            Filters=[{'Name': 'instance-state-name', 'Values': ['running']}]
        )['Reservations']
        
        for reservation in reservations:
            for instance in reservation['Instances']:
                instance_id = instance['InstanceId']
                ec2.stop_instances(InstanceIds=[instance_id])
                actions.append(f"EMERGENCY STOP - EC2: {instance_id}")
                
    except Exception as e:
        actions.append(f"EC2 emergency stop error: {str(e)}")
    return actions

def stop_all_rds_instances(rds):
    """Stop all RDS instances"""
    actions = []
    try:
        instances = rds.describe_db_instances()['DBInstances']
        for instance in instances:
            if instance['DBInstanceStatus'] == 'available':
                db_identifier = instance['DBInstanceIdentifier']
                rds.stop_db_instance(DBInstanceIdentifier=db_identifier)
                actions.append(f"Stopped RDS instance: {db_identifier}")
                
    except Exception as e:
        actions.append(f"RDS stop error: {str(e)}")
    return actions

def stop_all_ecs_services(ecs):
    """Stop all ECS services (emergency)"""
    actions = []
    try:
        clusters = ecs.list_clusters()['clusterArns']
        for cluster_arn in clusters:
            services = ecs.list_services(cluster=cluster_arn)['serviceArns'] 
            for service_arn in services:
                ecs.update_service(
                    cluster=cluster_arn,
                    service=service_arn,
                    desiredCount=0
                )
                actions.append(f"EMERGENCY STOP - ECS: {service_arn.split('/')[-1]}")
    except Exception as e:
        actions.append(f"ECS emergency stop error: {str(e)}")
    return actions

def send_notification(sns, message, subject):
    """Send SNS notification"""
    try:
        sns.publish(
            TopicArn='arn:aws:sns:eu-central-1:ACCOUNT:budget-alerts',
            Message=message,
            Subject=subject
        )
    except Exception as e:
        logger.error(f"Failed to send notification: {str(e)}")
```

---

## 📊 **Cost Monitoring Dashboard**

### **Custom CloudWatch Dashboard:**
```json
{
  "widgets": [
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["AWS/Billing", "EstimatedCharges", "Currency", "USD"]
        ],
        "period": 86400,
        "stat": "Maximum", 
        "region": "us-east-1",
        "title": "Daily Estimated Charges"
      }
    },
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["AWS/Budgets", "ActualCost", "BudgetName", "Development-Portfolio-Budget"],
          [".", "ForecastedCost", ".", "."],
          [".", "BudgetLimit", ".", "."]
        ],
        "period": 86400,
        "stat": "Maximum",
        "region": "us-east-1",
        "title": "Budget vs Actual Costs"
      }
    }
  ]
}
```

### **Dashboard erstellen:**
```bash
# CloudWatch Dashboard JSON speichern
cat > budget-dashboard.json << 'EOF'
[JSON_CONTENT_HIER]
EOF

# Dashboard erstellen
aws cloudwatch put-dashboard \
  --dashboard-name "Budget-Monitoring" \
  --dashboard-body file://budget-dashboard.json
```

---

## 💡 **Daily Cost Management Script**

### **Automated Daily Report:**
```bash
#!/bin/bash
# daily-cost-report.sh - Täglicher Kostenbericht

BUDGET_LIMIT=15
CURRENT_DATE=$(date +%Y-%m-%d)
MONTH_START=$(date +%Y-%m-01)

echo "💰 DAILY AWS COST REPORT - $CURRENT_DATE"
echo "=========================================="

# Aktuelle Monatskosten
CURRENT_COSTS=$(aws ce get-cost-and-usage \
  --time-period Start=$MONTH_START,End=$CURRENT_DATE \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --query 'ResultsByTime[0].Total.BlendedCost.Amount' \
  --output text)

echo "📊 Current Month Costs: \$$CURRENT_COSTS"

# Budgetauslastung berechnen
BUDGET_USAGE=$(echo "scale=1; ($CURRENT_COSTS / $BUDGET_LIMIT) * 100" | bc)
echo "📈 Budget Usage: $BUDGET_USAGE%"

# Status bestimmen
if (( $(echo "$BUDGET_USAGE > 90" | bc -l) )); then
    echo "🔴 CRITICAL: >90% budget used!"
    ./scripts/cost-management.sh emergency
elif (( $(echo "$BUDGET_USAGE > 75" | bc -l) )); then
    echo "🟡 WARNING: >75% budget used"
    ./scripts/cost-management.sh analyze
else
    echo "🟢 OK: Budget usage within normal limits"
fi

# Top 5 kostenintensive Services
echo ""
echo "🔝 TOP 5 SERVICES BY COST:"
aws ce get-cost-and-usage \
  --time-period Start=$MONTH_START,End=$CURRENT_DATE \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --group-by Type=DIMENSION,Key=SERVICE \
  --query 'ResultsByTime[0].Groups[?Total.BlendedCost.Amount>`0.01`].[Keys[0],Total.BlendedCost.Amount]' \
  --output table

# Free Tier Status
echo ""
echo "🎁 FREE TIER STATUS:"
./scripts/free-tier-monitor.py | head -20

# Prognose für Monatsende
FORECAST=$(aws ce get-cost-and-usage \
  --time-period Start=$CURRENT_DATE,End=$(date -d "+1 month" +%Y-%m-01) \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --query 'ResultsByTime[0].Total.BlendedCost.Amount' \
  --output text)

echo ""
echo "📈 Month-End Forecast: \$$FORECAST"

if (( $(echo "$FORECAST > $BUDGET_LIMIT" | bc -l) )); then
    echo "⚠️  WARNING: Forecast exceeds budget!"
    echo "💡 Consider reducing resource usage"
fi
```

### **Crontab für tägliche Ausführung:**
```bash
# crontab -e
0 9 * * * /home/vitalij/projects/aws-portfolio-setup/scripts/daily-cost-report.sh >> /var/log/aws-daily-costs.log 2>&1
```

---

## 🔍 **Cost Optimization Strategies**

### **1. Resource Scheduling**
```bash
#!/bin/bash
# resource-scheduler.sh - Start/Stop basierend auf Zeiten

HOUR=$(date +%H)
DAY=$(date +%u)  # 1=Monday, 7=Sunday

# Werktags 9-18 Uhr: Development Resources aktiv
if [ $DAY -le 5 ] && [ $HOUR -ge 9 ] && [ $HOUR -lt 18 ]; then
    echo "🟢 Business hours - Starting development resources"
    ./scripts/cost-management.sh start
    
# Außerhalb: Nur Essential Resources
else 
    echo "🔴 Off hours - Stopping non-essential resources"
    ./scripts/cost-management.sh stop
fi
```

### **2. Environment-Based Budgets**
```bash
# Development Environment: 3€
aws budgets create-budget \
  --account-id $ACCOUNT_ID \
  --budget file://budgets/development-budget.json

# Demo Environment: 7€  
aws budgets create-budget \
  --account-id $ACCOUNT_ID \
  --budget file://budgets/demo-budget.json

# Production Environment: 20€ (nach Free Tier)
aws budgets create-budget \
  --account-id $ACCOUNT_ID \
  --budget file://budgets/production-budget.json
```

### **3. Unused Resource Detection**
```bash
#!/bin/bash
# unused-resource-cleanup.sh

echo "🔍 UNUSED RESOURCE DETECTION"
echo "==============================="

# Stopped EC2 Instances älter als 7 Tage
aws ec2 describe-instances \
  --filters Name=instance-state-name,Values=stopped \
  --query 'Reservations[].Instances[?LaunchTime<=`2024-01-01`].[InstanceId,LaunchTime]' \
  --output table

# Unattached EBS Volumes
aws ec2 describe-volumes \
  --filters Name=status,Values=available \
  --query 'Volumes[].{VolumeId:VolumeId,Size:Size,CreateTime:CreateTime}' \
  --output table

# Empty S3 Buckets
aws s3api list-buckets --query 'Buckets[].Name' --output text | \
while read bucket; do
  size=$(aws s3 ls s3://$bucket --recursive | wc -l)
  if [ $size -eq 0 ]; then
    echo "Empty bucket: $bucket"
  fi
done

# Unused Elastic IPs
aws ec2 describe-addresses \
  --filters Name=domain,Values=vpc \
  --query 'Addresses[?AssociationId==null].[PublicIp,AllocationId]' \
  --output table
```

---

## 📋 **Budget Management Checkliste**

### **Setup:**
- [ ] Free Tier Overage Budget (0€) erstellt
- [ ] Development Budget (5€) mit Alerts
- [ ] Demo Budget (10€) mit Auto-Stop
- [ ] Emergency Budget (15€) mit Shutdown
- [ ] Lambda Shutdown Function deployed
- [ ] SNS Topics für Alerts konfiguriert

### **Monitoring:**
- [ ] Daily Cost Report Script eingerichtet
- [ ] CloudWatch Budget Dashboard erstellt
- [ ] Free Tier Monitoring aktiv
- [ ] Crontab für automatische Reports

### **Automation:**
- [ ] Resource Scheduler für Off-Hours
- [ ] Unused Resource Detection
- [ ] Environment-based Budget Controls
- [ ] Emergency Shutdown Testing

### **Testing:**
- [ ] Budget Alerts funktional getestet
- [ ] Lambda Shutdown Function getestet
- [ ] SNS Notifications empfangen
- [ ] Manual Override Procedures dokumentiert

---

## 🚨 **Emergency Procedures**

### **Manual Override (Budget Shutdown deaktivieren):**
```bash
# Lambda Function temporär deaktivieren
aws lambda put-function-configuration \
  --function-name budget-shutdown-handler \
  --environment Variables='{SHUTDOWN_DISABLED=true}'

# Alle Services manuell starten
./scripts/cost-management.sh start --force

# Nach Resolve: Shutdown wieder aktivieren
aws lambda put-function-configuration \
  --function-name budget-shutdown-handler \
  --environment Variables='{}'
```

### **Budget Reset (Monatsanfang):**
```bash
# Budget Alerts zurücksetzen
aws budgets describe-budgets --account-id $ACCOUNT_ID

# Kosten-Tracking neu starten
./scripts/cost-management.sh reset

# Free Tier Status prüfen
./scripts/free-tier-monitor.py
```

---

**💡 Wichtiger Hinweis:** Das automatische Shutdown-System ist ein Sicherheitsnetz. Proaktives Monitoring und manuelle Kontrolle bleiben essentiell für erfolgreiches Budget Management!