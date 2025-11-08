# AWS Budget Automation Scripts

Eine umfassende Sammlung von Tools zur automatischen Kostenoptimierung und Budget-Überwachung in AWS.

## 📋 Überblick

Diese Scripts helfen dabei, AWS-Kosten automatisch zu überwachen, zu optimieren und zu kontrollieren. Das System bietet mehrschichtige Kostenkontrollen mit präventiven, reaktiven und automatischen Maßnahmen.

## 🛠️ Verfügbare Scripts

### 1. 🚀 Infrastructure Deployment (`deploy-infrastructure.sh`)

**Was es tut:**
- Deployed eine komplette Budget-Automatisierungs-Infrastruktur via CloudFormation
- Erstellt AWS Budget mit mehreren Alarmschwellen (50%, 80%, 100%)
- Richtet SNS-Benachrichtigungen ein
- Deployed Lambda-Funktionen für Automatisierung
- Erstellt CloudWatch-Dashboard für Monitoring

**Verwendung:**
```bash
# Grundlegende Deployment
ALERT_EMAIL=deine@email.de ./deploy-infrastructure.sh deploy

# Mit angepasstem Budget
BUDGET_LIMIT=50 ALERT_EMAIL=admin@firma.de ./deploy-infrastructure.sh deploy

# Stack-Status prüfen
./deploy-infrastructure.sh status

# Stack aktualisieren
ALERT_EMAIL=admin@firma.de ./deploy-infrastructure.sh update

# Stack löschen
./deploy-infrastructure.sh delete
```

**Umgebungsvariablen:**
- `ALERT_EMAIL` - E-Mail für Budget-Alarme (erforderlich)
- `BUDGET_LIMIT` - Monatliches Budget in USD (Standard: 20)
- `ENABLE_SHUTDOWN` - Automatische Abschaltung aktivieren (Standard: true)
- `SCHEDULER_TAG_KEY` - Tag für Ressourcen-Planung (Standard: AutoSchedule)
- `ENVIRONMENT` - Umgebungsname (Standard: dev)

---

### 2. 🧹 Unused Resource Cleanup (`unused-resource-cleanup.sh`)

**Was es tut:**
- Findet und entfernt ungenutzte AWS-Ressourcen
- Erkennt nicht-angehängte EBS-Volumes
- Identifiziert unbenutzte Elastic IPs
- Findet leere S3-Buckets
- Entdeckt alte gestoppte EC2-Instanzen
- Lokalisiert unbenutzte Security Groups
- Berechnet potenzielle Kosteneinsparungen

**Verwendung:**
```bash
# Sicherer Scan (keine Änderungen)
./unused-resource-cleanup.sh scan

# Kostenschätzung anzeigen
./unused-resource-cleanup.sh estimate

# Tatsächliche Bereinigung (VORSICHT!)
DRY_RUN=false ./unused-resource-cleanup.sh cleanup

# Mit angepasstem Alter-Schwellenwert (30 Tage)
CLEANUP_OLDER_THAN_DAYS=30 ./unused-resource-cleanup.sh scan
```

**Geprüfte Ressourcen:**
- ✅ Nicht-angehängte EBS-Volumes
- ✅ Unbenutzte Elastic IP-Adressen  
- ✅ Leere S3-Buckets
- ✅ Alte gestoppte EC2-Instanzen
- ✅ Unbenutzte Security Groups

**Sicherheit:**
- Standard: DRY_RUN=true (keine Änderungen)
- Detaillierte Protokollierung
- Alters-basierte Filter
- Kostenschätzungen vor Bereinigung

---

### 3. 📅 Resource Scheduler (`resource-scheduler.sh`)

**Was es tut:**
- Startet und stoppt EC2/RDS-Ressourcen basierend auf Zeitplänen
- Verwendet Tags zur Steuerung (`AutoSchedule` Tag)
- Vordefinierte Zeitpläne (Geschäftszeiten, Entwicklung, 24x7)
- Benutzerdefinierte Zeitfenster möglich
- Automatische Kostenoptimierung durch geplante Abschaltungen

**Verwendung:**
```bash
# Zeitplan ausführen (start/stop Ressourcen)
./resource-scheduler.sh schedule

# Status aller geplanten Ressourcen anzeigen
./resource-scheduler.sh status

# Zeitplan-Tag auf Ressourcen setzen
./resource-scheduler.sh tag i-1234567890abcdef0 business-hours

# Zeitplan testen/validieren
./resource-scheduler.sh test "Mon-Fri:08:00-18:00"

# Bericht über geplante Ressourcen
./resource-scheduler.sh report
```

**Verfügbare Zeitpläne:**
- `business-hours` - Mo-Fr 08:00-18:00
- `dev-hours` - Mo-Fr 09:00-17:00  
- `demo-only` - Nur manuelle Kontrolle
- `24x7` - Immer an
- `never` - Immer aus
- `custom:Mo-Fr:09:00-17:00` - Benutzerdefiniert

**Tag-Format:**
```bash
# Tag auf EC2/RDS-Ressource setzen
aws ec2 create-tags --resources i-1234567890abcdef0 --tags Key=AutoSchedule,Value=business-hours
aws rds add-tags-to-resource --resource-name arn:aws:rds:region:account:db:mydb --tags Key=AutoSchedule,Value=dev-hours
```

---

### 4. 🗄️ S3 Lifecycle Optimizer (Lambda)

**Was es tut:**
- Optimiert S3-Speicherkosten durch intelligente Lifecycle-Regeln
- Überführt Daten automatisch in kostengünstigere Speicherklassen
- Bereinigt unvollständige Multipart-Uploads
- Löscht alte Versionen bei versionierten Buckets
- Identifiziert leere Buckets zur Löschung

**Konfiguration über CloudFormation-Parameter:**
- `LIFECYCLE_DAYS_IA` - Tage bis Standard-IA (Standard: 30)
- `LIFECYCLE_DAYS_GLACIER` - Tage bis Glacier (Standard: 90)  
- `LIFECYCLE_DAYS_DEEP_ARCHIVE` - Tage bis Deep Archive (Standard: 365)
- `DELETE_INCOMPLETE_UPLOADS_DAYS` - Unvollständige Uploads löschen (Standard: 7)

**Automatische Ausführung:**
- Läuft wöchentlich via EventBridge
- Sendet Berichte via SNS
- CloudWatch-Metriken für Monitoring

---

### 5. 💰 Budget Shutdown Handler (Lambda)

**Was es tut:**
- Reagiert auf Budget-Alarme mit automatischen Aktionen
- Stoppt nicht-kritische Ressourcen bei 80% Budget-Verbrauch
- Notfall-Abschaltung bei 100% Budget-Verbrauch  
- Sendet detaillierte Benachrichtigungen
- Respektiert Schutz-Tags (`DoNotShutdown`)

**Automatische Aktionen bei Budget-Überschreitungen:**
- **50%**: Warnung per E-Mail/SNS
- **80%**: Stoppen von Dev/Test-Ressourcen
- **100%**: Notfall-Abschaltung aller stopbaren Ressourcen

**Geschützte Ressourcen:**
- Ressourcen mit Tag `DoNotShutdown=true`
- Produktions-Ressourcen (je nach Konfiguration)
- Kritische Infrastruktur-Services

---

## 🚦 Schnellstart

### 1. Voraussetzungen prüfen
```bash
# AWS CLI installiert und konfiguriert?
aws sts get-caller-identity

# Erforderliche Tools verfügbar?
which jq bc
```

### 2. Infrastructure deployen
```bash
# E-Mail-Adresse anpassen!
ALERT_EMAIL=deine@email.de ./deploy-infrastructure.sh deploy
```

### 3. Ressourcen taggen für Scheduling
```bash
# EC2-Instanz für Geschäftszeiten taggen
aws ec2 create-tags --resources i-1234567890abcdef0 --tags Key=AutoSchedule,Value=business-hours

# RDS-Datenbank für Entwicklungszeiten taggen
aws rds add-tags-to-resource --resource-name arn:aws:rds:region:account:db:mydb --tags Key=AutoSchedule,Value=dev-hours
```

### 4. Erste Scans durchführen
```bash
# Ungenutzte Ressourcen scannen
./unused-resource-cleanup.sh scan

# Scheduler-Status prüfen
./resource-scheduler.sh status

# Dashboard aufrufen (URL aus CloudFormation-Output)
```

## ⚠️ Wichtige Hinweise

### Sicherheit
- **Immer zuerst im DRY_RUN-Modus testen**
- Scripts in Entwicklungsumgebung vor Produktion testen
- Backup wichtiger Ressourcen vor automatischer Bereinigung
- Budget-Schwellenwerte sorgfältig wählen

### Kosten
- Budget-Alarme können 24-48h dauern bis sie aktiv werden
- CloudWatch-Logs und -Metriken verursachen minimale Kosten
- SNS-Benachrichtigungen sind praktisch kostenlos
- Lambda-Ausführungen im Free Tier enthalten

### Monitoring
- CloudWatch-Dashboard regelmäßig prüfen
- Lambda-Logs bei Problemen analysieren:
  ```bash
  aws logs tail /aws/lambda/aws-budget-automation-budget-shutdown
  ```
- Budget-Status überwachen:
  ```bash
  aws budgets describe-budgets --account-id $(aws sts get-caller-identity --query Account --output text)
  ```

## 📊 Integration mit anderen Scripts

Diese Scripts arbeiten mit anderen Kostenmanagement-Tools zusammen:

```bash
# Täglichen Kostenbericht erstellen
../cost-management/daily-cost-report.sh

# Free Tier Monitoring
../monitoring/free-tier-monitor.py

# Detaillierte Kostenanalyse
aws ce get-cost-and-usage --time-period Start=2024-01-01,End=2024-02-01 --granularity MONTHLY --metrics BlendedCost
```

## 🔧 Anpassung und Erweiterung

### Zeitpläne anpassen
Bearbeite `resource-scheduler.sh` und füge neue Zeitpläne hinzu:
```bash
# Beispiel für Nachtschicht
"night-shift")
    echo "Mon-Fri:22:00-06:00"
    ;;
```

### Budget-Schwellenwerte ändern
```bash
# Budget erhöhen
BUDGET_LIMIT=100 ALERT_EMAIL=admin@firma.de ./deploy-infrastructure.sh update
```

### Neue Cleanup-Regeln hinzufügen
Erweitere `unused-resource-cleanup.sh` um weitere AWS-Services.

## 📞 Fehlerbehebung

### Häufige Probleme:

1. **"AWS credentials not configured"**
   ```bash
   aws configure
   # oder
   export AWS_ACCESS_KEY_ID=...
   export AWS_SECRET_ACCESS_KEY=...
   ```

2. **"Stack already exists" bei Deployment**
   ```bash
   ./deploy-infrastructure.sh update
   ```

3. **Lambda-Funktion findet Ressourcen nicht**
   - IAM-Berechtigungen prüfen
   - Region-Konfiguration validieren
   - CloudWatch-Logs analysieren

4. **Budget-Alarme funktionieren nicht**
   - E-Mail-Subscription bestätigen
   - 24-48h Aktivierungszeit abwarten
   - Billing-Daten in us-east-1 prüfen

## 📈 Best Practices

1. **Schrittweise Einführung**
   - Zuerst mit kleinen Budgets testen
   - Nur kritische Ressourcen initial überwachen
   - Schrittweise weitere Services hinzufügen

2. **Regelmäßige Wartung**
   - Wöchentlich unused resource cleanup
   - Monatlich Budget-Schwellenwerte prüfen
   - Quarterly Zeitpläne anpassen

3. **Monitoring**
   - CloudWatch-Dashboard täglich prüfen
   - Budget-Trends analysieren
   - Ungewöhnliche Kostenspitzen untersuchen

4. **Dokumentation**
   - Ressourcen-Tags konsistent verwenden
   - Scheduling-Entscheidungen dokumentieren
   - Incident-Response-Prozess definieren

---

**Viel Erfolg bei der AWS-Kostenoptimierung! 💰✨**