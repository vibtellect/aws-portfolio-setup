# queue-worker – Kurz

Zweck
- SQS Queue + Lambda Worker mit DLQ und abgestimmten Timeouts

Wann verwenden
- Asynchrone Verarbeitung, Entkopplung

Voraussetzungen
- CDK v2, Node 18+, AWS CLI

Einbindung
1) Ordner nach src/constructs/queue-worker kopieren
2) Im Stack instanziieren

Beispiel (TypeScript)
```ts
// import { QueueWorker } from "./constructs/queue-worker";
// new QueueWorker(this, "Worker", {
//   visibilityTimeout: 30,
//   batchSize: 5,
// });
```

Props
- visibilityTimeout: Sekunden
- batchSize?: 1–10
- encryption?: true/false

Outputs
- queueUrl, dlqUrl, functionArn

Defaults
- DLQ an, serverseitige Verschlüsselung, Logs
