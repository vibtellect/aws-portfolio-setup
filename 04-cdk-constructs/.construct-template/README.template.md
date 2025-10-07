# {construct-name}

> **Status:** 🟢 Stable | 🟡 Beta | 🔴 Experimental  
> **Version:** v1.0.0 | **Last Updated:** {date}

## Zweck
- {Eine Zeile: Was macht dieser Baustein?}

## Wann verwenden
- ✅ {Szenario 1: Perfekt wenn...}
- ✅ {Szenario 2: Gut für...}
- ❌ **NICHT verwenden wenn:** {Anti-Pattern}

## Voraussetzungen
- AWS CDK v2.120.0+
- Node.js 18+
- **Dependencies:** {Andere Constructs, falls benötigt, sonst "Keine"}

## Quick Start
```ts
import { ConstructName } from "./constructs/{path}/{construct-name}";

new ConstructName(this, "Id", {
  requiredProp: "value",
});
```

## Konfiguration

### Props (erforderlich)
- `requiredProp: string` – {Beschreibung}

### Props (optional)
- `optionalProp?: number` – Default: {value}

### Outputs
- `constructArn: string` – ARN der Ressource
- `constructUrl?: string` – Optionale URL

## Kosten
- **Free Tier:** {Ja/Nein, Details}
- **Typisch:** ~{X}€/Monat bei {Y} Nutzung
- **Kostenfallen:** {Warnung falls vorhanden, sonst "Keine bekannt"}

## Beispiele

### Minimal
```ts
// {Beschreibung}
new ConstructName(this, "Example", {
  requiredProp: "value"
});
```

### Production
```ts
// Mit Alarms, Logging, etc.
// {Code}
```

## Dependencies (intern)
- Nutzt: `{path/to/other-construct}` (falls zutreffend)
- Nutzt: `{another-construct}` (falls zutreffend)
- Keine internen Dependencies (falls standalone)

## Sicherheit
- ✅ {Security-Feature 1}
- ✅ {Security-Feature 2}
- ⚠️ **Achtung:** {Spezifische Hinweise}

## Bekannte Limitationen
- {Limitation 1, falls vorhanden}
- Keine bekannten Limitationen

## Related Constructs
- Alternative: `{path/alternative}`
- Complement: `{path/complement}`

---

**Maintainer:** @{github-user} | **Issues:** [GitHub Issues](https://github.com/...)
