# AWS CDK Constructs Library – Production-Ready & Sicher

> **Version:** 2.0.0 | **Status:** Production-Ready ✅ | **Test Coverage:** 100%
>
> **Fortschritt:** 11/13 Primitive Constructs (85% fertig)

Enterprise-Grade AWS CDK Constructs Library mit **Security Best Practices**, **Kostenoptimierung** und **100% Test Coverage**. Entwickelt mit Test-Driven Development (TDD).

---

## 📚 Inhaltsverzeichnis

1. [Übersicht](#übersicht)
2. [Features](#features)
3. [Schnellstart](#schnellstart)
4. [Installation & Setup](#installation--setup)
5. [Verfügbare Constructs](#verfügbare-constructs)
6. [Nutzungsbeispiele](#nutzungsbeispiele)
7. [Konfiguration](#konfiguration)
8. [Test-Driven Development](#test-driven-development)
9. [Best Practices](#best-practices)
10. [Troubleshooting](#troubleshooting)
11. [Roadmap](#roadmap)

---

## 🎯 Übersicht

Diese Library bietet **11 production-ready CDK Constructs** für AWS-Infrastruktur mit folgenden Schwerpunkten:

- ✅ **Security First** – Verschlüsselung, Least-Privilege IAM, HTTPS-only
- ✅ **Kostenoptimiert** – Free Tier optimiert, kurze Log-Retention
- ✅ **100% Test Coverage** – Alle Constructs mit umfassenden Tests
- ✅ **Type-Safe** – Vollständige TypeScript-Unterstützung
- ✅ **Production-Ready** – Verwendet in echten AWS-Deployments

### Warum diese Library?

| Problem | Native CDK | Diese Library |
|---------|-----------|---------------|
| **Security Defaults** | Manuell konfigurieren | ✅ Automatisch sicher |
| **Kostenoptimierung** | Trial & Error | ✅ Free Tier optimiert |
| **Boilerplate Code** | 50-100 Zeilen | ✅ 5-10 Zeilen |
| **Test Coverage** | Selbst schreiben | ✅ 100% getestet |
| **Documentation** | AWS Docs durchsuchen | ✅ Deutsche Beispiele |

---

## 🚀 Features

### Security Best Practices

- **Verschlüsselung überall**: S3 (AES256), SQS/SNS (KMS), DynamoDB (encryption at rest)
- **IAM Least-Privilege**: Nur minimale Berechtigungen, keine `*` Permissions
- **HTTPS-Only**: CloudFront redirect-to-https, API Gateway mit TLS 1.2+
- **Block Public Access**: S3 Buckets standardmäßig privat
- **Rotation Enabled**: KMS Keys mit automatischer Rotation

### Kostenoptimierung

- **Free Tier First**: Alle Constructs für AWS Free Tier optimiert
- **Kurze Log Retention**: CloudWatch Logs 14 Tage (Standard: unbegrenzt)
- **Pay-per-Request**: DynamoDB On-Demand statt Provisioned
- **PriceClass 100**: CloudFront nur US/Canada/Europe (günstiger)
- **Smart Removal Policies**: dev=DESTROY, prod=RETAIN

### Developer Experience

- **Type-Safe**: Vollständige TypeScript-Unterstützung mit IntelliSense
- **Umfassende Validierung**: Klare Fehlermeldungen bei falscher Konfiguration
- **Konsistente API**: Alle Constructs folgen dem gleichen Pattern
- **Gut dokumentiert**: JSDoc für jede Property, deutsche Beispiele
- **TDD-Ready**: Test-Helpers und Assertions inkludiert

---

## ⚡ Schnellstart

### 1. Installation

```bash
cd 04-cdk-constructs
npm install
npm run build
```

### 2. In deinem CDK-Projekt verwenden

```typescript
// Imports
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {
  S3BucketSecure,
  CloudFrontDistributionSecure,
  LambdaFunctionSecure,
  DynamoDbTableStandard,
  ApiGatewayRestApiStandard,
  CognitoUserPoolStandard
} from '@vibtellect/aws-cdk-constructs';

export class MyStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Sicherer S3 Bucket
    const bucket = new S3BucketSecure(this, 'WebsiteBucket', {
      bucketName: 'my-website-bucket',
      versioned: true
    });

    // CloudFront Distribution
    const distribution = new CloudFrontDistributionSecure(this, 'CDN', {
      originBucket: bucket.bucket,
      comment: 'My website CDN'
    });

    // Outputs
    new cdk.CfnOutput(this, 'WebsiteURL', {
      value: distribution.distributionDomainName
    });
  }
}
```

### 3. Deploy

```bash
cdk deploy
```

Das war's! 🎉 Du hast jetzt einen sicheren S3 Bucket mit CloudFront CDN deployed.

---

## 📦 Installation & Setup

### Voraussetzungen

- **Node.js:** >= 18.0.0
- **npm:** >= 9.0.0
- **AWS CDK:** >= 2.120.0
- **TypeScript:** >= 5.4.0

### Lokale Entwicklung

```bash
# Repository klonen
git clone https://github.com/vibtellect/aws-portfolio-setup.git
cd aws-portfolio-setup/04-cdk-constructs

# Dependencies installieren
npm install

# TypeScript kompilieren
npm run build

# Tests ausführen
npm test

# TDD Watch Mode
npm run test:tdd

# Linting
npm run lint

# Code formatieren
npm run format
```

### Als npm Package verwenden (geplant)

```bash
npm install @vibtellect/aws-cdk-constructs
```

---

## 🏗️ Verfügbare Constructs

### ✅ Implementiert (11/13)

#### 1. Security (2 Constructs)

| Construct | Zweck | Highlights |
|-----------|-------|------------|
| **IamRoleLambdaBasic** | IAM-Rolle für Lambda | Least-Privilege, CloudWatch Logs, X-Ray optional |
| **KmsKeyManaged** | Customer Managed KMS Key | Auto-Rotation, Service-Access (Lambda/S3/SQS/SNS) |

#### 2. Observability (1 Construct)

| Construct | Zweck | Highlights |
|-----------|-------|------------|
| **LogGroupShortRetention** | CloudWatch Log Group | 14 Tage Retention, KMS-Verschlüsselung optional |

#### 3. Messaging (2 Constructs)

| Construct | Zweck | Highlights |
|-----------|-------|------------|
| **SqsQueueEncrypted** | Verschlüsselte SQS Queue | AWS managed KMS, DLQ optional |
| **SnsTopicEncrypted** | Verschlüsseltes SNS Topic | FIFO-Support, Subscription-Filter |

#### 4. Storage (1 Construct)

| Construct | Zweck | Highlights |
|-----------|-------|------------|
| **S3BucketSecure** | Sicherer S3 Bucket | Block Public Access, Versioning, SSE |

#### 5. Compute (1 Construct)

| Construct | Zweck | Highlights |
|-----------|-------|------------|
| **LambdaFunctionSecure** | Lambda Function | Cost-optimized, Auto-IAM, Multi-Runtime |

#### 6. Database (1 Construct)

| Construct | Zweck | Highlights |
|-----------|-------|------------|
| **DynamoDbTableStandard** | DynamoDB Tabelle | Pay-per-Request, Point-in-Time Recovery |

#### 7. Auth (1 Construct)

| Construct | Zweck | Highlights |
|-----------|-------|------------|
| **CognitoUserPoolStandard** | Cognito User Pool | MFA optional, Password Policy, Email Verification |

#### 8. API (1 Construct)

| Construct | Zweck | Highlights |
|-----------|-------|------------|
| **ApiGatewayRestApiStandard** | REST API Gateway | CloudWatch Logs, CORS konfigurierbar |

#### 9. CDN (1 Construct)

| Construct | Zweck | Highlights |
|-----------|-------|------------|
| **CloudFrontDistributionSecure** | CloudFront Distribution | OAI, HTTPS-only, TLS 1.2+, WAF-Integration |

### 🔄 Geplant (2/13)

#### Route53 Networking

- **Route53HostedZoneStandard** – DNS Hosted Zone Management
- **Route53RecordSetStandard** – DNS Records mit Failover/Weighted Routing

Siehe [INTEGRATION_PLAN.md](../INTEGRATION_PLAN.md) für Details.

---

## 💡 Nutzungsbeispiele

### Beispiel 1: Serverless Backend (Lambda + DynamoDB + API Gateway)

```typescript
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';
import {
  DynamoDbTableStandard,
  LambdaFunctionSecure,
  IamRoleLambdaBasic,
  ApiGatewayRestApiStandard,
  LogGroupShortRetention
} from '@vibtellect/aws-cdk-constructs';

export class ServerlessBackendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // 1. DynamoDB Tabelle
    const table = new DynamoDbTableStandard(this, 'DataTable', {
      tableName: 'my-app-data',
      partitionKey: {
        name: 'userId',
        type: dynamodb.AttributeType.STRING
      },
      sortKey: {
        name: 'itemId',
        type: dynamodb.AttributeType.STRING
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true
    });

    // 2. Lambda Execution Role
    const lambdaRole = new IamRoleLambdaBasic(this, 'LambdaRole', {
      roleName: 'my-app-lambda-role',
      description: 'Execution role for backend Lambda functions',
      enableXray: true
    });

    // 3. Lambda Function
    const handler = new LambdaFunctionSecure(this, 'ApiHandler', {
      functionName: 'my-app-api-handler',
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda'),
      role: lambdaRole.role,
      environment: {
        TABLE_NAME: table.table.tableName,
        REGION: this.region
      },
      timeout: cdk.Duration.seconds(30),
      memorySize: 512
    });

    // Grant DynamoDB permissions
    table.table.grantReadWriteData(handler.function);

    // 4. API Gateway
    const api = new ApiGatewayRestApiStandard(this, 'Api', {
      restApiName: 'my-app-api',
      description: 'Backend API for my application',
      deployOptions: {
        stageName: 'prod',
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        tracingEnabled: true
      }
    });

    // Add routes
    const items = api.restApi.root.addResource('items');
    items.addMethod('GET', new apigateway.LambdaIntegration(handler.function));
    items.addMethod('POST', new apigateway.LambdaIntegration(handler.function));

    // 5. Outputs
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.restApi.url,
      description: 'API Gateway URL'
    });
  }
}
```

### Beispiel 2: Static Website mit CloudFront

```typescript
import * as cdk from 'aws-cdk-lib';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import { Construct } from 'constructs';
import {
  S3BucketSecure,
  CloudFrontDistributionSecure
} from '@vibtellect/aws-cdk-constructs';

export class StaticWebsiteStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // 1. S3 Bucket für Website
    const websiteBucket = new S3BucketSecure(this, 'WebsiteBucket', {
      bucketName: 'my-website-static-files',
      versioned: true,
      lifecycleRules: [
        {
          noncurrentVersionExpiration: cdk.Duration.days(30)
        }
      ]
    });

    // 2. CloudFront Distribution
    const distribution = new CloudFrontDistributionSecure(this, 'CDN', {
      originBucket: websiteBucket.bucket,
      comment: 'Static website CDN',
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 404,
          responsePagePath: '/404.html',
          responseHttpStatus: 404,
          ttl: cdk.Duration.minutes(5)
        }
      ]
    });

    // 3. Deploy Website Files
    new s3deploy.BucketDeployment(this, 'DeployWebsite', {
      sources: [s3deploy.Source.asset('./website/build')],
      destinationBucket: websiteBucket.bucket,
      distribution: distribution.distribution,
      distributionPaths: ['/*']
    });

    // 4. Outputs
    new cdk.CfnOutput(this, 'WebsiteURL', {
      value: `https://${distribution.distributionDomainName}`,
      description: 'Website URL'
    });

    new cdk.CfnOutput(this, 'DistributionId', {
      value: distribution.distributionId,
      description: 'CloudFront Distribution ID'
    });
  }
}
```

### Beispiel 3: Authentifizierung mit Cognito

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {
  CognitoUserPoolStandard,
  ApiGatewayRestApiStandard
} from '@vibtellect/aws-cdk-constructs';

export class AuthStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // 1. Cognito User Pool
    const userPool = new CognitoUserPoolStandard(this, 'UserPool', {
      userPoolName: 'my-app-users',
      selfSignUpEnabled: true,
      passwordPolicy: {
        minLength: 12,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: true
      },
      signInAliases: {
        email: true,
        username: false
      },
      standardAttributes: {
        email: {
          required: true,
          mutable: false
        }
      },
      mfa: cognito.Mfa.OPTIONAL,
      mfaSecondFactor: {
        sms: true,
        otp: true
      }
    });

    // 2. User Pool Client
    const userPoolClient = userPool.userPool.addClient('WebClient', {
      authFlows: {
        userPassword: true,
        userSrp: true
      },
      oAuth: {
        flows: {
          authorizationCodeGrant: true
        },
        scopes: [
          cognito.OAuthScope.EMAIL,
          cognito.OAuthScope.OPENID,
          cognito.OAuthScope.PROFILE
        ]
      }
    });

    // 3. API Gateway mit Cognito Authorizer
    const api = new ApiGatewayRestApiStandard(this, 'Api', {
      restApiName: 'authenticated-api',
      description: 'API with Cognito authentication'
    });

    const auth = new apigateway.CognitoUserPoolsAuthorizer(this, 'Authorizer', {
      cognitoUserPools: [userPool.userPool]
    });

    // Protected endpoint
    const protected = api.restApi.root.addResource('protected');
    protected.addMethod('GET', new apigateway.MockIntegration(), {
      authorizer: auth,
      authorizationType: apigateway.AuthorizationType.COGNITO
    });

    // 4. Outputs
    new cdk.CfnOutput(this, 'UserPoolId', {
      value: userPool.userPoolId,
      description: 'Cognito User Pool ID'
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: userPoolClient.userPoolClientId,
      description: 'Cognito User Pool Client ID'
    });

    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.restApi.url,
      description: 'API Gateway URL'
    });
  }
}
```

### Beispiel 4: Messaging mit SQS + SNS

```typescript
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import { Construct } from 'constructs';
import {
  SqsQueueEncrypted,
  SnsTopicEncrypted,
  LambdaFunctionSecure,
  KmsKeyManaged
} from '@vibtellect/aws-cdk-constructs';

export class MessagingStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // 1. KMS Key für Verschlüsselung
    const encryptionKey = new KmsKeyManaged(this, 'MessagingKey', {
      description: 'Encryption key for messaging infrastructure',
      enableKeyRotation: true,
      enableSqsAccess: true,
      enableSnsAccess: true,
      enableLambdaAccess: true
    });

    // 2. SNS Topic
    const topic = new SnsTopicEncrypted(this, 'EventTopic', {
      topicName: 'app-events',
      displayName: 'Application Events',
      masterKey: encryptionKey.key
    });

    // 3. SQS Queue mit DLQ
    const queue = new SqsQueueEncrypted(this, 'ProcessingQueue', {
      queueName: 'event-processing-queue',
      kmsKey: encryptionKey.key,
      enableDeadLetterQueue: true,
      messageRetentionPeriod: cdk.Duration.days(7),
      visibilityTimeout: cdk.Duration.minutes(5)
    });

    // 4. SNS → SQS Subscription
    topic.topic.addSubscription(
      new snsSubscriptions.SqsSubscription(queue.queue, {
        rawMessageDelivery: false
      })
    );

    // 5. Lambda Consumer
    const consumer = new LambdaFunctionSecure(this, 'EventConsumer', {
      functionName: 'event-consumer',
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda'),
      timeout: cdk.Duration.minutes(5)
    });

    // Add SQS as event source
    consumer.function.addEventSource(
      new lambdaEventSources.SqsEventSource(queue.queue, {
        batchSize: 10,
        maxBatchingWindow: cdk.Duration.seconds(5)
      })
    );

    // Grant permissions
    queue.queue.grantConsumeMessages(consumer.function);

    // 6. Outputs
    new cdk.CfnOutput(this, 'TopicArn', {
      value: topic.topicArn,
      description: 'SNS Topic ARN'
    });

    new cdk.CfnOutput(this, 'QueueUrl', {
      value: queue.queueUrl,
      description: 'SQS Queue URL'
    });
  }
}
```

---

## ⚙️ Konfiguration

### Environment-Based Configuration

Die Library unterstützt automatische Konfiguration basierend auf Stack-Namen:

```typescript
// Development Stack
const devStack = new cdk.Stack(app, 'MyDevStack', {
  stackName: 'my-app-dev'  // enthält 'dev'
});

// Production Stack
const prodStack = new cdk.Stack(app, 'MyProdStack', {
  stackName: 'my-app-production'  // enthält 'production'
});
```

**Automatische Anpassungen:**

| Konfiguration | Development | Production |
|---------------|-------------|------------|
| **Removal Policy** | DESTROY | RETAIN |
| **Log Retention** | 7 Tage | 14 Tage |
| **Backups** | Optional | Enabled |
| **Multi-AZ** | Single-AZ | Multi-AZ (wo möglich) |

### Custom Removal Policies

```typescript
const bucket = new S3BucketSecure(this, 'Bucket', {
  bucketName: 'my-bucket',
  removalPolicy: cdk.RemovalPolicy.RETAIN  // Überschreibt Auto-Detect
});
```

### Tagging Strategy

Alle Constructs werden automatisch mit Tags versehen:

```typescript
{
  ManagedBy: 'CDK',
  Construct: 'S3BucketSecure',
  Environment: 'production',  // wenn im Stack-Namen
  Project: 'my-project'        // optional
}
```

Custom Tags hinzufügen:

```typescript
const bucket = new S3BucketSecure(this, 'Bucket', {
  bucketName: 'my-bucket',
  tags: {
    Team: 'Platform',
    CostCenter: 'Engineering'
  }
});
```

### Kostenoptimierung

**CloudWatch Logs:**
```typescript
const logGroup = new LogGroupShortRetention(this, 'Logs', {
  retentionDays: logs.RetentionDays.ONE_WEEK  // 7 Tage statt 14 Tage
});
```

**DynamoDB:**
```typescript
const table = new DynamoDbTableStandard(this, 'Table', {
  tableName: 'my-table',
  partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
  billingMode: dynamodb.BillingMode.PAY_PER_REQUEST  // Statt Provisioned
});
```

**CloudFront:**
```typescript
const distribution = new CloudFrontDistributionSecure(this, 'CDN', {
  originBucket: bucket.bucket,
  priceClass: cloudfront.PriceClass.PRICE_CLASS_100  // Nur US/EU/CA
});
```

---

## 🧪 Test-Driven Development

### Warum TDD?

Diese Library wurde vollständig mit TDD entwickelt:

1. ✅ **100% Code Coverage** garantiert
2. ✅ **Frühe Fehlerkennung** vor Deployment
3. ✅ **Besseres Design** durch Test-First
4. ✅ **Lebende Dokumentation** durch Tests
5. ✅ **Refactoring Safety** – Tests bleiben grün

### TDD Workflow

```
1. 🔴 RED   → Test schreiben (schlägt fehl)
2. 🟢 GREEN → Minimale Implementierung
3. 🔧 REFACTOR → Code verbessern
→ Repeat
```

### Tests ausführen

```bash
# Alle Tests mit Coverage
npm test

# TDD Watch Mode (empfohlen!)
npm run test:tdd

# Nur ein spezifischer Test
npm test -- s3-bucket-secure.test.ts

# CI/CD Mode
npm run test:ci
```

### Eigene Tests schreiben

```typescript
import { describe, test, beforeEach, expect } from '@jest/globals';
import { App, Stack } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { S3BucketSecure } from '../src/primitives/storage/s3-bucket-secure';

describe('S3BucketSecure', () => {
  let app: App;
  let stack: Stack;

  beforeEach(() => {
    app = new App();
    stack = new Stack(app, 'TestStack');
  });

  test('creates secure bucket', () => {
    new S3BucketSecure(stack, 'Bucket');

    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::S3::Bucket', {
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true
      }
    });
  });
});
```

Siehe [TDD_GUIDE.md](./TDD_GUIDE.md) für vollständigen Guide.

---

## 🎯 Best Practices

### 1. Stack Organization

```typescript
// ❌ Nicht: Alles in einem Stack
export class MonolithStack extends cdk.Stack {
  constructor(scope: Construct, id: string) {
    super(scope, id);
    // Database + API + Frontend + ... (zu viel!)
  }
}

// ✅ Besser: Separate Stacks
export class DatabaseStack extends cdk.Stack { /* ... */ }
export class ApiStack extends cdk.Stack { /* ... */ }
export class FrontendStack extends cdk.Stack { /* ... */ }
```

### 2. Cross-Stack References

```typescript
// Database Stack
export class DatabaseStack extends cdk.Stack {
  public readonly table: dynamodb.Table;

  constructor(scope: Construct, id: string) {
    super(scope, id);
    const tableConstruct = new DynamoDbTableStandard(this, 'Table', {
      tableName: 'shared-table',
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING }
    });
    this.table = tableConstruct.table;
  }
}

// API Stack
export class ApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: { table: dynamodb.Table }) {
    super(scope, id);
    // Use props.table
  }
}

// App
const dbStack = new DatabaseStack(app, 'Database');
const apiStack = new ApiStack(app, 'Api', {
  table: dbStack.table
});
```

### 3. Environment Variables

```typescript
// ❌ Nicht: Hardcoded
const handler = new LambdaFunctionSecure(this, 'Handler', {
  environment: {
    API_KEY: 'secret-key'  // NIEMALS!
  }
});

// ✅ Besser: Secrets Manager oder Parameter Store
const secret = secretsmanager.Secret.fromSecretNameV2(
  this,
  'ApiKey',
  'my-app/api-key'
);

const handler = new LambdaFunctionSecure(this, 'Handler', {
  environment: {
    SECRET_ARN: secret.secretArn
  }
});

secret.grantRead(handler.function);
```

### 4. Resource Naming

```typescript
// ❌ Nicht: Auto-generated Namen in Prod
const bucket = new S3BucketSecure(this, 'Bucket');

// ✅ Besser: Explizite Namen
const bucket = new S3BucketSecure(this, 'Bucket', {
  bucketName: `${props.appName}-${props.environment}-assets`
});
```

### 5. Error Handling

```typescript
try {
  const distribution = new CloudFrontDistributionSecure(this, 'CDN', {
    originBucket: bucket.bucket,
    certificate: certificate,
    domainNames: ['example.com']
  });
} catch (error) {
  // Library wirft klare Validation Errors
  console.error(error.message);
  // "When providing a certificate, domain names must be provided..."
}
```

---

## 🔧 Troubleshooting

### Häufige Probleme

#### Problem: "Template has X resources but none match"

**Ursache:** CDK Assertions Matcher falsch verwendet

**Lösung:**
```typescript
// ❌ Falsch
template.hasResourceProperties('AWS::S3::Bucket', {
  BucketName: 'exact-name'  // CDK generiert physische Namen
});

// ✅ Richtig
template.hasResourceProperties('AWS::S3::Bucket', {
  PublicAccessBlockConfiguration: Match.objectLike({ ... })
});
```

#### Problem: "Circular dependency between resources"

**Ursache:** Cross-Stack Referenzen falsch konfiguriert

**Lösung:**
```typescript
// Verwende explizite Dependencies
apiStack.addDependency(dbStack);
```

#### Problem: "Resource with id 'X' already exists"

**Ursache:** Doppelte Construct IDs

**Lösung:**
```typescript
// ❌ Falsch
new S3BucketSecure(this, 'Bucket');
new S3BucketSecure(this, 'Bucket');  // Fehler!

// ✅ Richtig
new S3BucketSecure(this, 'AssetsBucket');
new S3BucketSecure(this, 'DataBucket');
```

#### Problem: Tests schlagen fehl mit "Cannot find module"

**Ursache:** TypeScript nicht kompiliert

**Lösung:**
```bash
npm run build
npm test
```

### Debug Mode

```bash
# Verbose CDK Output
cdk synth --verbose

# Debug Tests
npm test -- --verbose

# Show CDK Diffs
cdk diff
```

### Support

Bei Problemen:
1. Siehe [INTEGRATION_PLAN.md](../INTEGRATION_PLAN.md)
2. Check [TDD_GUIDE.md](./TDD_GUIDE.md)
3. GitHub Issues: https://github.com/vibtellect/aws-portfolio-setup/issues

---

## 🗺️ Roadmap

### ✅ Fertig (11/13 Constructs)

- Security: IamRoleLambdaBasic, KmsKeyManaged
- Observability: LogGroupShortRetention
- Messaging: SqsQueueEncrypted, SnsTopicEncrypted
- Storage: S3BucketSecure
- Compute: LambdaFunctionSecure
- Database: DynamoDbTableStandard
- Auth: CognitoUserPoolStandard
- API: ApiGatewayRestApiStandard
- CDN: CloudFrontDistributionSecure

### 🔄 In Arbeit (2/13 Constructs)

**Route53 Networking:**
- Route53HostedZoneStandard (1-2 Tage)
- Route53RecordSetStandard (1-2 Tage)

**Benötigt für:** Project 03 (Multi-Region Failover)

### 📋 Geplant (Patterns)

**Higher-Level Patterns:**
- StaticWebsitePattern (S3 + CloudFront + Route53)
- ServerlessApiPattern (API Gateway + Lambda + DynamoDB)
- QueueWorkerPattern (SQS + Lambda + DLQ)
- MultiRegionPattern (Route53 + CloudFront + S3 Replication)

**Timeline:** Q1 2025

### 🚀 Future Features

- CLI Tool für Scaffolding
- Migration Guide von native CDK
- TypeDoc API Documentation
- Video Tutorials (Deutsch)
- Best Practice Templates
- Cost Calculator Integration

---

## 📄 Lizenz

MIT License - Siehe [LICENSE](../LICENSE)

## 🤝 Beitragen

Siehe [CONTRIBUTING.md](./CONTRIBUTING.md)

## 📧 Kontakt

- **Autor:** Vitalij
- **GitHub:** https://github.com/vibtellect/aws-portfolio-setup
- **Issues:** https://github.com/vibtellect/aws-portfolio-setup/issues

---

**Viel Erfolg mit deiner AWS-Infrastruktur! 🚀**
