# api-lambda-httpapi – Kurz

Zweck
- HTTP API (API Gateway HTTP API) mit Lambda-Backend, günstige Defaults (DLQ, Logging optional)

Wann verwenden
- Leichte REST-/HTTP-Endpoints
- Günstige, serverlose Microservices

Voraussetzungen
- CDK v2, Node 18+, AWS CLI

Einbindung
1) Ordner in dein CDK-Projekt (z. B. src/constructs/api-lambda-httpapi)
2) Im Stack importieren und instanziieren

Beispiel (TypeScript)
```ts
// import { ApiLambdaHttpApi } from "./constructs/api-lambda-httpapi";
// new ApiLambdaHttpApi(this, "Api", {
//   routes: [
//     { path: "/health", method: "GET", handler: "src/handlers/health.handler" }
//   ],
//   alarms: { latencyP99: true, errorRate: true },
// });
```

Props
- routes[]: Pfad/Method/Handler
- environment?: Key-Value
- reservedConcurrency?: number
- alarms?: { latencyP99?: boolean; errorRate?: boolean }

Outputs
- apiUrl, functionArn

Defaults
- HTTP API, DLQ optional, Logs an, kurze Retention
