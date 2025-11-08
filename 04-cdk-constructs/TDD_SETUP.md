# TDD Setup: Vollständige Konfiguration

> **Status:** ✅ Vollständig eingerichtet und einsatzbereit
> **Datum:** $(date +%Y-%m-%d)
> **Version:** 2.0.0 (TDD-ready)

---

## 🎯 Was wurde eingerichtet?

Dieses Projekt ist jetzt vollständig für **Test-Driven Development (TDD)** konfiguriert.

### ✅ Neue Dateien

```
04-cdk-constructs/
├── package.json                      # ✅ Root package.json mit TDD-Scripts
├── tsconfig.json                     # ✅ TypeScript Config (strict mode)
├── jest.config.js                    # ✅ Jest Config (TDD-optimiert)
├── TDD_GUIDE.md                      # ✅ Umfassender TDD Guide
├── TDD_SETUP.md                      # ✅ Diese Datei
├── GETTING_STARTED.md                # ✅ Aktualisiert für TDD
│
├── .construct-template/
│   ├── package.template.json         # ✅ Aktualisiert (test:tdd script)
│   ├── tsconfig.template.json        # ✅ Aktualisiert (strict)
│   └── jest.config.template.js       # ✅ Aktualisiert (verbose, watch)
│
├── scripts/
│   ├── create-construct.sh           # ✅ Bash Scaffolding Script
│   └── create-construct.js           # ✅ Node.js Wrapper
│
└── .github/workflows/
    └── cdk-constructs-test.yml       # ✅ CI/CD Pipeline für Tests
```

---

## 🚀 Quick Start

### 1. Erstes Construct mit TDD erstellen

```bash
# In das Projekt-Verzeichnis wechseln
cd 04-cdk-constructs

# Neues Construct scaffolden
npm run scaffold primitives observability log-group-short-retention

# Zum Construct navigieren
cd primitives/observability/log-group-short-retention

# TDD Watch Mode starten
npm run test:tdd
```

### 2. TDD Workflow (in anderem Terminal)

```bash
# Terminal 1: Watch Mode läuft
npm run test:tdd

# Terminal 2: Entwicklung
vim test/unit.test.ts  # 🔴 RED: Test schreiben
vim src/index.ts       # 🟢 GREEN: Code implementieren
# → Tests werden automatisch ausgeführt!
```

---

## 📦 Verfügbare NPM Scripts

### Root-Ebene (04-cdk-constructs/)

```bash
# Tests
npm test              # Alle Tests mit Coverage
npm run test:watch    # Watch Mode mit Coverage
npm run test:tdd      # TDD Watch Mode (empfohlen!)
npm run test:ci       # CI Mode für GitHub Actions

# Build
npm run build         # TypeScript kompilieren
npm run build:watch   # Build in Watch Mode

# Quality
npm run lint          # ESLint ausführen
npm run format        # Prettier formatieren

# Scaffolding
npm run scaffold <category> <domain> <name>
# Beispiel:
npm run scaffold primitives compute lambda-function-secure
```

### Construct-Ebene (in jedem Construct-Ordner)

```bash
# Tests
npm test              # Tests mit Coverage
npm run test:watch    # Watch Mode
npm run test:tdd      # TDD Watch Mode (empfohlen!)
npm run test:coverage # Nur Coverage Report

# Build
npm run build         # TypeScript kompilieren
npm run build:watch   # Build in Watch Mode

# CDK
npm run synth         # CloudFormation Template generieren
npm run diff          # Unterschiede anzeigen
npm run deploy        # Stack deployen
```

---

## 🧪 Jest Konfiguration

### TDD-Optimierungen

Die Jest-Konfiguration wurde speziell für TDD optimiert:

```javascript
// jest.config.js
{
  verbose: true,              // Detaillierte Ausgabe
  silent: false,              // Zeige console.log in Tests
  clearMocks: true,           // Mocks automatisch clearen
  watchPathIgnorePatterns,    // Schnellere Watch Performance
  coverageThreshold: 80%,     // Mindestens 80% Coverage
}
```

### Watch Mode Features

Im TDD Watch Mode (`npm run test:tdd`):
- ⚡ **Schnell** - Keine Coverage, nur Tests
- 🔍 **Verbose** - Alle Test-Details sichtbar
- 🔄 **Auto-Reload** - Bei Dateiänderungen
- 🎯 **Filtered** - Teste nur geänderte Files

---

## 📐 TypeScript Konfiguration

### Strict Mode aktiviert

```json
{
  "strict": true,
  "noImplicitAny": true,
  "strictNullChecks": true,
  "strictFunctionTypes": true,
  "strictPropertyInitialization": true,
  "noUnusedLocals": true,
  "noUnusedParameters": true,
  "noImplicitReturns": true
}
```

**Warum?** Strenge Type-Checks fangen Fehler früh und erzwingen sauberen Code.

---

## 🔧 Template System

### Automatisches Scaffolding

Das `npm run scaffold` Script erstellt automatisch:

1. **Ordnerstruktur** - src/, test/, examples/
2. **Konfigurationsdateien** - package.json, tsconfig.json, jest.config.js
3. **Template-Code** - Vorgefertigter Test + Source Code
4. **Dokumentation** - README.md, CHANGELOG.md, QUICKSTART.md
5. **Dependencies** - npm install automatisch ausgeführt

### Platzhalter-Ersetzung

Das Script ersetzt automatisch:
- `{construct-name}` → dein-construct-name
- `{ConstructName}` → DeinConstructName
- `{category}` → primitives/patterns
- `{domain}` → compute/storage/etc.
- `{YYYY-MM-DD}` → aktuelles Datum

---

## 🔄 GitHub Actions CI/CD

### Automatische Tests bei jedem Push

Die CI-Pipeline testet automatisch:
- ✅ Alle Constructs
- ✅ Auf Node 18 + 20
- ✅ Linting
- ✅ TypeScript Compilation
- ✅ Code Coverage
- ✅ Formatierung

### Trigger

Tests laufen bei:
- Push zu `main`, `develop`, `claude/**` branches
- Pull Requests
- Manueller Trigger (workflow_dispatch)

### Artefakte

Die Pipeline speichert:
- Coverage Reports (30 Tage)
- Test Results (JUnit XML)
- Build-Logs

---

## 📊 Code Coverage

### Mindest-Anforderungen

```
┌─────────────────────────────────────┐
│ Metric      │ Minimum │ Empfohlen  │
├─────────────────────────────────────┤
│ Statements  │ 80%     │ 90%+       │
│ Branches    │ 80%     │ 85%+       │
│ Functions   │ 80%     │ 90%+       │
│ Lines       │ 80%     │ 90%+       │
└─────────────────────────────────────┘
```

### Coverage Report anzeigen

```bash
npm run test:coverage
open coverage/index.html  # Mac
xdg-open coverage/index.html  # Linux
```

---

## 🎓 TDD Best Practices

### Der TDD-Zyklus

```
1. 🔴 RED
   └─ Schreibe Test der fehlschlägt
      └─ Test beschreibt gewünschtes Verhalten

2. 🟢 GREEN
   └─ Schreibe minimalen Code um Test zu bestehen
      └─ Nicht perfekt, nur funktionierend

3. 🔧 REFACTOR
   └─ Verbessere Code ohne Funktionalität zu ändern
      └─ Tests bleiben grün!

→ Repeat für nächstes Feature
```

### Goldene Regeln

1. **Test ZUERST** - Nie Code ohne Test
2. **Klein anfangen** - Einfachster Test zuerst
3. **Schnell iterieren** - Watch Mode nutzen
4. **Grün bleiben** - Commits nur wenn Tests grün
5. **Refactor oft** - Code verbessern nach Green

---

## 📚 Dokumentation

### Verfügbare Guides

| Guide | Beschreibung | Für wen? |
|-------|--------------|----------|
| [TDD_GUIDE.md](./TDD_GUIDE.md) | Vollständiger TDD Guide mit Beispielen | Alle Entwickler |
| [GETTING_STARTED.md](./GETTING_STARTED.md) | Erste 5 Constructs mit TDD | Einsteiger |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | Contribution Guidelines | Contributors |
| [PHASE2_PRD.md](./PHASE2_PRD.md) | Implementierungs-Roadmap | Projekt-Manager |

### Quick Reference

```bash
# TDD Guide öffnen
cat 04-cdk-constructs/TDD_GUIDE.md | less

# Getting Started öffnen
cat 04-cdk-constructs/GETTING_STARTED.md | less

# In jedem Construct: QUICKSTART.md
cat QUICKSTART.md
```

---

## 🐛 Troubleshooting

### Tests schlagen fehl mit "Cannot find module"

```bash
# Lösung: Dependencies installieren
npm install
```

### TypeScript Compilation Errors

```bash
# Lösung: tsconfig prüfen und neu bauen
npm run build
```

### Watch Mode funktioniert nicht

```bash
# Lösung: Cache löschen
rm -rf node_modules/.cache
npm test -- --clearCache
```

### Coverage nicht generiert

```bash
# Lösung: Explizit Coverage anfordern
npm run test:coverage
```

---

## ✅ Validierung: Setup testen

Prüfe ob alles funktioniert:

```bash
# 1. Root Tests (sollten noch keine sein)
cd 04-cdk-constructs
npm test
# Erwartung: "No tests found"

# 2. Scaffold ein Test-Construct
npm run scaffold primitives compute test-lambda

# 3. Teste das neue Construct
cd primitives/compute/test-lambda
npm run test:tdd
# Erwartung: Tests laufen, Watch Mode aktiv

# 4. Cleanup
cd ../../..
rm -rf primitives/compute/test-lambda
```

---

## 🎯 Nächste Schritte

### Für Entwickler

1. **Lies den TDD Guide:** [TDD_GUIDE.md](./TDD_GUIDE.md)
2. **Erstelle erstes Construct:** `npm run scaffold ...`
3. **Starte TDD Watch Mode:** `npm run test:tdd`
4. **Folge dem RED-GREEN-REFACTOR Zyklus**

### Für das Team

1. **Phase 2 Implementierung starten:** Siehe [PHASE2_PRD.md](./PHASE2_PRD.md)
2. **Alle 13 Constructs mit TDD implementieren**
3. **80%+ Test Coverage erreichen**
4. **CI/CD Pipeline beobachten**

---

## 📊 Setup Statistik

```
✅ Dateien erstellt:     12
✅ Scripts hinzugefügt:  10
✅ Dependencies:         394 packages
✅ Test Coverage:        80% minimum
✅ TypeScript:           Strict mode
✅ CI/CD:               GitHub Actions
✅ Scaffolding:         Automatisch
✅ Documentation:       Vollständig
```

---

## 🚀 Los geht's!

**Das Setup ist komplett. Du bist bereit für TDD!**

```bash
# Start your journey:
npm run scaffold primitives observability log-group-short-retention
cd primitives/observability/log-group-short-retention
npm run test:tdd

# Happy Testing! 🎉
```

---

**Erstellt:** $(date +%Y-%m-%d)
**Version:** 2.0.0 (TDD-ready)
**Status:** ✅ Production-Ready
