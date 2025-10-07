# network-baseline – Kurz

Zweck
- Standard-VPC (Public/Private Subnets), optionale Gateway Endpoints, NAT-frei möglich

Wann verwenden
- Basis-Netz für Workloads (Serverless/Container)

Voraussetzungen
- CDK v2, Node 18+

Einbindung
1) Ordner nach src/constructs/network-baseline kopieren
2) Im Stack instanziieren

Beispiel (TypeScript)
```ts
// import { NetworkBaseline } from "./constructs/network-baseline";
// new NetworkBaseline(this, "Net", {
//   createNatGateways: 0, // Kostenarm
//   addGatewayEndpoints: ["s3", "dynamodb"],
// });
```

Props
- createNatGateways: 0..n
- addGatewayEndpoints?: ("s3"|"dynamodb")[]
- existingVpc?: Vpc

Outputs
- vpcId, subnetIds

Defaults
- DNS Hostnames aktiviert, kostenschonend (NAT optional)
