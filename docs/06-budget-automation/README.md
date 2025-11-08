# 💰 AWS Budget Automation

Automatisierte Kostenüberwachung und -optimierung für dein AWS-Portfolio.

## 🎯 System Status

**✅ ERFOLGREICH DEPLOYED**
- **E-Mail:** info@bojatschkin.de
- **Budget:** $20/Monat (derzeit bei 23% = $1.19)
- **Services:** 3 Lambda-Funktionen, SNS, CloudWatch Dashboard
- **Status:** Voll funktionsfähig

## 🛠️ Verfügbare Scripts

### 📊 Cost Monitor (`cost-monitor.sh`)
```bash
cd scripts/budget-automation
./cost-monitor.sh monitor    # Vollständiger Kostenbericht
./cost-monitor.sh budget     # Nur Budget-Status
./cost-monitor.sh forecast   # Monatsende-Prognose
```

### 🧹 Resource Cleanup (`unused-resource-cleanup.sh`)
```bash
./unused-resource-cleanup.sh scan     # Sicherer Scan
./unused-resource-cleanup.sh cleanup  # Tatsächliche Bereinigung (VORSICHT!)
```

### 🚀 Infrastructure Management (`deploy-infrastructure.sh`)
```bash
ALERT_EMAIL=info@bojatschkin.de ./deploy-infrastructure.sh deploy
./deploy-infrastructure.sh status
./deploy-infrastructure.sh delete
```

## 🏗️ Infrastructure

### CloudFormation Stack: `aws-budget-automation`
- **Budget:** $20 monatlich mit Alerts (50%, 80%, 100%)
- **SNS:** E-Mail-Benachrichtigungen
- **Lambda:** 3 Automatisierungs-Funktionen
- **EventBridge:** Stundenweise/wöchentliche Scheduler
- **CloudWatch:** Dashboard und Monitoring

### Lambda-Funktionen
1. **Budget Shutdown Handler** - Stoppt Ressourcen bei Budget-Überschreitung
2. **Resource Scheduler** - Start/Stop basierend auf Tags
3. **S3 Lifecycle Optimizer** - Automatische S3-Kostenoptimierung

## 📊 Kostenstatus

### Aktueller Verbrauch
- **September 2025:** $1.19 von $20 (23%)
- **Tägliche Kosten:** ~$0.0002 (Route 53)
- **Hauptkosten:** DNS-Queries, S3-Storage
- **Prognose:** Bleibt unter 25% Budget

### Ressourcen-Inventar
- **S3 Buckets:** 8 (alle mit Inhalt)
- **EC2 Instances:** 0
- **Lambda Functions:** 4 (inkl. Budget-System)
- **SNS Topics:** 3

## 🎯 Automatische Funktionen

### Budget-Kontrolle
- **50% Budget:** E-Mail-Warnung
- **80% Budget:** Stopp nicht-kritischer Ressourcen
- **100% Budget:** Notfall-Abschaltung

### Resource Scheduling (Tag-basiert)
Tagge Ressourcen mit `AutoSchedule`:
- `business-hours` - Mo-Fr 08:00-18:00
- `dev-hours` - Mo-Fr 09:00-17:00
- `24x7` - Immer an
- `never` - Immer aus

### S3-Optimierung
- **30 Tage:** Übergang zu Standard-IA
- **90 Tage:** Übergang zu Glacier
- **365 Tage:** Übergang zu Deep Archive
- **7 Tage:** Bereinigung unvollständiger Uploads

## 🔧 Wartung

### Tägliche Checks
```bash
./cost-monitor.sh budget
```

### Wöchentliche Aufgaben
```bash
./unused-resource-cleanup.sh scan
```

### Monatliche Reviews
- Budget-Limits überprüfen
- Kostentrendanalyse
- Resource-Tags validieren

## 🚨 Troubleshooting

### Budget-Alarm
1. CloudWatch Dashboard prüfen
2. `./cost-monitor.sh monitor` ausführen
3. Ungewöhnliche Kosten identifizieren
4. Bei Notfall: Ressourcen manuell stoppen

### Lambda-Funktionen prüfen
```bash
aws logs tail /aws/lambda/aws-budget-automation-budget-shutdown
aws logs tail /aws/lambda/aws-budget-automation-resource-scheduler
aws logs tail /aws/lambda/aws-budget-automation-s3-lifecycle-optimizer
```

### CloudFormation Status
```bash
aws cloudformation describe-stacks --stack-name aws-budget-automation
```

## 📈 Monitoring URLs

- **CloudWatch Dashboard:** [Budget Monitoring](https://eu-central-1.console.aws.amazon.com/cloudwatch/home?region=eu-central-1#dashboards:name=aws-budget-automation-budget-monitoring)
- **Budget Console:** [AWS Budgets](https://console.aws.amazon.com/billing/home#/budgets)
- **Cost Explorer:** [Cost Analysis](https://console.aws.amazon.com/cost-management/home#/cost-explorer)

## 🎉 Success Story

**Vor Implementation:**
- Keine Budget-Kontrolle
- Keine Kostentransparenz
- Manuelle Ressourcen-Verwaltung

**Nach Implementation:**
- Vollautomatische Budget-Überwachung
- 23% Budget-Nutzung bei $20 Limit
- Proaktive Kostenoptimierung
- Zero ungenutzter Ressourcen gefunden
- E-Mail-Alerts bei Schwellenwerten

*Das AWS Budget Automation System überwacht kontinuierlich deine Kosten und optimiert automatisch Ressourcen für maximale Effizienz! 🚀*