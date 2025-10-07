# 🛠️ AWS Scripts Übersicht

Sammlung von Scripts für AWS-Kostenmanagement, Budget-Automation und Monitoring.

---

## 📁 Verzeichnis-Struktur

```
scripts/
├── budget-automation/           # Budget-Kontrolle & Kostenoptimierung
│   ├── cost-monitor.sh          # Kostenmonitoring & Reports
│   ├── deploy-infrastructure.sh # CloudFormation Deployment  
│   ├── unused-resource-cleanup.sh # Ressourcen-Bereinigung
│   └── budget-automation-infrastructure.yaml # CloudFormation Template
├── lambda-functions/            # Lambda-Funktionen für Automation
│   ├── budget-shutdown-handler.py    # Budget-basierte Abschaltung
│   ├── resource-scheduler.py         # Tag-basierte Zeitplanung
│   └── s3-lifecycle-optimizer.py     # S3-Kostenoptimierung
└── monitoring/                  # Legacy Monitoring Tools
    ├── cost-management.sh       # Altes Kostenmanagement
    ├── free-tier-monitor.py     # Free Tier Überwachung
    └── deploy-lambda.sh         # Lambda Deployment Helper
```

---

## 🚀 Budget Automation Scripts

### 📊 `cost-monitor.sh`
**Zweck:** Kostenüberwachung mit Budget-Analyse und Prognosen

```bash
# Vollständiger Kostenbericht
./budget-automation/cost-monitor.sh monitor

# Nur Budget-Status
./budget-automation/cost-monitor.sh budget

# Monatsende-Prognose  
./budget-automation/cost-monitor.sh forecast

# Hilfe anzeigen
./budget-automation/cost-monitor.sh help
```

**Features:**
- Aktuelle Budget-Auslastung
- 7-Tage Kostenverlauf
- Service-basierte Kostenaufschlüsselung
- Ressourcen-Inventar
- Monatsende-Prognose
- Kostenoptimierungs-Empfehlungen

---

### 🧹 `unused-resource-cleanup.sh`
**Zweck:** Aufspüren und Bereinigen ungenutzter AWS-Ressourcen

```bash
# Sicherer Scan (DRY RUN)
./budget-automation/unused-resource-cleanup.sh scan

# Tatsächliche Bereinigung (VORSICHT!)
DRY_RUN=false ./budget-automation/unused-resource-cleanup.sh cleanup

# Hilfe
./budget-automation/unused-resource-cleanup.sh help
```

**Findet:**
- Unbenutzte Elastic IP-Adressen
- Leere S3-Buckets  
- Gestoppte EC2-Instanzen
- Kostenschätzungen für Bereinigung

**Umgebungsvariablen:**
- `DRY_RUN=true/false` - Testmodus (Standard: true)
- `CLEANUP_OLDER_THAN_DAYS=7` - Alter-Schwellenwert

---

### 🚀 `deploy-infrastructure.sh`
**Zweck:** CloudFormation-basierte Budget-Automation Infrastructure

```bash
# Infrastructure deployen
ALERT_EMAIL=deine@email.de ./budget-automation/deploy-infrastructure.sh deploy

# Stack-Status prüfen
./budget-automation/deploy-infrastructure.sh status

# Stack aktualisieren
ALERT_EMAIL=admin@firma.de ./budget-automation/deploy-infrastructure.sh update

# Stack löschen
./budget-automation/deploy-infrastructure.sh delete

# Hilfe
./budget-automation/deploy-infrastructure.sh help
```

**Erstellt:**
- AWS Budget mit Alerts (50%, 80%, 100%)
- SNS-Topic für E-Mail-Benachrichtigungen
- 3 Lambda-Funktionen für Automation
- CloudWatch Dashboard
- EventBridge Rules für Scheduling

**Umgebungsvariablen:**
- `ALERT_EMAIL` - E-Mail für Budget-Alerts (erforderlich)
- `BUDGET_LIMIT=20` - Budget-Limit in USD
- `ENABLE_SHUTDOWN=true` - Automatische Abschaltung
- `SCHEDULER_TAG_KEY=AutoSchedule` - Tag für Scheduling
- `ENVIRONMENT=dev` - Umgebungsname

---

## ⚡ Lambda-Funktionen

### 💸 `budget-shutdown-handler.py`
**Zweck:** Automatische Ressourcen-Abschaltung bei Budget-Überschreitung

**Funktionalität:**
- **50% Budget:** E-Mail-Warnung
- **80% Budget:** Stopp nicht-kritischer Ressourcen  
- **100% Budget:** Notfall-Abschaltung aller Ressourcen
- Respektiert `DoNotShutdown=true` Tags

**Services:** EC2, RDS, ECS

---

### 🕐 `resource-scheduler.py`
**Zweck:** Tag-basierte Zeitplanung für EC2/RDS-Ressourcen

**Zeitpläne:**
- `business-hours` - Mo-Fr 08:00-18:00
- `dev-hours` - Mo-Fr 09:00-17:00
- `24x7` - Immer an
- `never` - Immer aus
- `custom:Mon-Fri:09:00-17:00` - Benutzerdefiniert

**Tag-Format:**
```bash
# EC2-Instanz taggen
aws ec2 create-tags --resources i-1234567890abcdef0 --tags Key=AutoSchedule,Value=business-hours

# RDS-Instanz taggen
aws rds add-tags-to-resource --resource-name arn:aws:rds:region:account:db:mydb --tags Key=AutoSchedule,Value=dev-hours
```

---

### 🗄️ `s3-lifecycle-optimizer.py`
**Zweck:** Automatische S3-Kostenoptimierung durch Lifecycle-Regeln

**Optimierungen:**
- **30 Tage:** Standard → Standard-IA
- **90 Tage:** Standard-IA → Glacier
- **365 Tage:** Glacier → Deep Archive
- **7 Tage:** Unvollständige Uploads löschen
- **90 Tage:** Alte Versionen löschen

---

## 📊 Monitoring Scripts

### 📈 `free-tier-monitor.py`
**Zweck:** Free Tier Nutzung überwachen

```bash
cd monitoring/
python3 free-tier-monitor.py
```

### 💰 `cost-management.sh` (Legacy)
**Zweck:** Altes Kostenmanagement-Script

```bash
cd monitoring/
./cost-management.sh analyze
./cost-management.sh monitor
```

### 🚀 `deploy-lambda.sh`
**Zweck:** Helper für Lambda-Deployment

```bash
cd monitoring/
./deploy-lambda.sh
```

---

## 🔧 Voraussetzungen

### AWS CLI
```bash
# Installation prüfen
aws --version

# Konfiguration
aws configure
```

### Berechtigungen
```bash
# Test AWS-Zugriff
aws sts get-caller-identity
```

### Script-Berechtigungen
```bash
# Alle Scripts ausführbar machen
chmod +x budget-automation/*.sh
chmod +x monitoring/*.sh
```

---

## ⚡ Quick Start

### 1. Budget-Automation Setup
```bash
# E-Mail für Alerts anpassen!
ALERT_EMAIL=deine@email.de ./budget-automation/deploy-infrastructure.sh deploy
```

### 2. Erste Kostenprüfung
```bash
./budget-automation/cost-monitor.sh monitor
```

### 3. Ungenutzte Ressourcen scannen
```bash
./budget-automation/unused-resource-cleanup.sh scan
```

### 4. CloudWatch Dashboard öffnen
```bash
# URL aus CloudFormation Output abrufen
./budget-automation/deploy-infrastructure.sh status
```

---

## 🛡️ Sicherheit

### Dry Run Modus
- **Alle Scripts haben Dry-Run Modus** (Standard: aktiviert)
- Nur `deploy-infrastructure.sh` macht direkt Änderungen
- `unused-resource-cleanup.sh` benötigt `DRY_RUN=false` für Bereinigung

### Schutz-Tags
- `DoNotShutdown=true` - Schutz vor automatischer Abschaltung
- `AutoSchedule=never` - Ressource nie starten
- `AutoSchedule=24x7` - Ressource immer laufen lassen

---

## 📞 Troubleshooting

### AWS CLI Fehler
```bash
aws configure  # Credentials neu eingeben
export AWS_DEFAULT_REGION=eu-central-1  # Region setzen
```

### CloudFormation Stack Fehler  
```bash
# Stack-Events prüfen
aws cloudformation describe-stack-events --stack-name aws-budget-automation

# Stack-Status prüfen
aws cloudformation describe-stacks --stack-name aws-budget-automation
```

### Lambda-Logs prüfen
```bash
aws logs tail /aws/lambda/aws-budget-automation-budget-shutdown
aws logs tail /aws/lambda/aws-budget-automation-resource-scheduler
aws logs tail /aws/lambda/aws-budget-automation-s3-lifecycle-optimizer
```

---

## 🔗 Weiterführende Links

- [AWS Free Tier](https://aws.amazon.com/free/)
- [AWS Cost Explorer](https://console.aws.amazon.com/cost-management/home#/cost-explorer)
- [AWS Budgets Console](https://console.aws.amazon.com/billing/home#/budgets)
- [CloudWatch Dashboard](https://console.aws.amazon.com/cloudwatch/home#dashboards)

---

**💡 Tipp:** Scripts regelmäßig ausführen für optimale Kostenkontrolle!