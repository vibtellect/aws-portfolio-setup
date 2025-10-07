# iam-role-lambda-basic – Kurz

Zweck
- IAM Rolle für Lambda mit minimalen, sicheren Berechtigungen (Logs, X-Ray optional)

Wann verwenden
- Standardrolle für neue Lambda-Funktionen

Voraussetzungen
- CDK v2, Node 18+

Einbindung
1) Ordner nach src/constructs/l1/iam-role-lambda-basic kopieren
2) Im Stack instanziieren

Beispiel (TypeScript)
```ts
// import { IamRoleLambdaBasic } from "./constructs/l1/iam-role-lambda-basic";
// new IamRoleLambdaBasic(this, "LambdaRole", {
//   enableXray: false,
// });
```

Props (wichtigste)
- enableXray?: boolean
- extraPolicies?: PolicyStatement[]

Outputs
- roleArn

Defaults
- logs:CreateLogGroup/Stream/PutLogEvents, least privilege, optional X-Ray