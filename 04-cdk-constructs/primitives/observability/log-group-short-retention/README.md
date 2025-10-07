# log-group-short-retention – Kurz

Zweck
- CloudWatch Log Group mit kurzer Aufbewahrung (kostenarm), optional KMS

Wann verwenden
- Standard-Logs für Lambda/ECS/etc. mit geringem Speicherbedarf

Voraussetzungen
- CDK v2, Node 18+

Einbindung
1) Ordner nach src/constructs/l1/log-group-short-retention kopieren
2) Im Stack instanziieren

Beispiel (TypeScript)
```ts
// import { LogGroupShortRetention } from "./constructs/l1/log-group-short-retention";
// new LogGroupShortRetention(this, "Logs", {
//   retentionDays: 14,
// });
```

Props (wichtigste)
- retentionDays?: 7|14|30|…
- kmsKeyArn?: string

Outputs
- logGroupName

Defaults
- Retention 14 Tage, Löschen in DEV möglich
