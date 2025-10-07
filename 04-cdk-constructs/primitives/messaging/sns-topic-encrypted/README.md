# sns-topic-encrypted – Kurz

Zweck
- SNS Topic mit KMS-Verschlüsselung, E-Mail/HTTP(S) Subscriptions möglich

Wann verwenden
- Ereignis-Benachrichtigungen, Fan-out

Voraussetzungen
- CDK v2, Node 18+

Einbindung
1) Ordner nach src/constructs/l1/sns-topic-encrypted kopieren
2) Im Stack instanziieren

Beispiel (TypeScript)
```ts
// import { SnsTopicEncrypted } from "./constructs/l1/sns-topic-encrypted";
// new SnsTopicEncrypted(this, "Topic", {
//   kmsKeyArn: undefined,
// });
```

Props (wichtigste)
- kmsKeyArn?: string
- displayName?: string

Outputs
- topicArn

Defaults
- SSE-KMS an, Policy least privilege