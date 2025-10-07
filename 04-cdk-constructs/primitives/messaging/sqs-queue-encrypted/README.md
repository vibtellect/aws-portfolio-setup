# sqs-queue-encrypted – Kurz

Zweck
- SQS Queue mit Verschlüsselung (KMS), DLQ optional

Wann verwenden
- Standard-Queue für asynchrone Verarbeitung

Voraussetzungen
- CDK v2, Node 18+

Einbindung
1) Ordner nach src/constructs/l1/sqs-queue-encrypted kopieren
2) Im Stack instanziieren

Beispiel (TypeScript)
```ts
// import { SqsQueueEncrypted } from "./constructs/l1/sqs-queue-encrypted";
// new SqsQueueEncrypted(this, "Queue", {
//   visibilityTimeout: 30,
//   withDlq: true,
//   kmsKeyArn: undefined,
// });
```

Props (wichtigste)
- visibilityTimeout?: Sekunden
- withDlq?: boolean
- kmsKeyArn?: string

Outputs
- queueUrl, dlqUrl?

Defaults
- SSE-KMS an, DLQ optional, kurze Message Retention