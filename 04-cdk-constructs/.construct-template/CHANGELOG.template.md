# Changelog

All notable changes to `{construct-name}` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- {Geplantes Feature 1}
- {Geplantes Feature 2}

## [1.0.0] - {YYYY-MM-DD}

### Added
- 🎉 Initial release
- ✨ {Feature 1 Beschreibung}
- ✨ {Feature 2 Beschreibung}
- 📝 Vollständige README mit Beispielen
- ✅ Unit-Tests für alle Hauptfunktionen
- 📦 Basic und Production Beispiele

### Security
- 🔒 {Security Feature 1, z.B. "Encryption at Rest aktiviert"}
- 🔒 {Security Feature 2, z.B. "Block Public Access standardmäßig"}
- 🔒 {Security Feature 3, z.B. "IAM Least Privilege Permissions"}

### Notes
- Getestet mit AWS CDK v2.120.0+
- Kompatibel mit Node.js 18+
- Deployment-Zeit: ~{X} Minuten

---

## Template für zukünftige Releases

## [{MAJOR.MINOR.PATCH}] - {YYYY-MM-DD}

### Added (Neue Features)
- ✨ {Neue Funktion}
- 🎨 {UI/UX Verbesserung}
- ⚡ {Performance Verbesserung}

### Changed (Änderungen an existierenden Features)
- 🔧 {Geänderte Konfiguration}
- 📝 {Dokumentation Update}
- ♻️ {Refactoring}

### Deprecated (Bald entfernt)
- ⚠️ {Feature wird in v{X.0.0} entfernt}
- ⚠️ {Verwende stattdessen: {Alternative}}

### Removed (Entfernte Features)
- 🗑️ {Entferntes Feature}
- 🗑️ {Veraltete API entfernt}

### Fixed (Bugfixes)
- 🐛 {Behobener Bug 1}
- 🐛 {Behobener Bug 2}
- 🔒 {Security Fix}

### Security (Sicherheitsupdates)
- 🔒 {Security Enhancement}
- 🛡️ {Vulnerability Fix}

### BREAKING CHANGES (Nur bei Major Releases)
- ⚠️ **BREAKING:** {Beschreibung der Breaking Change}
  - **Migration:** {Wie migriert man?}
  ```ts
  // Alt
  {old-code}
  
  // Neu
  {new-code}
  ```

---

## Version Guidelines

### Semantic Versioning (MAJOR.MINOR.PATCH)

**MAJOR (1.0.0 → 2.0.0):**
- Breaking Changes (API-Änderungen die bestehenden Code brechen)
- Entfernung von Properties oder Methoden
- Grundlegende Architektur-Änderungen
- Erforderliche Migrations-Schritte

**MINOR (1.0.0 → 1.1.0):**
- Neue Features (backward-compatible)
- Neue optionale Properties
- Neue Methoden
- Deprecation Warnings
- Performance-Verbesserungen

**PATCH (1.0.0 → 1.0.1):**
- Bugfixes
- Security Patches
- Dokumentations-Updates
- Kleinere Verbesserungen ohne API-Änderung

### Commit Message Conventions (Optional)

Empfohlene Commit-Message-Struktur:
```
<type>(<scope>): <subject>

<body>

<footer>
```

Types:
- `feat`: Neues Feature (→ MINOR)
- `fix`: Bugfix (→ PATCH)
- `docs`: Dokumentation
- `style`: Code-Formatierung
- `refactor`: Code-Refactoring
- `test`: Tests
- `chore`: Build/Tools

Beispiel:
```
feat(s3): add lifecycle rules support

- Neue Property 'lifecycleRules' hinzugefügt
- Automatische Transition zu IA/Glacier
- Docs und Tests aktualisiert

Closes #123
```

---

## Links

- [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
- [Semantic Versioning](https://semver.org/spec/v2.0.0.html)
- [Conventional Commits](https://www.conventionalcommits.org/)
