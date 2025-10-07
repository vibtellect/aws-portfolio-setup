# s3-bucket-lifecycle – Kurz

Zweck
- S3 Bucket mit Lifecycle (IA/Glacier), Versioning optional, Access Logs

Wann verwenden
- Kosteneffiziente Speicherung, Datenlebenszyklus-Management

Voraussetzungen
- CDK v2, Node 18+

Einbindung
1) Ordner nach src/constructs/s3-bucket-lifecycle kopieren
2) Im Stack instanziieren

Beispiel (TypeScript)
```ts
// import { S3BucketLifecycle } from "./constructs/s3-bucket-lifecycle";
// new S3BucketLifecycle(this, "DataBucket", {
//   versioned: true,
//   lifecycle: {
//     toIAAfterDays: 30,
//     toGlacierAfterDays: 90,
//     deleteIncompleteUploadsAfterDays: 7,
//   },
// });
```

Props
- versioned?: boolean
- lifecycle?: { toIAAfterDays, toGlacierAfterDays, deleteIncompleteUploadsAfterDays }
- serverAccessLogsBucket?: Bucket

Outputs
- bucketName, logsBucketName?

Defaults
- Block Public Access, SSE, Lifecycle Defaults
