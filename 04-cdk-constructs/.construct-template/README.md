# CDK Construct Template

Dieses Template-Verzeichnis enthält alle Dateien, die du brauchst, um ein neues, production-ready CDK Construct zu erstellen.

## 📁 Template-Struktur

```
.construct-template/
├── README.md                      # Diese Datei
├── SETUP_GUIDE.md                 # Detaillierte Anleitung
├── README.template.md             # README für neues Construct
├── CHANGELOG.template.md          # Changelog-Vorlage
├── package.template.json          # NPM Package Config
├── tsconfig.template.json         # TypeScript Config
├── jest.config.template.js        # Jest Test Config
├── .gitignore.template            # Git Ignore Patterns
├── src/
│   └── index.template.ts          # Source Code Template
├── test/
│   └── unit.test.template.ts      # Unit Test Template
└── examples/
    ├── basic.template.ts          # Minimal-Beispiel
    └── production.template.ts     # Production-Beispiel
```

## 🚀 Quick Start

### Option 1: Schnellste Methode

```bash
# 1. Ordner erstellen
cd 04-cdk-constructs/{category}/{domain}/
mkdir my-construct && cd my-construct

# 2. Template kopieren und umbenennen
cp -r ../../.construct-template/* .
mv README.template.md README.md
mv CHANGELOG.template.md CHANGELOG.md
mv package.template.json package.json
mv tsconfig.template.json tsconfig.json
mv jest.config.template.js jest.config.js
mv .gitignore.template .gitignore
mv src/index.template.ts src/index.ts
mv test/unit.test.template.ts test/unit.test.ts
mv examples/basic.template.ts examples/basic.ts
mv examples/production.template.ts examples/production.ts

# 3. Platzhalter ersetzen (in deinem Editor)
# Suche & Ersetze: {construct-name}, {ConstructName}, etc.

# 4. Setup abschließen
npm install
npm test
```

### Option 2: Mit vollständiger Anleitung

Folge der detaillierten Schritt-für-Schritt-Anleitung: [SETUP_GUIDE.md](./SETUP_GUIDE.md)

## 📝 Platzhalter-Referenz

Ersetze diese Platzhalter in **allen** Template-Dateien:

| Platzhalter | Beschreibung | Beispiel |
|-------------|--------------|----------|
| `{construct-name}` | Construct-Name in kebab-case | `lambda-function-secure` |
| `{ConstructName}` | Construct-Name in PascalCase | `LambdaFunctionSecure` |
| `{category}` | Kategorie (primitives/patterns) | `primitives` |
| `{domain}` | Domain (compute/api/etc.) | `compute` |
| `{YYYY-MM-DD}` | Aktuelles Datum | `2025-01-07` |
| `{outputProperty1}` | Name der ersten Output-Property | `functionArn` |
| `{outputProperty2}` | Name der zweiten Output-Property | `functionUrl` |
| `{ResourceType}` | AWS CDK Resource Type | `lambda.Function` |
| `{resourceReference}` | Name der CDK Resource-Referenz | `lambdaFunction` |

## 🎯 Template Features

### ✅ Was ist enthalten?

- **📖 README Template** – Vollständig strukturiert mit allen erforderlichen Abschnitten
- **📋 CHANGELOG Template** – Semantic Versioning Format
- **💻 Source Code Template** – TypeScript mit Best Practices
- **🧪 Test Template** – Umfassende Unit-Test-Suite
- **📦 Examples** – Basic & Production Beispiele
- **⚙️ Config Files** – package.json, tsconfig.json, jest.config.js
- **📚 Setup Guide** – Schritt-für-Schritt Anleitung

### 🔐 Eingebaute Best Practices

- **Security First** – Encryption, Least Privilege, Block Public Access
- **Cost Optimization** – Intelligente Defaults für geringe Kosten
- **Type Safety** – TypeScript strict mode aktiviert
- **Testing** – 80% Code Coverage Threshold
- **Documentation** – Vollständig kommentierter Code
- **Validation** – Props-Validierung im Constructor
- **Environment-Aware** – Auto-Detection von Dev/Prod

## 📚 Template-Dateien im Detail

### README.template.md
Umfassendes README mit:
- Status & Version Badge
- Zweck & Use-Cases
- Quick Start Code
- Vollständige Props-Dokumentation
- Kosten-Analyse
- Security Features
- Architektur-Diagramm
- Troubleshooting
- Best Practices

### src/index.template.ts
Production-Ready TypeScript Template mit:
- Props Interface mit JSDoc
- Construct Class mit Kommentaren
- Props-Validierung
- Auto-Detection von Environment (Dev/Prod)
- Tag-Management
- Helper-Funktionen
- Vollständige Output-Properties

### test/unit.test.template.ts
Umfassende Test-Suite mit:
- Basic functionality tests
- Configuration tests
- Security tests
- Validation tests
- Integration tests
- Snapshot tests
- Edge case tests
- Helper functions

### examples/basic.template.ts
Minimales Beispiel:
- Copy-Paste fertig
- Alle Defaults
- 1 CfnOutput
- Kommentiert

### examples/production.template.ts
Production-Grade Beispiel:
- Alle Features aktiviert
- Environment-Detection
- Monitoring & Alarme (auskommentiert)
- Backup-Strategie (auskommentiert)
- Multi-Region Support (auskommentiert)
- Vollständige Tags
- Termination Protection

## 🛠️ Anpassung des Templates

Du kannst das Template selbst erweitern oder anpassen:

### Neue Sections im README hinzufügen

Bearbeite `README.template.md` und füge neue Abschnitte hinzu, z.B.:
- Performance Benchmarks
- Compliance Mappings
- Advanced Configuration
- FAQ Section

### Neue Test-Patterns hinzufügen

Erweitere `test/unit.test.template.ts` mit zusätzlichen Test-Suites:
- Performance tests
- Load tests
- Multi-region tests
- Compliance tests

### Zusätzliche Beispiele

Erstelle neue Example-Templates:
- `examples/minimal.template.ts` – Absolutes Minimum
- `examples/enterprise.template.ts` – Enterprise Features
- `examples/multi-region.template.ts` – Multi-Region Setup

## 📖 Dokumentations-Standards

Alle Templates folgen diesen Standards:

### README Standards
- **Status Badge:** 🟢 Stable | 🟡 Beta | 🔴 Experimental
- **Version:** Semantic Versioning (MAJOR.MINOR.PATCH)
- **Sections:** Siehe README.template.md für vollständige Liste
- **Code Examples:** Immer mit Kommentaren und Copy-Paste-fähig
- **Costs:** Free Tier, Typical, Traps immer dokumentieren

### Code Standards
- **TypeScript:** Strict mode aktiviert
- **Props:** Immer `readonly`, mit JSDoc
- **Validation:** Im Constructor
- **Outputs:** Public properties mit JSDoc
- **Comments:** Inline für komplexe Logik
- **Tags:** ManagedBy, Construct, Environment

### Test Standards
- **Coverage:** Minimum 80%
- **Structure:** Describe + Test Blocks
- **Naming:** Beschreibend ("creates expected resources")
- **Arrange-Act-Assert:** Klar getrennt
- **Helpers:** Am Ende der Datei

## 🔄 Template Updates

Um das Template zu aktualisieren:

```bash
cd .construct-template

# Bearbeite Template-Dateien
vim README.template.md

# Teste die Änderungen
# (Erstelle ein Test-Construct und validiere)

# Commit
git add .
git commit -m "chore(template): update README template with XYZ"
```

## 🤝 Contribution

Verbesserungsvorschläge für das Template?

1. Erstelle ein Issue mit dem Label `template-enhancement`
2. Beschreibe die gewünschte Verbesserung
3. Optional: Erstelle einen PR mit der Änderung

## 📚 Weitere Ressourcen

- [SETUP_GUIDE.md](./SETUP_GUIDE.md) – Detaillierte Setup-Anleitung
- [../CONTRIBUTING.md](../CONTRIBUTING.md) – Contribution Guidelines
- [../README.md](../README.md) – Haupt-README des Projekts
- [AWS CDK Best Practices](https://docs.aws.amazon.com/cdk/v2/guide/best-practices.html)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)

## 📊 Template Statistics

Stand: 2025-01-07

- **Total Files:** 10
- **Lines of Code:** ~1500
- **Test Coverage:** 80%+
- **Documentation:** Vollständig
- **Used By:** 13 Constructs

## ✅ Checklist für Template-Nutzung

Vor der Verwendung des Templates:

- [ ] Hast du [SETUP_GUIDE.md](./SETUP_GUIDE.md) gelesen?
- [ ] Kennst du die Kategorie & Domain für dein Construct?
- [ ] Hast du Node.js 18+ installiert?
- [ ] Hast du AWS CDK CLI installiert?
- [ ] Bist du mit TypeScript vertraut?

Nach dem Setup:

- [ ] Alle Platzhalter ersetzt?
- [ ] README vollständig ausgefüllt?
- [ ] Source Code implementiert?
- [ ] Tests geschrieben und bestanden?
- [ ] Beispiele funktionieren?
- [ ] CHANGELOG erstellt?

---

**Template Version:** 1.0.0  
**Last Updated:** 2025-01-07  
**Maintainer:** @vitalij  
**Issues:** [GitHub Issues](https://github.com/vitalij/aws-portfolio-setup/issues)

---

**Happy Constructing! 🎉**
