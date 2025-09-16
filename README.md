# 🚀 AWS Portfolio Setup

**Production-ready AWS development environment** mit Free Tier Optimierung und automatischer Kostenkontrolle.

**Budget:** 10-15€/Monat | **Free Tier:** 12 Monate | **Status:** ✅ Vollständig eingerichtet

---

## 🎯 **Quick Start**

```bash
# Kosten-Check durchführen
./scripts/budget-automation/cost-monitor.sh

# Budget Automation deployen
./scripts/budget-automation/deploy-infrastructure.sh

# Unused Resources finden (Kostenspar-Tool)
./scripts/budget-automation/unused-resource-cleanup.sh scan

# IAM Permissions testen
./scripts/test-iam-permissions.sh
```

---

## 📚 **Dokumentation**

**📖 [Komplette Dokumentation →](docs/README.md)**

### **Wichtigste Guides:**
- 🚀 [Account Setup](docs/01-setup/account-setup.md) - AWS Konto sicher einrichten
- 💰 [Budget Automation](docs/05-budget-automation/README.md) - Automatische Kostenkontrolle
- 📊 [Cost Management](docs/03-cost-analysis/budget-management.md) - Budget & Alerts
- 🎯 [Portfolio Strategy](docs/04-projects/portfolio-strategy.md) - 3-Monats-Plan

---

## 🛠️ **Verfügbare Tools**

### **Budget & Cost Control**
```bash
./scripts/budget-automation/
├── cost-monitor.sh                    # Live Kosten-Monitoring
├── deploy-infrastructure.sh           # Budget Automation Setup
├── unused-resource-cleanup.sh         # Kostenspar-Tool
└── budget-automation-infrastructure.yaml
```

### **Monitoring & Testing**
```bash
./scripts/
├── test-iam-permissions.sh           # Security Testing
└── monitoring/                       # System Monitoring
```

---

## 📊 **System Status**

### **✅ Eingerichtet:**
- **IAM Security**: Enhanced Policy (38 Berechtigungen)
- **Budget Automation**: Multi-Level Alerts (0€, 5€, 10€, 15€)
- **Cost Monitoring**: CloudWatch Dashboards
- **Cleanup Tools**: Unused Resource Detection
- **Free Tier**: Optimal konfiguriert (12 Monate)

### **💰 Kostenschätzung:**
```
┌─────────────────────────────────────┐
│ SETUP                │ KOSTEN/MONAT │
├─────────────────────────────────────┤
│ Single EC2 + RDS     │ 0-5€         │
│ Always Free Services │ 0€           │
│ Container Setup      │ 5-10€        │
│ Full Portfolio       │ 10-15€       │
└─────────────────────────────────────┘
```

---

## 📁 **Projektstruktur**

```
aws-portfolio-setup/
├── docs/                             # 📚 Dokumentation
│   ├── 01-setup/                     # Account Setup
│   ├── 02-free-tier/                 # Free Tier Guide
│   ├── 03-cost-analysis/             # Cost Management
│   ├── 04-projects/                  # Portfolio Projekte
│   └── 05-budget-automation/         # Budget Automation
├── scripts/
│   ├── budget-automation/            # 💰 Cost Control Tools
│   ├── monitoring/                   # 📊 System Monitoring
│   └── test-iam-permissions.sh       # 🔐 Security Testing
└── projects/                         # 🎯 Portfolio Projekte
```

---

## 🚨 **Kostenfallen vermeiden**

- ❌ **NAT Gateway** (~45€/Monat) → Nutze Public Subnets
- ❌ **Multi-AZ RDS** → Single-AZ für Development
- ❌ **Unused Elastic IPs** → Regelmäßig mit Cleanup-Tool prüfen
- ❌ **Vergessene Ressourcen** → Automatische Alerts eingerichtet

**✅ Always Free:** Lambda (1M), DynamoDB (25GB), CloudFront (1TB), SNS, SQS

---

**💡 Nächste Schritte:** [Dokumentation lesen](docs/README.md) | [Budget Setup](docs/05-budget-automation/README.md) | [Erstes Projekt starten](projects/)
