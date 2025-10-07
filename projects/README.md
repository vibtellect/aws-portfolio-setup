# 🚀 AWS Portfolio Projects - Implementation Roadmap

**Target Timeline**: 3-4 Monate  
**Budget**: 10-15€/Monat (Free Tier optimiert)  
**Skill Focus**: Full-Stack + DevOps + Cloud Architecture  

---

## 📋 **Project Overview**

| # | Projekt | IaC Tool | Komplexität | Kosten/Monat | Skills Demo |
|---|---------|----------|-------------|--------------|-------------|
| 01 | [Serverless Todo App](01-serverless-todo-app/README.md) | CDK | ⭐⭐ | 0-2€ | Serverless, Auth, Full-Stack |
| 02 | [Static Website CI/CD](02-static-website-cicd/README.md) | Terraform | ⭐ | 0-1€ | CI/CD, Static Hosting |
| 03 | [Multi-Region Failover](03-multi-region-failover/README.md) | CDK | ⭐⭐⭐ | 1-3€ | High Availability, DNS |
| 04 | [Event-Driven Image Resizer](04-image-resizer/README.md) | CDK | ⭐⭐ | 0-2€ | Event-Driven, Processing |
| 05 | [Cost Monitoring System](05-cost-monitoring/README.md) | Terraform | ⭐⭐ | 0-1€ | FinOps, Monitoring |
| 06 | [File Hosting with Pre-signed URLs](06-file-hosting/README.md) | CDK | ⭐⭐ | 0-1€ | Security, APIs |
| 07 | [IoT Data Collector](07-iot-collector/README.md) | Terraform | ⭐⭐⭐ | 0-2€ | IoT, Streaming Data |
| 08 | [Multi-Tenant Auth System](08-multi-tenant-auth/README.md) | CDK | ⭐⭐⭐⭐ | 0-2€ | Enterprise Auth, SaaS |
| 09 | [Infrastructure Comparison Demo](09-iac-comparison/README.md) | CDK+Terraform | ⭐⭐⭐ | 1-3€ | IaC Best Practices |
| 10 | [Security & Monitoring Dashboard](10-security-dashboard/README.md) | Terraform | ⭐⭐⭐⭐ | 0-2€ | Security, Compliance |

---

## 🛠️ **Development Guidelines**

### **Infrastructure as Code Strategy**
- **CDK Projects**: Verwende für serverless, event-driven Projekte
- **Terraform Projects**: Verwende für traditionelle Infrastructure, Multi-Cloud Patterns
- **Mixed Projects**: Demonstriere Real-World IaC Strategien

### **Free Tier Optimization**
```bash
# Always Free Services (Unbegrenzt)
- Lambda: 1M Requests/Monat
- DynamoDB: 25GB + 25 Read/Write Units
- CloudFront: 1TB Transfer
- SNS: 1M Messages
- SQS: 1M Messages

# 12-Month Free Services
- EC2 t3.micro: 750 Stunden/Monat
- RDS t3.micro: 750 Stunden/Monat  
- S3: 5GB + 20k GET + 2k PUT

# Cost Optimization Strategy
- Nutze Always Free wo möglich
- 12-Month Free für Development/Testing
- Automatische Shutdowns für Demo-Services
```

### **Repository Structure**
```
projects/
├── 01-serverless-todo-app/         # CDK + React + Python
├── 02-static-website-cicd/         # Terraform + Hugo/Jekyll
├── 03-multi-region-failover/       # CDK + Route53
├── 04-image-resizer/               # CDK + Lambda + S3
├── 05-cost-monitoring/             # Terraform + Python
├── 06-file-hosting/                # CDK + Pre-signed URLs
├── 07-iot-collector/               # Terraform + IoT Core
├── 08-multi-tenant-auth/           # CDK + Cognito Advanced
├── 09-iac-comparison/              # CDK vs Terraform Demo
└── 10-security-dashboard/          # Terraform + Security Hub
```

---

## 📈 **Learning Path Recommendations**

### **Beginner Start Here**
1. **Projekt 02**: Static Website (Terraform Basics)
2. **Projekt 01**: Serverless Todo (CDK Basics)
3. **Projekt 04**: Image Resizer (Event-Driven)

### **Intermediate Path**
4. **Projekt 05**: Cost Monitoring (FinOps)
5. **Projekt 03**: Multi-Region (High Availability)
6. **Projekt 06**: File Hosting (Security)

### **Advanced Challenges**
7. **Projekt 07**: IoT Collector (Streaming)
8. **Projekt 08**: Multi-Tenant Auth (Enterprise)
9. **Projekt 09**: IaC Comparison (Best Practices)
10. **Projekt 10**: Security Dashboard (Compliance)

---

## 🚨 **Cost Control Strategy**

### **Budget Monitoring**
```bash
# Vor jedem Deployment
./scripts/budget-automation/cost-monitor.sh

# Nach jedem Projekt
aws ce get-cost-and-usage \
  --time-period Start=$(date +%Y-%m-01),End=$(date +%Y-%m-%d) \
  --granularity MONTHLY \
  --metrics BlendedCost
```

### **Emergency Shutdown**
- Alle Projekte haben `AutoShutdown=true` Tags
- GitHub Actions stoppen Services automatisch bei Budgetüberschreitung
- Manual Cleanup Scripts verfügbar

### **Demo Mode**
- Services nur für Portfolio-Präsentationen starten
- Automatische Shutdowns nach Demo-Sessions
- Screenshots/Videos als Backup für Offline-Demos

---

## 🎯 **Next Steps**

1. **Wähle einen Startpunkt** basierend auf deinem Erfahrungslevel
2. **Lies das detaillierte Projekt-README** 
3. **Implementiere Schritt-für-Schritt** mit eigenen Lösungen
4. **Dokumentiere deine Learnings** für das Portfolio
5. **Teile auf LinkedIn/GitHub** für Visibility

---

**💡 Pro-Tip**: Beginne mit Projekt 02 (Static Website) wenn du neu mit Terraform bist, oder Projekt 01 (Serverless Todo) wenn du CDK lernen willst!