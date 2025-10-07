# budget-alerts – Kurz

Zweck
- AWS Budgets + SNS E-Mail Alerts (50%, 80%, 100%)

Wann verwenden
- Kostenüberwachung in allen Accounts/Projekten

Voraussetzungen
- CDK v2, Node 18+, gültige E-Mail-Adresse

Einbindung
1) Ordner nach src/constructs/budget-alerts kopieren
2) Im Stack instanziieren

Beispiel (TypeScript)
```ts
// import { BudgetAlerts } from "./constructs/budget-alerts";
// new BudgetAlerts(this, "Budget", {
//   limitUsd: 20,
//   emails: ["you@example.com"],
// });
```

Props
- limitUsd: number
- emails: string[]

Outputs
- budgetName, topicArn

Defaults
- 50/80/100% Thresholds, SNS Subscription erforderlich
