# 🚀 Quick Start - CDK Constructs Library

> **In 5 Minuten:** Von Installation bis zum ersten Deploy

---

## 1. Installation

```bash
# In deinem CDK-Projekt
npm install @vibtellect/aws-cdk-constructs

# Peer Dependencies (falls noch nicht installiert)
npm install aws-cdk-lib constructs
```

---

## 2. Dein erster Stack

Erstelle eine neue Stack-Datei `lib/my-first-stack.ts`:

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {
  S3BucketSecure,
  CloudFrontDistributionSecure
} from '@vibtellect/aws-cdk-constructs';

export class MyFirstStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // 1. Sicherer S3 Bucket
    const bucket = new S3BucketSecure(this, 'WebsiteBucket', {
      bucketName: 'my-website-content-bucket',
      versioned: true
    });

    // 2. CloudFront Distribution
    const cdn = new CloudFrontDistributionSecure(this, 'CDN', {
      originBucket: bucket.bucket,
      comment: 'My website CDN'
    });

    // 3. Output für CloudFront URL
    new cdk.CfnOutput(this, 'WebsiteURL', {
      value: `https://${cdn.distributionDomainName}`,
      description: 'CloudFront Distribution URL'
    });
  }
}
```

---

## 3. Stack registrieren

Update deine `bin/app.ts`:

```typescript
#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { MyFirstStack } from '../lib/my-first-stack';

const app = new cdk.App();

new MyFirstStack(app, 'MyFirstStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'eu-central-1'
  }
});
```

---

## 4. Deploy

```bash
# CDK Bootstrap (nur einmal pro Region/Account)
cdk bootstrap

# Synthesize CloudFormation Template
cdk synth

# Deploy
cdk deploy

# Nach dem Deploy siehst du die CloudFront URL:
# Outputs:
# MyFirstStack.WebsiteURL = https://d111111abcdef8.cloudfront.net
```

---

## 5. Nächste Schritte

### Serverless Backend hinzufügen

```typescript
import {
  LambdaFunctionSecure,
  DynamoDbTableStandard,
  ApiGatewayRestApiStandard
} from '@vibtellect/aws-cdk-constructs';

// DynamoDB Tabelle
const table = new DynamoDbTableStandard(this, 'Table', {
  tableName: 'my-app-data',
  partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING }
});

// Lambda Function
const fn = new LambdaFunctionSecure(this, 'Function', {
  functionName: 'my-api-handler',
  runtime: lambda.Runtime.NODEJS_18_X,
  handler: 'index.handler',
  code: lambda.Code.fromAsset('lambda')
});

// DynamoDB Permissions
table.table.grantReadWriteData(fn.function);

// API Gateway
const api = new ApiGatewayRestApiStandard(this, 'Api', {
  restApiName: 'my-api'
});

api.restApi.root.addResource('items')
  .addMethod('GET', new apigateway.LambdaIntegration(fn.function));
```

### Verschlüsselung hinzufügen

```typescript
import { KmsKeyManaged } from '@vibtellect/aws-cdk-constructs';

// KMS Key
const kmsKey = new KmsKeyManaged(this, 'AppKey', {
  keyAlias: 'my-app-key',
  enableKeyRotation: true,
  enableS3Access: true,
  enableDynamoDbAccess: true
});

// Verwenden in anderen Constructs
const bucket = new S3BucketSecure(this, 'Bucket', {
  bucketName: 'my-encrypted-bucket',
  encryptionKey: kmsKey.key
});
```

### DNS & Routing hinzufügen

```typescript
import {
  Route53HostedZoneStandard,
  Route53RecordSetStandard
} from '@vibtellect/aws-cdk-constructs';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';

// Hosted Zone
const zone = new Route53HostedZoneStandard(this, 'Zone', {
  zoneName: 'example.com'
});

// DNS Record für CloudFront
const record = new Route53RecordSetStandard(this, 'WebsiteRecord', {
  hostedZone: zone.hostedZone,
  recordName: 'www.example.com',
  recordType: route53.RecordType.A,
  target: route53.RecordTarget.fromAlias(
    new targets.CloudFrontTarget(cdn.distribution)
  )
});
```

---

## 📚 Weitere Ressourcen

- **[Vollständige Dokumentation](./README_DE.md)** - Alle Features und Beispiele
- **[Konfiguration](./KONFIGURATION.md)** - Detaillierte Konfigurationsoptionen für alle 13 Constructs
- **[Implementation Status](./IMPLEMENTATION_STATUS.md)** - Aktueller Stand der Library
- **[Contributing](./CONTRIBUTING.md)** - Wie du beitragen kannst

---

## ⚡ Verfügbare Constructs

| Kategorie | Constructs | Status |
|-----------|-----------|---------|
| **Security** | IamRoleLambdaBasic, KmsKeyManaged | ✅ Production-Ready |
| **Storage** | S3BucketSecure | ✅ Production-Ready |
| **Database** | DynamoDbTableStandard | ✅ Production-Ready |
| **Compute** | LambdaFunctionSecure | ✅ Production-Ready |
| **API** | ApiGatewayRestApiStandard | ✅ Production-Ready |
| **Messaging** | SqsQueueEncrypted, SnsTopicEncrypted | ✅ Production-Ready |
| **CDN** | CloudFrontDistributionSecure | ✅ Production-Ready |
| **Networking** | Route53HostedZoneStandard, Route53RecordSetStandard | ✅ Production-Ready |
| **Auth** | CognitoUserPoolStandard | ✅ Production-Ready |
| **Observability** | LogGroupShortRetention | ✅ Production-Ready |

**Total: 13/13 Constructs (100% Complete!** 🎉

---

## 💡 Best Practices

### Security Defaults
- ✅ Alle S3 Buckets: Block Public Access standardmäßig aktiviert
- ✅ Alle CloudFront: HTTPS-only, TLS 1.2+ minimum
- ✅ Alle Messaging: KMS-Verschlüsselung standardmäßig aktiviert
- ✅ Alle IAM Roles: Least-Privilege Policies

### Cost Optimization
- ✅ LogGroupShortRetention: 14 Tage statt 1 Jahr (70% Kostenersparnis)
- ✅ DynamoDB: On-Demand Pricing als Default
- ✅ Lambda: ARM64 (Graviton2) Support für 20% Kostenersparnis
- ✅ CloudFront: Cost-optimized Price Class als Default

### Developer Experience
- ✅ 100% TypeScript mit vollständigen Type Definitions
- ✅ Alle Properties mit sinnvollen Defaults
- ✅ Automatische Security Best Practices
- ✅ Ausführliche JSDoc-Kommentare

---

## 🆘 Hilfe benötigt?

1. **Detaillierte Beispiele**: Siehe [KONFIGURATION.md](./KONFIGURATION.md)
2. **Vollständige Dokumentation**: Siehe [README_DE.md](./README_DE.md)
3. **Issues**: https://github.com/vibtellect/aws-portfolio-setup/issues

---

Viel Erfolg mit deinem CDK-Projekt! 🚀
