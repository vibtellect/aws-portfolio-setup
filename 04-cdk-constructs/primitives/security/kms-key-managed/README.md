# kms-key-managed – Kurz

Zweck
- KMS Key für eigene Verschlüsselung (SSE-KMS), Rotation optional

Wann verwenden
- Einheitliche Verschlüsselung für S3, SQS, SNS, Logs

Voraussetzungen
- CDK v2, Node 18+

Einbindung
1) Ordner nach src/constructs/l1/kms-key-managed kopieren
2) Im Stack instanziieren

Beispiel (TypeScript)
```ts
// import { KmsKeyManaged } from "./constructs/l1/kms-key-managed";
// new KmsKeyManaged(this, "Key", {
//   enableRotation: true,
//   alias: "alias/app",
// });
```

Props (wichtigste)
- enableRotation?: boolean
- alias?: string
- policyAdditions?: PolicyStatement[]

Outputs
- keyArn

Defaults
- Key Policy mit Owner, Rotation optional