# s3-bucket-secure

> **Status:** 🟢 Stable  
> **Version:** v1.0.0 | **Last Updated:** 2025-01-07

## Zweck
- S3 Bucket mit sicheren Defaults: Block Public Access, SSE-S3, optionale Access Logs

## Wann verwenden
- ✅ Standard-Bucket für Daten/Artefakte mit minimaler Konfiguration
- ✅ Statische Website-Assets, Build-Artefakte, Backup-Storage
- ✅ Entwicklungs- und Produktionsumgebungen
- ❌ **NICHT verwenden wenn:** Hochkomplexe Compliance-Anforderungen (nutze s3-bucket-lifecycle)

## Voraussetzungen
- AWS CDK v2.120.0+
- Node.js 18+
- **Dependencies:** Keine

## Quick Start
```ts
import { S3BucketSecure } from "./constructs/primitives/storage/s3-bucket-secure";

new S3BucketSecure(this, "DataBucket", {
  versioned: true,
});
```

## Konfiguration

### Props (erforderlich)
- Keine (alle Props optional)

### Props (optional)
- `versioned?: boolean` – Default: false, aktiviert Versionierung
- `serverAccessLogs?: boolean` – Default: false, erstellt separaten Logs-Bucket
- `removalPolicy?: RemovalPolicy` – Default: RETAIN (Prod), DESTROY (Dev)

### Outputs
- `bucketName: string` – Name des Buckets
- `bucketArn: string` – ARN des Buckets
- `logsBucketName?: string` – Name des Logs-Buckets (falls serverAccessLogs=true)

## Kosten
- **Free Tier:** Ja – 5 GB Storage, 20k GET, 2k PUT (12 Monate)
- **Typisch:** ~0,50€/Monat bei 50 GB Storage + moderate Requests
- **Kostenfallen:** Keine bekannt (Storage kostet nur bei Nutzung)

## Beispiele

### Minimal (Standard-Bucket)
```ts
import { S3BucketSecure } from "./constructs/primitives/storage/s3-bucket-secure";

new S3BucketSecure(this, "Bucket");
```

### Production (mit Versioning + Logs)
```ts
new S3BucketSecure(this, "ProductionBucket", {
  versioned: true,
  serverAccessLogs: true,
  removalPolicy: cdk.RemovalPolicy.RETAIN,
});
```

## Dependencies (intern)
- Keine internen Dependencies

## Sicherheit
- ✅ Block Public Access aktiviert (alle 4 Flags)
- ✅ SSE-S3 Verschlüsselung (serverseitig)
- ✅ Enforced HTTPS (via Bucket Policy)
- ⚠️ **Achtung:** KMS-Verschlüsselung nicht standardmäßig (nutze kms-key-managed für SSE-KMS)

## Bekannte Limitationen
- Keine automatischen Lifecycle-Regeln (nutze patterns/data/s3-bucket-lifecycle)
- Kein CloudFront OAC (nutze patterns/web/static-site-cloudfront)

## Related Constructs
- Alternative: `patterns/data/s3-bucket-lifecycle` (mit Lifecycle-Regeln)
- Complement: `primitives/security/kms-key-managed` (für SSE-KMS)

---

**Maintainer:** @vitalij | **Issues:** GitHub Issues
