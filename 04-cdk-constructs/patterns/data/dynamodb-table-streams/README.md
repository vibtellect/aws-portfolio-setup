# dynamodb-table-streams – Kurz

Zweck
- DynamoDB mit TTL, PITR, optional GSI und Streams inkl. Consumer-Hook

Wann verwenden
- Event-getriebene Systeme, Audit/Change-Streams

Voraussetzungen
- CDK v2, Node 18+

Einbindung
1) Ordner nach src/constructs/dynamodb-table-streams kopieren
2) Im Stack instanziieren

Beispiel (TypeScript)
```ts
// import { DynamoTableWithStreams } from "./constructs/dynamodb-table-streams";
// new DynamoTableWithStreams(this, "Table", {
//   partitionKey: { name: "pk", type: "STRING" },
//   sortKey: { name: "sk", type: "STRING" },
//   billingMode: "PAY_PER_REQUEST",
//   streamConsumer: { handler: "src/handlers/stream.handler" },
// });
```

Props
- partitionKey, sortKey?
- billingMode: PAY_PER_REQUEST/PROVISIONED
- gsis?: [...], streamConsumer?: { handler: string }

Outputs
- tableName, streamArn

Defaults
- PITR an, TTL optional, Verschlüsselung an
