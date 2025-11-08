# 🐰 CodeRabbit Setup

**Automatisierte Code Reviews mit AI für dein AWS Portfolio**

---

## 🎯 Was ist CodeRabbit?

CodeRabbit ist ein AI-powered Code Review Tool, das automatisch:
- ✅ Code Quality überprüft
- 🔒 Security Issues findet
- 💰 AWS Kostenfallen erkennt
- 📝 Best Practices vorschlägt
- 🐛 Bugs identifiziert

---

## 🚀 Installation

### 1. GitHub App installieren

Gehe zu: [CodeRabbit GitHub App](https://github.com/apps/coderabbitai)

1. Klicke auf **"Install"**
2. Wähle dein Repository: `vibtellect/aws-portfolio-setup`
3. Autorisiere die App

### 2. Konfiguration committen

Die Konfigurationsdatei `.coderabbit.yaml` ist bereits erstellt:

```bash
cd /home/vitalij/projects/aws-portfolio-setup
git add .coderabbit.yaml
git commit -m "feat: Add CodeRabbit configuration"
git push
```

---

## ⚙️ Konfiguration

### AWS-spezifische Checks

Die Konfiguration enthält spezielle Rules für dein AWS-Projekt:

#### 1. **Cost Check** (⚠️ Warning)
Erkennt teure AWS Ressourcen:
- NAT Gateway (~45€/Monat)
- Multi-AZ Deployments
- Große Instance-Typen (t2.large, t2.xlarge)
- Teure RDS Instanzen

#### 2. **Credentials Check** (🚨 Critical)
Verhindert hardcoded AWS Credentials:
- AWS Access Keys
- AWS Secret Keys
- Andere sensitive Daten

#### 3. **Terraform State** (💡 Info)
Erinnert an Remote State Configuration

### Review-Fokus

CodeRabbit reviewt:
- **Security**: IAM Policies, Credentials, Permissions
- **Performance**: Optimierungen, Bottlenecks
- **Best Practices**: AWS Best Practices, Clean Code
- **Bugs**: Logikfehler, Edge Cases
- **Maintainability**: Code-Qualität, Lesbarkeit

### Ignorierte Dateien

Folgende Dateien werden **nicht** reviewt:
- Markdown-Dateien (`*.md`)
- Build-Artifacts (`dist/`, `build/`)
- Dependencies (`node_modules/`)
- Terraform State (`.terraform/`)
- CDK Output (`cdk.out/`)

---

## 📋 Workflow

### Pull Request erstellen

```bash
# Branch erstellen
git checkout -b feature/neue-funktion

# Änderungen machen
# ...

# Committen
git add .
git commit -m "feat: Add new feature"

# Pushen
git push origin feature/neue-funktion
```

### CodeRabbit Review

1. **Pull Request** auf GitHub erstellen
2. **CodeRabbit** startet automatisch (~30 Sekunden)
3. **Review-Kommentare** erscheinen direkt im PR
4. **AI Summary** wird generiert
5. **Änderungen** umsetzen basierend auf Feedback

### Review-Kommentare

CodeRabbit erstellt verschiedene Arten von Kommentaren:

- 🚨 **Critical**: Sofort beheben (z.B. Security Issues)
- ⚠️ **Warning**: Sollte behoben werden (z.B. Kostenfallen)
- 💡 **Suggestion**: Verbesserungsvorschlag
- ℹ️ **Info**: Hinweis/Tipp

---

## 🛠️ Features

### 1. AI Summary
Zusammenfassung aller Änderungen im PR:
- Was wurde geändert?
- Welche Impact hat es?
- Welche Risks gibt es?

### 2. Inline Suggestions
Konkrete Code-Verbesserungen direkt im PR:
```python
# Vorher
if x == True:
    return y

# CodeRabbit Suggestion
if x:
    return y
```

### 3. Security Scan
Automatische Sicherheitsprüfung:
- Hardcoded Credentials
- SQL Injection Risks
- XSS Vulnerabilities
- AWS IAM Best Practices

### 4. Performance Insights
Performance-Optimierungen:
- Langsame Queries
- Ineffiziente Loops
- Memory Leaks
- N+1 Problems

---

## 📊 Labels

CodeRabbit setzt automatisch Labels:

| Label | Beschreibung |
|-------|--------------|
| `security` | Security-relevante Änderungen |
| `cost-optimization` | AWS Cost Optimizations |
| `infrastructure` | IaC Änderungen (Terraform, CDK) |
| `iam` | IAM Policy Änderungen |
| `credentials` | Credential-bezogene Änderungen |

---

## 💰 Kosten

### Free Tier
- ✅ Unbegrenzte Public Repositories
- ✅ Alle Features verfügbar
- ✅ Keine Kreditkarte nötig

### Pro (Optional)
- Private Repositories
- Erweiterte Checks
- Priority Support
- ~$19/Monat

**Für dein Projekt:** Free Tier reicht völlig aus!

---

## 🎯 Best Practices

### 1. Kleine Pull Requests
- Max. 300-500 Zeilen
- Fokus auf eine Änderung
- Bessere Review-Qualität

### 2. Descriptive Commits
```bash
# Gut
feat: Add cost monitoring dashboard
fix: Resolve memory leak in Lambda function

# Schlecht
Update files
Changes
```

### 3. Review-Feedback umsetzen
- Critical/Warning Issues beheben
- Suggestions evaluieren
- Feedback kommentieren

### 4. CodeRabbit trainieren
- Feedback geben (👍/👎)
- Falsche Positives melden
- Learning Mode nutzen

---

## 🔧 Troubleshooting

### CodeRabbit startet nicht

**Problem:** Kein Review nach PR-Erstellung

**Lösung:**
1. Prüfe GitHub App Installation
2. Prüfe Repository Permissions
3. Force-Trigger: PR schließen & reopenen

### Zu viele Kommentare

**Problem:** CodeRabbit erstellt zu viele Kommentare

**Lösung:**
```yaml
# In .coderabbit.yaml
reviews:
  level: moderate  # statt "detailed"
```

### Falsche Sprache

**Problem:** Reviews sind auf Englisch

**Lösung:**
```yaml
# In .coderabbit.yaml
language: de
```

---

## 📚 Weitere Ressourcen

- 📖 [CodeRabbit Dokumentation](https://docs.coderabbit.ai)
- 🎥 [Video Tutorials](https://www.youtube.com/@coderabbitai)
- 💬 [Community Discord](https://discord.gg/coderabbit)
- 📝 [Blog](https://coderabbit.ai/blog)

---

## ✅ Next Steps

1. **GitHub App installieren** (5 Minuten)
2. **Konfiguration committen** (siehe oben)
3. **Test-PR erstellen** und CodeRabbit testen
4. **Feedback geben** und Konfiguration optimieren

**Viel Erfolg mit automatisierten Code Reviews! 🚀**
