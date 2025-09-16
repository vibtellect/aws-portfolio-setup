# 📚 AWS Portfolio Setup - Vollständige Dokumentation

**Version:** 2.0  
**Letzte Aktualisierung:** 16.09.2025  
**Autor:** Vitalij Bojatschkin

---

## 🎯 **Projektübersicht**

Dieses Projekt dokumentiert die komplette Einrichtung einer **FREE-TIER(soweit möglich) AWS-Entwicklungsumgebung** für Portfolio-Projekte mit einem Budget von **maximal 10-15€/Monat**.

### **Zielstellung:**
- **Free Tier optimal nutzen** (12 Monate + Always Free Services)
- **Kostenoptimierte Architektur** für Full-Stack + DevOps Projekte
- **Production-Ready Setup** mit Security Best Practices
- **Multi-Language Portfolio** (Python, Go, Java, Node.js, TypeScript)

---

## 📖 **Dokumentations-Struktur**

### **01 - Account Setup & Security**
- [Account Einrichtung](01-setup/account-setup.md)
- [IAM Policies & Permissions](01-setup/iam-setup.md)  
- [Security Best Practices](01-setup/security-guide.md)

### **02 - AWS Free Tier Optimierung**
- [Offizielle Free Tier Limits](02-free-tier/official-limits.md)
- [Services Übersicht](02-free-tier/services-overview.md)
- [Free Tier Monitoring](02-free-tier/monitoring-guide.md)

### **03 - Kostenanalyse & Budget Management**
- [Cost Explorer Analyse](03-cost-analysis/cost-explorer-analysis.md)
- [ALB vs. Single EC2 Vergleich](03-cost-analysis/alb-comparison.md)
- [Budget Alerts & Controls](03-cost-analysis/budget-management.md)

### **04 - Portfolio Projekte**
- [Projekt-Strategie](04-projects/portfolio-strategy.md)
- [Multi-Language API (Serverless)](04-projects/01-serverless-api.md)
- [Microservices Container](04-projects/02-microservices.md)
- [PWA DevOps Showcase](04-projects/03-pwa-showcase.md)

### **05 - Architektur & Design Patterns**
- [Kostenoptimierte Architekturen](05-architecture/cost-optimized-patterns.md)
- [Serverless vs. Container](05-architecture/serverless-vs-container.md)
- [Multi-Region Deployment](05-architecture/multi-region-guide.md)

---

## 🚀 **Quick Start Guide**

### **Schritt 1: Account Setup**
```bash
# 1. IAM Benutzer erstellen
# 2. MFA aktivieren
# 3. Developer Policy anwenden
# 4. Permissions testen
./scripts/test-iam-permissions.sh
```

### **Schritt 2: Free Tier Monitoring**
```bash
# 1. Budget Alerts konfigurieren
# 2. Cost Explorer aktivieren
# 3. Free Tier Dashboard prüfen
./scripts/cost-management.sh analyze
```

### **Schritt 3: Erstes Projekt**
```bash
# Single EC2 mit Multi-Language Setup
cd projects/01-ec2-hello/
# Kosten: ~0-5€/Monat
```

---

## 📊 **Kostenschätzung & Budget**

### **Monatliche Kosten (optimiert):**
```
┌─────────────────────────────────────────────────┐
│  SERVICE                 │  KOSTEN    │  STATUS  │
├─────────────────────────────────────────────────┤
│  EC2 t3.micro (750h)     │  0-13€     │  Free*   │
│  RDS t3.micro (750h)     │  0€        │  Free*   │
│  S3 (5GB + Requests)     │  0-0.50€   │  Free*   │
│  CloudFront (1TB)        │  0€        │  Always  │
│  Lambda (1M Requests)    │  0€        │  Always  │
│  DynamoDB (25GB)         │  0€        │  Always  │
│  CloudWatch (Monitoring) │  0-2€      │  Partial │
│  Route 53 (1 Zone)       │  0.50€     │  Paid    │
│  ALB (falls verwendet)   │  0-16€     │  Optional│
├─────────────────────────────────────────────────┤ 
│  TOTAL (Single EC2)      │  0-5€      │  ✅ Opt. │
│  TOTAL (mit ALB)         │  15-25€    │  ⚠️ Teuer │
└─────────────────────────────────────────────────┘

*Free für erste 12 Monate bei Konten vor 15.07.2025
```

---

## 🛠️ **Verfügbare Tools**

### **Cost Management Scripts:**
```bash
# Kosten-Analyse mit Prognose
./scripts/cost-management.sh analyze

# Live-Monitoring
./scripts/cost-management.sh monitor

# Notfall-Shutdown
./scripts/cost-management.sh emergency
```

### **IAM Permission Testing:**
```bash
# Alle 38 AWS-Berechtigungen testen
./scripts/test-iam-permissions.sh
```

### **Service Management:**
```bash
# Services für Demo starten
./scripts/cost-management.sh start

# Services stoppen (Kosten sparen)
./scripts/cost-management.sh stop
```

---

## 📈 **Portfolio-Strategie (3 Monate)**

### **Monat 1: Serverless Foundation**
- **Ziel:** Multi-Language Serverless API
- **Tech:** Python, Go, Node.js Lambda + Angular
- **Kosten:** ~0-3€/Monat
- **Highlight:** Free Tier optimal nutzen

### **Monat 2: Container Orchestration**
- **Ziel:** Microservices mit ECS Fargate
- **Tech:** Java, Go, Python Container + ALB
- **Kosten:** ~5-8€/Monat (nur für Demos)
- **Highlight:** Container + Service Discovery

### **Monat 3: DevOps Excellence**
- **Ziel:** PWA + vollautomatische CI/CD
- **Tech:** Angular PWA + Multi-Stage Pipeline
- **Kosten:** ~1-2€/Monat (statisch)
- **Highlight:** Infrastructure as Code Vergleich

---

## ⚠️ **Wichtige Kostenfallen vermeiden**

### **Services zu VERMEIDEN:**
- ❌ **NAT Gateway** (~45€/Monat) → Nutze NAT Instance
- ❌ **RDS Multi-AZ** → Nur Single-AZ im Free Tier
- ❌ **Elasticsearch** → Nutze DynamoDB + OpenSearch Free Tier
- ❌ **Redshift, EMR, SageMaker Training** → Zu teuer
- ❌ **Ungenutzte Elastic IPs** → 0.005$/Stunde wenn nicht verbunden

### **Free Tier Limits beachten:**
- **EC2:** 750h/Monat regionsübergreifend (nicht pro Region!)
- **RDS:** 750h/Monat + 20GB Speicher
- **S3:** 5GB + 20k GET + 2k PUT Requests
- **Always Free:** CloudFront (1TB), Lambda (1M), DynamoDB (25GB)

---

## 🔒 **Security & Best Practices**

### **Account Security:**
- ✅ **Root Account MFA** aktiviert
- ✅ **IAM Development User** mit Least Privilege
- ✅ **Enhanced Developer Policy** (36 Services)
- ✅ **Permission Testing** (38/38 Tests bestanden)

### **Cost Controls:**
- ✅ **Budget Alerts** bei 50%, 80%, 100%
- ✅ **Auto-Shutdown** bei Budgetüberschreitung
- ✅ **Daily Cost Monitoring**
- ✅ **Free Tier Usage Tracking**

### **Infrastructure Security:**
- ✅ **Infrastructure as Code** (Terraform + CDK)
- ✅ **Least Privilege IAM Policies**
- ✅ **VPC Security Groups** richtig konfiguriert
- ✅ **HTTPS-Only** für alle öffentlichen Services

---

## 📞 **Support & Troubleshooting**

### **Häufige Probleme:**
1. **Free Tier überschritten** → [Monitoring Guide](02-free-tier/monitoring-guide.md)
2. **IAM Permission Fehler** → [IAM Setup](01-setup/iam-setup.md)
3. **Unerwartete Kosten** → [Cost Analysis](03-cost-analysis/cost-explorer-analysis.md)

### **Logs & Debugging:**
```bash
# AWS CLI Debug Mode
aws --debug <command>

# CloudWatch Logs prüfen
aws logs describe-log-groups

# Cost & Usage Report
aws ce get-cost-and-usage --time-period Start=2024-01-01,End=2024-01-02
```

---

## 🎯 **Nächste Schritte**

1. **📖 Setup starten:** [Account Setup Guide](01-setup/account-setup.md)
2. **💰 Budget konfigurieren:** [Budget Management](03-cost-analysis/budget-management.md)  
3. **🚀 Erstes Projekt:** [EC2 Hello World](04-projects/01-serverless-api.md)
4. **📊 Monitoring:** [Free Tier Dashboard](02-free-tier/monitoring-guide.md)

---

**💡 Tipp:** Beginne mit dem [Free Tier Limits Guide](02-free-tier/official-limits.md) um die verfügbaren Ressourcen zu verstehen!

---

## 📝 **Changelog**

- **v2.0** (16.09.2025): Vollständige Dokumentations-Restrukturierung
- **v1.5** (15.09.2025): Cost Explorer Integration + ALB Analyse
- **v1.0** (14.09.2025): Initiale Einrichtung + Free Tier Analyse

---

**🔗 Weiterführende Links:**
- [AWS Free Tier](https://aws.amazon.com/free/)
- [AWS Cost Management](https://aws.amazon.com/aws-cost-management/)
- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)