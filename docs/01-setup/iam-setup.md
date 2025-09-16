# AWS Account Setup - Klassisches IAM (Empfohlen für Entwickler)

Diese Anleitung verwendet **klassisches IAM** statt IAM Identity Center - viel einfacher für einzelne Entwickler!

## 🚀 Warum klassisches IAM besser ist

| **IAM Identity Center** | **Klassisches IAM** |
|------------------------|---------------------|
| ❌ Komplex für einzelne User | ✅ Einfach und direkt |
| ❌ Zusätzliche Konfiguration | ✅ Bewährtes System |
| ❌ Mehr Abstraktionsebenen | ✅ Direkte Kontrolle |
| ❌ Overkill für Solo-Projekte | ✅ Perfekt für Entwickler |

## 📋 **Phase 1: Root Account sichern (SOFORT!)**

### 1.1 Root Account MFA aktivieren
```bash
# AWS Console → Rechts oben auf deinen Namen → Security Credentials
# → Multi-factor authentication (MFA) → Assign MFA device
# → Virtual MFA device → Google Authenticator/Authy scannen
```

### 1.2 Root Account nicht mehr verwenden
- Nach MFA-Setup: **Root Account ausloggen**
- Root nur für **Notfälle** und **Billing** verwenden
- **NIEMALS** für tägliche Entwicklung!

## 👨‍💻 **Phase 2: Development User erstellen (Klassisches IAM)**

### 2.1 Development User anlegen
```bash
# AWS Console → IAM (nicht Identity Center!) → Users → Create User
# 
# User Details:
# - Username: vitalij-developer
# - ✅ Provide user access to the AWS Management Console 
# - ✅ I want to create an IAM user
# - Console password: Custom password (stark!)  
# - ✅ Users must create a new password at next sign-in (optional)
```

### 2.2 Policy direkt anhängen
```bash
# WÄHREND der User-Erstellung:
# → Set permissions → Attach policies directly
# → Create policy → JSON Tab
# → Kopiere den Inhalt von ../02-iam-policies/developer-policy-enhanced.json
# → Name: DeveloperPortfolioPolicy
# → Create policy
# 
# Dann zurück zur User-Erstellung:
# → Policy auswählen: DeveloperPortfolioPolicy
# → Next → Create user
```

### 2.3 Access Keys für CLI erstellen
```bash
# Nach User-Erstellung:
# → IAM → Users → vitalij-developer → Security credentials
# → Access keys → Create access key
# → Use case: Command Line Interface (CLI)
# → ✅ I understand the above recommendation
# → Next → Description: "Development CLI access"
# → Create access key
# 
# ⚠️ WICHTIG: Access Key + Secret sofort sicher speichern!
```

### 2.4 MFA für Development User (Empfohlen)
```bash
# IAM → Users → vitalij-developer → Security credentials  
# → Assigned MFA device → Assign MFA device
# → Virtual MFA device → Andere Authenticator App als beim Root
```

## 🔧 **Phase 3: AWS CLI konfigurieren**

### 3.1 CLI Setup
```bash
# Auf deinem lokalen System:
aws configure

# Eingabe:
# AWS Access Key ID: [Access Key vom Development User]
# AWS Secret Access Key: [Secret Access Key vom Development User]
# Default region name: eu-central-1
# Default output format: json
```

### 3.2 CLI Testen
```bash
# Test 1: Wer bin ich?
aws sts get-caller-identity

# Test 2: Kosten abrufen (sollte jetzt funktionieren!)
aws ce get-cost-and-usage \
  --time-period Start=2024-09-01,End=2024-09-16 \
  --granularity MONTHLY \
  --metrics BlendedCost

# Test 3: S3 Buckets listen  
aws s3 ls

# Test 4: IAM Roles listen (für CDK/Terraform)
aws iam list-roles

# Test 5: Teurer Service blockiert?
aws rds create-db-instance \
  --db-instance-identifier test \
  --db-instance-class db.t3.micro \
  --engine mysql \
  --dry-run
# ⬆️ Sollte einen Fehler geben (AccessDenied)
```

## 💰 **Phase 4: Budget & Cost Alerts**

### 4.1 Budget Alert erstellen
```bash
# Billing & Cost Management → Budgets → Create budget
# Budget type: Cost budget
# Budget amount: 10 EUR
# Budget scope: All AWS services
# 
# Alerts:
# - 50% threshold → Email notification  
# - 80% threshold → Email notification
# - 100% threshold → Email + SMS notification
```

### 4.2 Billing Dashboard aktivieren
```bash
# Account → Billing preferences
# ✅ Receive PDF Invoice By Email
# ✅ Receive Free Tier Usage Alerts  
# ✅ Receive Billing Alerts
```

## 🧪 **Phase 5: Comprehensive Testing**

### 5.1 Policy Test ausführen
```bash
cd /home/vitalij/projects/aws-portfolio-setup
./scripts/test-iam-permissions.sh
```

### 5.2 Was sollte funktionieren ✅
- AWS CLI grundlegende Befehle
- Cost Explorer Zugriff  
- S3 Buckets mit `dev-*`, `portfolio-*` Namen
- Lambda Funktionen verwalten
- DynamoDB Tables
- IAM Roles lesen/erstellen (für IaC)
- CloudWatch Logs/Metrics
- API Gateway

### 5.3 Was sollte blockiert werden ❌
- RDS Instanzen erstellen
- Große EC2 Instanzen (> t3.small)
- ElastiCache, OpenSearch, SageMaker
- IAM User/Group Management
- Budget-Modifikation

## 🔒 **Phase 6: Sicherheits-Checklist**

- [ ] Root Account MFA aktiviert
- [ ] Root Account nicht mehr für Development verwendet
- [ ] Development User `vitalij-developer` erstellt
- [ ] Policy `DeveloperPortfolioPolicy` angehängt
- [ ] MFA für Development User aktiviert (empfohlen)
- [ ] Access Keys erstellt und sicher gespeichert
- [ ] AWS CLI konfiguriert und getestet
- [ ] Budget Alerts konfiguriert  
- [ ] Policy-Tests bestanden

## 🆘 **Troubleshooting**

### Problem: "Access Denied" bei allem
**Lösung**: Policy nicht richtig angehängt
```bash
# Prüfen:
aws iam list-attached-user-policies --user-name vitalij-developer

# Sollte zeigen:
# {
#   "AttachedPolicies": [
#     {
#       "PolicyName": "DeveloperPortfolioPolicy",
#       "PolicyArn": "arn:aws:iam::ACCOUNT:policy/DeveloperPortfolioPolicy"
#     }
#   ]
# }
```

### Problem: Kosten nicht sichtbar
**Lösung**: Billing Dashboard aktivieren
```bash
# Root Account verwenden → Account → Billing preferences
# ✅ Receive Billing Alerts aktivieren
```

### Problem: MFA bei CLI
**Lösung**: Temporäre Credentials für MFA
```bash
# AWS CLI mit MFA:
aws sts get-session-token --serial-number arn:aws:iam::ACCOUNT:mfa/vitalij-developer --token-code 123456

# Dann temporäre Credentials in ~/.aws/credentials konfigurieren
```

## 🎯 **Nächste Schritte**

1. **Root Account MFA** → Sofort machen!
2. **Development User** → Mit Enhanced Policy erstellen  
3. **CLI testen** → `./scripts/test-iam-permissions.sh`
4. **Erstes Projekt** → `projects/01-serverless-hello/`

---

**Viel besser als IAM Identity Center für Solo-Development! 🚀**