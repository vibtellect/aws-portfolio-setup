# Konfigurationshandbuch – AWS CDK Constructs Library

> **Vollständiger Guide zur Konfiguration aller 11 Constructs**

---

## 📋 Inhaltsverzeichnis

1. [Grundlegende Konfiguration](#grundlegende-konfiguration)
2. [Security Constructs](#security-constructs)
3. [Storage & Database](#storage--database)
4. [Compute & API](#compute--api)
5. [Messaging](#messaging)
6. [CDN & Networking](#cdn--networking)
7. [Observability](#observability)
8. [Authentication](#authentication)
9. [Advanced Configuration](#advanced-configuration)
10. [Environment-Specific Config](#environment-specific-config)

---

## 🎯 Grundlegende Konfiguration

### Stack Setup

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class MyStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Deine Constructs hier...
  }
}

// App Definition
const app = new cdk.App();
new MyStack(app, 'MyStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'eu-central-1'  // Frankfurt
  },
  stackName: 'my-app-production',  // Wichtig für Auto-Detect!
  tags: {
    Environment: 'production',
    Project: 'my-app'
  }
});
```

---

## 🔐 Security Constructs

### 1. IamRoleLambdaBasic

**Zweck:** IAM-Rolle für Lambda Functions mit Least-Privilege

#### Minimale Konfiguration

```typescript
import { IamRoleLambdaBasic } from '@vibtellect/aws-cdk-constructs';

const role = new IamRoleLambdaBasic(this, 'LambdaRole', {});
```

**Erstellt automatisch:**
- CloudWatch Logs Permissions (CreateLogGroup, PutLogEvents)
- Lambda Execution Trust Policy

#### Vollständige Konfiguration

```typescript
import * as iam from 'aws-cdk-lib/aws-iam';

const role = new IamRoleLambdaBasic(this, 'LambdaRole', {
  // Name der Rolle
  roleName: 'my-app-lambda-execution-role',

  // Beschreibung
  description: 'Execution role for Lambda functions in my-app',

  // X-Ray Tracing aktivieren
  enableXray: true,  // Fügt X-Ray Permissions hinzu

  // Zusätzliche Policies
  extraPolicies: [
    new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['s3:GetObject', 's3:PutObject'],
      resources: ['arn:aws:s3:::my-bucket/*']
    }),
    new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['dynamodb:GetItem', 'dynamodb:PutItem'],
      resources: ['arn:aws:dynamodb:*:*:table/my-table']
    })
  ]  // Max. 10 Policies!
});

// Zugriff auf die Rolle
const iamRole = role.role;  // iam.Role
const roleArn = role.roleArn;  // string
const roleName = role.roleName;  // string
```

**Properties:**

| Property | Typ | Default | Beschreibung |
|----------|-----|---------|-------------|
| `roleName` | `string?` | Auto-generiert | Name der IAM-Rolle (max. 64 chars) |
| `description` | `string?` | - | Beschreibung der Rolle |
| `enableXray` | `boolean?` | `false` | X-Ray Tracing Permissions hinzufügen |
| `extraPolicies` | `PolicyStatement[]?` | `[]` | Zusätzliche Permissions (max. 10) |

**Validierung:**
- ❌ Wirft Fehler wenn `roleName` > 64 Zeichen
- ❌ Wirft Fehler wenn `roleName` ungültiges Pattern hat
- ❌ Wirft Fehler wenn mehr als 10 `extraPolicies`

---

### 2. KmsKeyManaged

**Zweck:** Customer Managed KMS Encryption Key

#### Minimale Konfiguration

```typescript
import { KmsKeyManaged } from '@vibtellect/aws-cdk-constructs';

const key = new KmsKeyManaged(this, 'EncryptionKey', {});
```

**Erstellt automatisch:**
- Key mit automatischer Rotation (enabled)
- Alias: `alias/EncryptionKey-<hash>`

#### Vollständige Konfiguration

```typescript
const key = new KmsKeyManaged(this, 'EncryptionKey', {
  // Beschreibung
  description: 'Encryption key for application data',

  // Alias (muss mit "alias/" starten, nicht "alias/aws/")
  alias: 'alias/my-app-encryption-key',

  // Automatische Key Rotation
  enableKeyRotation: true,  // Empfohlen!

  // Service Access Permissions
  enableLambdaAccess: true,  // Lambda kann Key verwenden
  enableSqsAccess: true,     // SQS kann Key verwenden
  enableSnsAccess: true,     // SNS kann Key verwenden
  enableS3Access: true,      // S3 kann Key verwenden

  // Removal Policy überschreiben
  removalPolicy: cdk.RemovalPolicy.RETAIN  // Wichtig für Prod!
});

// Zugriff
const kmsKey = key.key;      // kms.Key
const keyArn = key.keyArn;   // string
const keyId = key.keyId;     // string
```

**Properties:**

| Property | Typ | Default | Beschreibung |
|----------|-----|---------|-------------|
| `description` | `string?` | `'Managed KMS key...'` | Key Beschreibung (max. 8192 chars) |
| `alias` | `string?` | Auto-generiert | Key Alias (muss `alias/` prefix haben) |
| `enableKeyRotation` | `boolean?` | `true` | Automatische jährliche Rotation |
| `enableLambdaAccess` | `boolean?` | `false` | Lambda Service Permissions |
| `enableSqsAccess` | `boolean?` | `false` | SQS Service Permissions |
| `enableSnsAccess` | `boolean?` | `false` | SNS Service Permissions |
| `enableS3Access` | `boolean?` | `false` | S3 Service Permissions |
| `removalPolicy` | `RemovalPolicy?` | Auto-detect | dev=DESTROY, prod=RETAIN |

**Validierung:**
- ❌ Wirft Fehler wenn `description` > 8192 Zeichen
- ❌ Wirft Fehler wenn `alias` nicht mit `alias/` startet
- ❌ Wirft Fehler wenn `alias` mit `alias/aws/` startet (reserved)

**Best Practice:**
```typescript
// Ein Key für alle Services
const key = new KmsKeyManaged(this, 'MasterKey', {
  description: 'Master encryption key for all services',
  enableKeyRotation: true,
  enableLambdaAccess: true,
  enableSqsAccess: true,
  enableSnsAccess: true,
  enableS3Access: true
});
```

---

## 💾 Storage & Database

### 3. S3BucketSecure

**Zweck:** S3 Bucket mit Security Best Practices

#### Minimale Konfiguration

```typescript
import { S3BucketSecure } from '@vibtellect/aws-cdk-constructs';

const bucket = new S3BucketSecure(this, 'Bucket', {});
```

**Erstellt automatisch:**
- Block Public Access (alle Einstellungen auf `true`)
- Server-Side Encryption (AES256)
- Versioning enabled
- Removal Policy: Auto-detect (dev=DESTROY, prod=RETAIN)

#### Vollständige Konfiguration

```typescript
import * as s3 from 'aws-cdk-lib/aws-s3';

const bucket = new S3BucketSecure(this, 'Bucket', {
  // Bucket Name
  bucketName: 'my-app-assets-production',

  // Versioning
  versioned: true,  // Empfohlen!

  // Lifecycle Rules
  lifecycleRules: [
    {
      // Alte Versionen nach 30 Tagen löschen
      noncurrentVersionExpiration: cdk.Duration.days(30)
    },
    {
      // Incomplete Multipart Uploads nach 7 Tagen aufräumen
      abortIncompleteMultipartUploadAfter: cdk.Duration.days(7)
    },
    {
      // Objekte nach 90 Tagen zu Glacier verschieben
      transitions: [
        {
          storageClass: s3.StorageClass.GLACIER,
          transitionAfter: cdk.Duration.days(90)
        }
      ]
    }
  ],

  // CORS Configuration
  cors: [
    {
      allowedMethods: [
        s3.HttpMethods.GET,
        s3.HttpMethods.HEAD
      ],
      allowedOrigins: ['https://example.com'],
      allowedHeaders: ['*'],
      maxAge: 3000
    }
  ],

  // Website Hosting (für static sites)
  websiteIndexDocument: 'index.html',
  websiteErrorDocument: 'error.html',

  // Encryption
  encryption: s3.BucketEncryption.S3_MANAGED,  // oder KMS_MANAGED
  encryptionKey: kmsKey,  // Nur wenn KMS_MANAGED

  // Removal Policy
  removalPolicy: cdk.RemovalPolicy.RETAIN,
  autoDeleteObjects: false  // Nur dev!
});

// Zugriff
const s3Bucket = bucket.bucket;       // s3.Bucket
const bucketArn = bucket.bucketArn;   // string
const bucketName = bucket.bucketName; // string
```

**Properties:**

| Property | Typ | Default | Beschreibung |
|----------|-----|---------|-------------|
| `bucketName` | `string?` | Auto-generiert | Bucket Name (global unique!) |
| `versioned` | `boolean?` | `true` | Versioning aktivieren |
| `lifecycleRules` | `LifecycleRule[]?` | - | Lifecycle Management |
| `cors` | `CorsRule[]?` | - | CORS Konfiguration |
| `websiteIndexDocument` | `string?` | - | Static Website Index |
| `websiteErrorDocument` | `string?` | - | Static Website Error Page |
| `encryption` | `BucketEncryption?` | `S3_MANAGED` | Verschlüsselung |
| `encryptionKey` | `kms.IKey?` | - | KMS Key (wenn KMS_MANAGED) |
| `removalPolicy` | `RemovalPolicy?` | Auto-detect | Löschverhalten |
| `autoDeleteObjects` | `boolean?` | `false` | Auto-Delete bei Stack-Löschung |

---

### 4. DynamoDbTableStandard

**Zweck:** DynamoDB Tabelle mit Best Practices

#### Minimale Konfiguration

```typescript
import { DynamoDbTableStandard } from '@vibtellect/aws-cdk-constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

const table = new DynamoDbTableStandard(this, 'Table', {
  tableName: 'my-table',
  partitionKey: {
    name: 'id',
    type: dynamodb.AttributeType.STRING
  }
});
```

#### Vollständige Konfiguration

```typescript
const table = new DynamoDbTableStandard(this, 'Table', {
  // Table Name
  tableName: 'my-app-users-production',

  // Partition Key (Required)
  partitionKey: {
    name: 'userId',
    type: dynamodb.AttributeType.STRING
  },

  // Sort Key (Optional)
  sortKey: {
    name: 'timestamp',
    type: dynamodb.AttributeType.NUMBER
  },

  // Billing Mode
  billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,  // Empfohlen!
  // oder
  billingMode: dynamodb.BillingMode.PROVISIONED,
  readCapacity: 5,
  writeCapacity: 5,

  // Encryption
  encryption: dynamodb.TableEncryption.AWS_MANAGED,  // oder CUSTOMER_MANAGED
  encryptionKey: kmsKey,  // Nur wenn CUSTOMER_MANAGED

  // Point-in-Time Recovery
  pointInTimeRecovery: true,  // Empfohlen für Prod!

  // Time to Live
  timeToLiveAttribute: 'expiresAt',  // TTL Spalte

  // Global Secondary Indexes
  globalSecondaryIndexes: [
    {
      indexName: 'EmailIndex',
      partitionKey: {
        name: 'email',
        type: dynamodb.AttributeType.STRING
      },
      projectionType: dynamodb.ProjectionType.ALL
    }
  ],

  // Local Secondary Indexes
  localSecondaryIndexes: [
    {
      indexName: 'StatusIndex',
      sortKey: {
        name: 'status',
        type: dynamodb.AttributeType.STRING
      },
      projectionType: dynamodb.ProjectionType.ALL
    }
  ],

  // Stream
  stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,

  // Removal Policy
  removalPolicy: cdk.RemovalPolicy.RETAIN
});

// Zugriff
const dynamoTable = table.table;        // dynamodb.Table
const tableArn = table.tableArn;        // string
const tableName = table.tableName;      // string
const tableStreamArn = table.tableStreamArn;  // string?
```

**Properties:**

| Property | Typ | Default | Beschreibung |
|----------|-----|---------|-------------|
| `tableName` | `string` | **Required** | Table Name |
| `partitionKey` | `Attribute` | **Required** | Partition Key |
| `sortKey` | `Attribute?` | - | Sort Key (optional) |
| `billingMode` | `BillingMode?` | `PAY_PER_REQUEST` | Billing Modus |
| `readCapacity` | `number?` | - | RCUs (nur Provisioned) |
| `writeCapacity` | `number?` | - | WCUs (nur Provisioned) |
| `encryption` | `TableEncryption?` | `AWS_MANAGED` | Verschlüsselung |
| `encryptionKey` | `kms.IKey?` | - | KMS Key (wenn CUSTOMER_MANAGED) |
| `pointInTimeRecovery` | `boolean?` | `false` | Backup aktivieren |
| `timeToLiveAttribute` | `string?` | - | TTL Spaltenname |
| `globalSecondaryIndexes` | `GSI[]?` | - | GSIs |
| `localSecondaryIndexes` | `LSI[]?` | - | LSIs |
| `stream` | `StreamViewType?` | - | DynamoDB Streams |

**Cost Optimization:**
```typescript
// Development
const table = new DynamoDbTableStandard(this, 'DevTable', {
  tableName: 'my-table-dev',
  partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
  billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,  // Keine Base-Kosten
  pointInTimeRecovery: false  // Kein Backup in Dev
});

// Production
const table = new DynamoDbTableStandard(this, 'ProdTable', {
  tableName: 'my-table-prod',
  partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
  billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
  pointInTimeRecovery: true,  // Backup in Prod!
  encryption: dynamodb.TableEncryption.CUSTOMER_MANAGED,
  encryptionKey: kmsKey
});
```

---

## ⚡ Compute & API

### 5. LambdaFunctionSecure

**Zweck:** Lambda Function mit Cost Optimization

#### Minimale Konfiguration

```typescript
import { LambdaFunctionSecure } from '@vibtellect/aws-cdk-constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';

const fn = new LambdaFunctionSecure(this, 'Function', {
  functionName: 'my-function',
  runtime: lambda.Runtime.PYTHON_3_11,
  handler: 'index.handler',
  code: lambda.Code.fromAsset('lambda')
});
```

#### Vollständige Konfiguration

```typescript
const fn = new LambdaFunctionSecure(this, 'Function', {
  // Function Name
  functionName: 'my-app-api-handler',

  // Runtime
  runtime: lambda.Runtime.PYTHON_3_11,
  // Optionen: NODEJS_20_X, PYTHON_3_11, GO_1_X, etc.

  // Handler
  handler: 'index.handler',  // Datei.Funktion

  // Code Source
  code: lambda.Code.fromAsset('lambda'),
  // oder
  code: lambda.Code.fromAsset('lambda.zip'),
  // oder
  code: lambda.Code.fromInline('def handler(event, context): return "Hello"'),

  // Execution Role
  role: lambdaRole.role,  // IamRoleLambdaBasic

  // Environment Variables
  environment: {
    TABLE_NAME: table.tableName,
    API_URL: 'https://api.example.com',
    LOG_LEVEL: 'INFO'
  },

  // Timeout
  timeout: cdk.Duration.seconds(30),  // Default: 3 Sekunden

  // Memory
  memorySize: 512,  // MB, Default: 128

  // Reserved Concurrent Executions
  reservedConcurrentExecutions: 10,  // Limit setzen

  // VPC Configuration
  vpc: myVpc,
  vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
  securityGroups: [sg],

  // Layers
  layers: [
    lambda.LayerVersion.fromLayerVersionArn(
      this,
      'Layer',
      'arn:aws:lambda:...'
    )
  ],

  // Tracing
  tracing: lambda.Tracing.ACTIVE,  // X-Ray

  // Description
  description: 'API handler for my application',

  // Dead Letter Queue
  deadLetterQueue: dlqQueue.queue,
  deadLetterQueueEnabled: true,

  // Retry Attempts
  retryAttempts: 2
});

// Zugriff
const lambdaFn = fn.function;           // lambda.Function
const functionArn = fn.functionArn;     // string
const functionName = fn.functionName;   // string
```

**Properties:**

| Property | Typ | Default | Beschreibung |
|----------|-----|---------|-------------|
| `functionName` | `string` | **Required** | Function Name |
| `runtime` | `Runtime` | **Required** | Runtime Environment |
| `handler` | `string` | **Required** | Handler Path |
| `code` | `Code` | **Required** | Code Source |
| `role` | `iam.IRole?` | Auto-created | Execution Role |
| `environment` | `Record<string,string>?` | `{}` | Env Variables |
| `timeout` | `Duration?` | `3 seconds` | Timeout |
| `memorySize` | `number?` | `128` | Memory in MB |
| `reservedConcurrentExecutions` | `number?` | - | Concurrency Limit |
| `vpc` | `ec2.IVpc?` | - | VPC |
| `vpcSubnets` | `SubnetSelection?` | - | Subnets |
| `securityGroups` | `ISecurityGroup[]?` | - | Security Groups |
| `layers` | `ILayerVersion[]?` | - | Lambda Layers |
| `tracing` | `Tracing?` | `DISABLED` | X-Ray Tracing |

**Cost Optimization:**
```typescript
// Cold Start optimiert
const fn = new LambdaFunctionSecure(this, 'Function', {
  functionName: 'my-function',
  runtime: lambda.Runtime.PYTHON_3_11,  // Schneller als Node.js
  handler: 'index.handler',
  code: lambda.Code.fromAsset('lambda'),
  memorySize: 512,  // 512MB = Sweet Spot für Performance/Cost
  timeout: cdk.Duration.seconds(10),  // Kurz halten
  reservedConcurrentExecutions: 5  // Kosten begrenzen
});
```

---

### 6. ApiGatewayRestApiStandard

**Zweck:** REST API Gateway mit Logging

#### Minimale Konfiguration

```typescript
import { ApiGatewayRestApiStandard } from '@vibtellect/aws-cdk-constructs';

const api = new ApiGatewayRestApiStandard(this, 'Api', {
  restApiName: 'my-api'
});
```

#### Vollständige Konfiguration

```typescript
import * as apigateway from 'aws-cdk-lib/aws-apigateway';

const api = new ApiGatewayRestApiStandard(this, 'Api', {
  // API Name
  restApiName: 'my-app-api',

  // Description
  description: 'REST API for my application',

  // Deploy Options
  deployOptions: {
    stageName: 'prod',
    loggingLevel: apigateway.MethodLoggingLevel.INFO,
    dataTraceEnabled: true,
    tracingEnabled: true,  // X-Ray
    metricsEnabled: true,
    throttlingBurstLimit: 100,
    throttlingRateLimit: 50
  },

  // CORS
  defaultCorsPreflightOptions: {
    allowOrigins: ['https://example.com'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowHeaders: ['Content-Type', 'Authorization'],
    allowCredentials: true,
    maxAge: cdk.Duration.hours(1)
  },

  // Binary Media Types
  binaryMediaTypes: ['image/*', 'application/pdf'],

  // Endpoint Type
  endpointTypes: [apigateway.EndpointType.REGIONAL],

  // API Key
  apiKeySourceType: apigateway.ApiKeySourceType.HEADER,

  // Minimum Compression Size
  minCompressionSize: cdk.Size.kibibytes(1),

  // Policy
  policy: new iam.PolicyDocument({
    statements: [
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        principals: [new iam.AnyPrincipal()],
        actions: ['execute-api:Invoke'],
        resources: ['execute-api:/*']
      })
    ]
  })
});

// Routes hinzufügen
const items = api.restApi.root.addResource('items');
items.addMethod('GET', new apigateway.LambdaIntegration(getFn.function));
items.addMethod('POST', new apigateway.LambdaIntegration(createFn.function));

const item = items.addResource('{id}');
item.addMethod('GET', new apigateway.LambdaIntegration(getByIdFn.function));
item.addMethod('PUT', new apigateway.LambdaIntegration(updateFn.function));
item.addMethod('DELETE', new apigateway.LambdaIntegration(deleteFn.function));

// Zugriff
const restApi = api.restApi;          // apigateway.RestApi
const apiId = api.apiId;              // string
const apiUrl = api.apiUrl;            // string
```

---

## 📨 Messaging Constructs

### 7. SqsQueueEncrypted

**Minimal:**
```typescript
import { SqsQueueEncrypted } from '@vibtellect/aws-cdk-constructs';

const queue = new SqsQueueEncrypted(this, 'MyQueue', {
  queueName: 'my-app-queue'
});

// Zugriff
const sqsQueue = queue.queue;         // sqs.Queue
const queueUrl = queue.queueUrl;      // string
const queueArn = queue.queueArn;      // string
```

**Vollständig:**
```typescript
import * as cdk from 'aws-cdk-lib';
import { KmsKeyManaged, SqsQueueEncrypted } from '@vibtellect/aws-cdk-constructs';

// Optional: Eigener KMS Key
const kmsKey = new KmsKeyManaged(this, 'QueueKey', {
  keyAlias: 'my-app-queue-key',
  enableKeyRotation: true
});

const queue = new SqsQueueEncrypted(this, 'MyQueue', {
  queueName: 'my-app-queue',

  // Nachrichten-Konfiguration
  visibilityTimeout: cdk.Duration.seconds(300),
  receiveMessageWaitTime: cdk.Duration.seconds(20),  // Long polling
  retentionPeriod: cdk.Duration.days(14),

  // Dead Letter Queue
  enableDeadLetterQueue: true,
  maxReceiveCount: 3,
  deadLetterQueueRetention: cdk.Duration.days(14),

  // Verschlüsselung
  encryptionKey: kmsKey.key,  // Optional (Standard: AWS managed key)

  // FIFO Queue
  fifo: false,

  // Removal Policy
  removalPolicy: cdk.RemovalPolicy.RETAIN,

  // Tags
  tags: {
    Environment: 'production',
    Application: 'my-app'
  }
});

// Dead Letter Queue zugreifen (falls aktiviert)
if (queue.deadLetterQueue) {
  const dlqUrl = queue.deadLetterQueue.queueUrl;
}
```

**Eigenschaften:**
| Property | Typ | Default | Beschreibung |
|----------|-----|---------|--------------|
| `queueName` | string | required | Name der Queue |
| `visibilityTimeout` | Duration | 30s | Sichtbarkeits-Timeout |
| `receiveMessageWaitTime` | Duration | 0s | Long polling Zeit |
| `retentionPeriod` | Duration | 14 Tage | Nachrichten-Aufbewahrung |
| `enableDeadLetterQueue` | boolean | false | DLQ aktivieren |
| `maxReceiveCount` | number | 3 | Max. Empfangsversuche |
| `fifo` | boolean | false | FIFO Queue |
| `encryptionKey` | IKey | undefined | KMS Key (optional) |

---

### 8. SnsTopicEncrypted

**Minimal:**
```typescript
import { SnsTopicEncrypted } from '@vibtellect/aws-cdk-constructs';

const topic = new SnsTopicEncrypted(this, 'MyTopic', {
  topicName: 'my-app-notifications'
});

// Subscription hinzufügen
topic.topic.addSubscription(new subscriptions.EmailSubscription('team@example.com'));
```

**Vollständig:**
```typescript
import * as cdk from 'aws-cdk-lib';
import * as sns_subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import { KmsKeyManaged, SnsTopicEncrypted, SqsQueueEncrypted } from '@vibtellect/aws-cdk-constructs';

// KMS Key für Verschlüsselung
const kmsKey = new KmsKeyManaged(this, 'TopicKey', {
  keyAlias: 'my-app-topic-key',
  enableSnsAccess: true
});

const topic = new SnsTopicEncrypted(this, 'MyTopic', {
  topicName: 'my-app-notifications',
  displayName: 'My App Notifications',

  // FIFO Topic
  fifo: false,

  // Verschlüsselung
  encryptionKey: kmsKey.key,

  // Delivery Policy
  deliveryRetryAttempts: 5,

  // Tags
  tags: {
    Environment: 'production',
    CostCenter: 'engineering'
  }
});

// Email Subscription
topic.topic.addSubscription(
  new sns_subscriptions.EmailSubscription('alerts@example.com')
);

// SQS Subscription
const queue = new SqsQueueEncrypted(this, 'Queue', {
  queueName: 'notifications-queue'
});
topic.topic.addSubscription(
  new sns_subscriptions.SqsSubscription(queue.queue)
);

// Lambda Subscription
topic.topic.addSubscription(
  new sns_subscriptions.LambdaSubscription(myFunction)
);
```

**Eigenschaften:**
| Property | Typ | Default | Beschreibung |
|----------|-----|---------|--------------|
| `topicName` | string | required | Topic Name |
| `displayName` | string | undefined | Anzeigename |
| `fifo` | boolean | false | FIFO Topic |
| `encryptionKey` | IKey | undefined | KMS Key (optional) |
| `deliveryRetryAttempts` | number | 3 | Wiederholungsversuche |

---

## 🌐 CDN & Networking

### 9. CloudFrontDistributionSecure

**Minimal:**
```typescript
import { S3BucketSecure, CloudFrontDistributionSecure } from '@vibtellect/aws-cdk-constructs';

const bucket = new S3BucketSecure(this, 'WebsiteBucket', {
  bucketName: 'my-website-content'
});

const distribution = new CloudFrontDistributionSecure(this, 'CDN', {
  originBucket: bucket.bucket,
  comment: 'My website CDN'
});

// Zugriff
const distId = distribution.distributionId;           // string
const domainName = distribution.distributionDomainName;  // string (xxx.cloudfront.net)
```

**Vollständig:**
```typescript
import * as cdk from 'aws-cdk-lib';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import {
  S3BucketSecure,
  CloudFrontDistributionSecure
} from '@vibtellect/aws-cdk-constructs';

const bucket = new S3BucketSecure(this, 'WebsiteBucket', {
  bucketName: 'my-website-content',
  versioned: true
});

const distribution = new CloudFrontDistributionSecure(this, 'CDN', {
  originBucket: bucket.bucket,
  comment: 'Production website CDN',

  // Default Behavior
  defaultBehavior: {
    viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
    allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
    cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
    compress: true,
    cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED
  },

  // Geo Restrictions
  geoRestriction: cloudfront.GeoRestriction.allowlist('DE', 'AT', 'CH'),

  // Custom Domain (benötigt ACM Zertifikat in us-east-1)
  certificate: myCertificate,
  domainNames: ['www.example.com'],

  // Error Responses
  errorResponses: [
    {
      httpStatus: 404,
      responseHttpStatus: 200,
      responsePagePath: '/index.html',  // SPA fallback
      ttl: cdk.Duration.seconds(300)
    }
  ],

  // Logging
  enableLogging: true,
  logBucket: logBucket.bucket,
  logFilePrefix: 'cloudfront/',

  // Price Class
  priceClass: cloudfront.PriceClass.PRICE_CLASS_100,  // Nur USA, Europa

  // WAF Web ACL
  webAclId: myWebAcl.attrArn,

  // Tags
  tags: {
    Environment: 'production'
  }
});

// Output
new cdk.CfnOutput(this, 'DistributionURL', {
  value: `https://${distribution.distributionDomainName}`,
  description: 'CloudFront Distribution URL'
});
```

**Eigenschaften:**
| Property | Typ | Default | Beschreibung |
|----------|-----|---------|--------------|
| `originBucket` | IBucket | required | S3 Origin Bucket |
| `comment` | string | undefined | Beschreibung |
| `defaultBehavior` | BehaviorOptions | HTTPS-only | Caching-Verhalten |
| `geoRestriction` | GeoRestriction | undefined | Geo-Einschränkungen |
| `certificate` | ICertificate | undefined | ACM Zertifikat |
| `domainNames` | string[] | undefined | Custom Domains |
| `enableLogging` | boolean | false | Access Logs |
| `webAclId` | string | undefined | WAF Web ACL ID |

---

### 10. Route53HostedZoneStandard

**Minimal - Public Zone:**
```typescript
import { Route53HostedZoneStandard } from '@vibtellect/aws-cdk-constructs';

const zone = new Route53HostedZoneStandard(this, 'Zone', {
  zoneName: 'example.com'
});

// Zugriff
const hostedZone = zone.hostedZone;        // IHostedZone
const zoneId = zone.hostedZoneId;          // string
const nameServers = zone.hostedZoneNameServers;  // string[]
```

**Private Zone mit VPC:**
```typescript
import * as ec2 from 'aws-cdk-lib/aws-ec2';

const vpc = new ec2.Vpc(this, 'VPC');

const privateZone = new Route53HostedZoneStandard(this, 'PrivateZone', {
  zoneName: 'internal.example.com',
  comment: 'Internal DNS zone',

  // VPC Association für Private Zone
  vpcs: [
    {
      vpcId: vpc.vpcId,
      region: 'eu-central-1'
    }
  ],

  // Tags
  tags: {
    Environment: 'production',
    Type: 'private'
  }
});
```

**Multi-VPC Private Zone:**
```typescript
const multiVpcZone = new Route53HostedZoneStandard(this, 'MultiVpcZone', {
  zoneName: 'shared.internal',
  comment: 'Shared DNS across VPCs',

  vpcs: [
    { vpcId: vpc1.vpcId, region: 'eu-central-1' },
    { vpcId: vpc2.vpcId, region: 'us-east-1' },
    { vpcId: vpc3.vpcId, region: 'ap-southeast-1' }
  ]
});
```

**Eigenschaften:**
| Property | Typ | Default | Beschreibung |
|----------|-----|---------|--------------|
| `zoneName` | string | required | Domain Name |
| `comment` | string | undefined | Beschreibung |
| `vpcs` | VpcConfig[] | undefined | VPCs (für Private Zone) |
| `tags` | Record | undefined | Tags |

---

### 11. Route53RecordSetStandard

**Simple A Record:**
```typescript
import * as route53 from 'aws-cdk-lib/aws-route53';
import { Route53RecordSetStandard } from '@vibtellect/aws-cdk-constructs';

const record = new Route53RecordSetStandard(this, 'ARecord', {
  hostedZone: zone.hostedZone,
  recordName: 'www.example.com',
  recordType: route53.RecordType.A,
  target: route53.RecordTarget.fromIpAddresses('192.0.2.1', '192.0.2.2')
});
```

**CloudFront Alias:**
```typescript
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';

const alias = new Route53RecordSetStandard(this, 'CloudFrontAlias', {
  hostedZone: zone.hostedZone,
  recordName: 'www.example.com',
  recordType: route53.RecordType.A,
  target: route53.RecordTarget.fromAlias(
    new targets.CloudFrontTarget(distribution.distribution)
  )
});
```

**Weighted Routing (Load Distribution):**
```typescript
// 70% Traffic zu Server 1
const weighted1 = new Route53RecordSetStandard(this, 'Weighted1', {
  hostedZone: zone.hostedZone,
  recordName: 'api.example.com',
  recordType: route53.RecordType.A,
  target: route53.RecordTarget.fromIpAddresses('192.0.2.1'),
  weight: 70,
  setIdentifier: 'server-1'
});

// 30% Traffic zu Server 2
const weighted2 = new Route53RecordSetStandard(this, 'Weighted2', {
  hostedZone: zone.hostedZone,
  recordName: 'api.example.com',
  recordType: route53.RecordType.A,
  target: route53.RecordTarget.fromIpAddresses('192.0.2.2'),
  weight: 30,
  setIdentifier: 'server-2'
});
```

**Failover Routing (High Availability):**
```typescript
// Primary Server
const primary = new Route53RecordSetStandard(this, 'Primary', {
  hostedZone: zone.hostedZone,
  recordName: 'app.example.com',
  recordType: route53.RecordType.A,
  target: route53.RecordTarget.fromIpAddresses('192.0.2.1'),
  failover: 'PRIMARY',
  setIdentifier: 'primary-server'
});

// Secondary/Backup Server
const secondary = new Route53RecordSetStandard(this, 'Secondary', {
  hostedZone: zone.hostedZone,
  recordName: 'app.example.com',
  recordType: route53.RecordType.A,
  target: route53.RecordTarget.fromIpAddresses('192.0.2.2'),
  failover: 'SECONDARY',
  setIdentifier: 'backup-server'
});
```

**Geolocation Routing:**
```typescript
// Europa
const europeRecord = new Route53RecordSetStandard(this, 'EuropeRecord', {
  hostedZone: zone.hostedZone,
  recordName: 'cdn.example.com',
  recordType: route53.RecordType.A,
  target: route53.RecordTarget.fromIpAddresses('192.0.2.10'),
  geoLocation: {
    continentCode: 'EU'
  },
  setIdentifier: 'europe-server'
});

// USA
const usRecord = new Route53RecordSetStandard(this, 'USRecord', {
  hostedZone: zone.hostedZone,
  recordName: 'cdn.example.com',
  recordType: route53.RecordType.A,
  target: route53.RecordTarget.fromIpAddresses('192.0.2.20'),
  geoLocation: {
    countryCode: 'US'
  },
  setIdentifier: 'us-server'
});
```

**Latency-based Routing:**
```typescript
// EU Server
const euServer = new Route53RecordSetStandard(this, 'EUServer', {
  hostedZone: zone.hostedZone,
  recordName: 'api.example.com',
  recordType: route53.RecordType.A,
  target: route53.RecordTarget.fromIpAddresses('192.0.2.100'),
  region: 'eu-central-1',
  setIdentifier: 'eu-server'
});

// US Server
const usServer = new Route53RecordSetStandard(this, 'USServer', {
  hostedZone: zone.hostedZone,
  recordName: 'api.example.com',
  recordType: route53.RecordType.A,
  target: route53.RecordTarget.fromIpAddresses('192.0.2.200'),
  region: 'us-east-1',
  setIdentifier: 'us-server'
});
```

**Eigenschaften:**
| Property | Typ | Default | Beschreibung |
|----------|-----|---------|--------------|
| `hostedZone` | IHostedZone | required | Hosted Zone |
| `recordName` | string | required | Record Name |
| `recordType` | RecordType | required | Record Typ (A, AAAA, CNAME, etc.) |
| `target` | RecordTarget | required | Target (IP, Alias, etc.) |
| `ttl` | Duration | 300s | Time To Live |
| `weight` | number | undefined | Gewichtung (0-255) |
| `failover` | string | undefined | PRIMARY oder SECONDARY |
| `geoLocation` | GeoLocation | undefined | Geo-Routing |
| `region` | string | undefined | Latency-Routing Region |
| `setIdentifier` | string | undefined | Routing Policy ID (required für routing policies) |

---

## 🔐 Authentication

### 12. CognitoUserPoolStandard

**Minimal:**
```typescript
import { CognitoUserPoolStandard } from '@vibtellect/aws-cdk-constructs';

const userPool = new CognitoUserPoolStandard(this, 'UserPool', {
  userPoolName: 'my-app-users'
});

// User Pool Client erstellen
const client = userPool.userPool.addClient('WebClient', {
  authFlows: {
    userPassword: true,
    userSrp: true
  }
});
```

**Vollständig:**
```typescript
import * as cdk from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';

const userPool = new CognitoUserPoolStandard(this, 'UserPool', {
  userPoolName: 'my-app-users',

  // Email Configuration
  emailFromAddress: 'noreply@example.com',
  emailFromName: 'My App',

  // Password Policy
  passwordMinLength: 12,
  requireLowercase: true,
  requireUppercase: true,
  requireDigits: true,
  requireSymbols: true,

  // MFA
  mfaType: 'OPTIONAL',  // 'OFF', 'OPTIONAL', 'REQUIRED'
  enableSmsRole: true,

  // Self-Service
  selfSignUpEnabled: true,
  emailVerificationRequired: true,

  // Account Recovery
  accountRecoveryMethods: ['email', 'phone'],

  // Lambda Triggers
  preSignUp: preSignUpFunction.function,
  postConfirmation: postConfirmationFunction.function,
  preAuthentication: preAuthFunction.function,

  // Removal Policy
  removalPolicy: cdk.RemovalPolicy.RETAIN,

  // Tags
  tags: {
    Environment: 'production',
    Application: 'my-app'
  }
});

// App Client mit detaillierten Settings
const webClient = userPool.userPool.addClient('WebClient', {
  userPoolClientName: 'web-app-client',
  authFlows: {
    userPassword: true,
    userSrp: true,
    custom: true
  },
  oAuth: {
    flows: {
      authorizationCodeGrant: true
    },
    scopes: [
      cognito.OAuthScope.OPENID,
      cognito.OAuthScope.EMAIL,
      cognito.OAuthScope.PROFILE
    ],
    callbackUrls: ['https://example.com/callback'],
    logoutUrls: ['https://example.com/logout']
  },
  refreshTokenValidity: cdk.Duration.days(30),
  accessTokenValidity: cdk.Duration.hours(1),
  idTokenValidity: cdk.Duration.hours(1)
});

// Domain für Hosted UI
const domain = userPool.userPool.addDomain('Domain', {
  cognitoDomain: {
    domainPrefix: 'my-app-auth'
  }
});

// Identity Pool (für AWS Credentials)
const identityPool = new cognito.CfnIdentityPool(this, 'IdentityPool', {
  allowUnauthenticatedIdentities: false,
  cognitoIdentityProviders: [{
    clientId: webClient.userPoolClientId,
    providerName: userPool.userPool.userPoolProviderName
  }]
});
```

**Eigenschaften:**
| Property | Typ | Default | Beschreibung |
|----------|-----|---------|--------------|
| `userPoolName` | string | required | User Pool Name |
| `emailFromAddress` | string | undefined | Email Absender |
| `passwordMinLength` | number | 8 | Min. Passwort-Länge |
| `mfaType` | string | 'OFF' | MFA Einstellung |
| `selfSignUpEnabled` | boolean | false | Self-Service Registrierung |
| `preSignUp` | IFunction | undefined | Pre-SignUp Lambda Trigger |

---

## 📊 Observability

### 13. LogGroupShortRetention

**Minimal:**
```typescript
import { LogGroupShortRetention } from '@vibtellect/aws-cdk-constructs';

const logGroup = new LogGroupShortRetention(this, 'AppLogs', {
  logGroupName: '/aws/app/my-service'
});

// Lambda mit Log Group verbinden
const fn = new lambda.Function(this, 'Fn', {
  runtime: lambda.Runtime.NODEJS_18_X,
  handler: 'index.handler',
  code: lambda.Code.fromAsset('lambda'),
  logGroup: logGroup.logGroup
});
```

**Vollständig:**
```typescript
import * as cdk from 'aws-cdk-lib';
import * as logs from 'aws-cdk-lib/aws-logs';
import { KmsKeyManaged, LogGroupShortRetention } from '@vibtellect/aws-cdk-constructs';

// KMS Key für Verschlüsselung
const kmsKey = new KmsKeyManaged(this, 'LogsKey', {
  keyAlias: 'logs-encryption-key',
  enableLogsAccess: true
});

const logGroup = new LogGroupShortRetention(this, 'AppLogs', {
  logGroupName: '/aws/app/my-service',

  // Retention (cost-optimized default: 2 weeks)
  retentionDays: logs.RetentionDays.TWO_WEEKS,

  // Verschlüsselung
  encryptionKey: kmsKey.key,

  // Removal Policy
  removalPolicy: cdk.RemovalPolicy.DESTROY,  // Für Dev

  // Tags
  tags: {
    Environment: 'production',
    CostCenter: 'engineering'
  }
});

// Metric Filter erstellen
const errorMetric = logGroup.logGroup.addMetricFilter('ErrorMetric', {
  filterPattern: logs.FilterPattern.literal('[level=ERROR]'),
  metricNamespace: 'MyApp',
  metricName: 'ErrorCount',
  metricValue: '1',
  defaultValue: 0
});

// Subscription Filter (z.B. zu Kinesis/Lambda)
logGroup.logGroup.addSubscriptionFilter('Subscription', {
  destination: new logs_destinations.LambdaDestination(processorFunction),
  filterPattern: logs.FilterPattern.allEvents()
});

// Zugriff
const logGroupName = logGroup.logGroupName;  // string
const logGroupArn = logGroup.logGroupArn;    // string
```

**Eigenschaften:**
| Property | Typ | Default | Beschreibung |
|----------|-----|---------|--------------|
| `logGroupName` | string | required | Log Group Name |
| `retentionDays` | RetentionDays | TWO_WEEKS | Aufbewahrungsdauer |
| `encryptionKey` | IKey | undefined | KMS Key (optional) |
| `removalPolicy` | RemovalPolicy | DESTROY (dev) / RETAIN (prod) | Lösch-Policy |

---

## 🎯 Vollständiges Beispiel: Serverless API

```typescript
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import {
  KmsKeyManaged,
  LogGroupShortRetention,
  IamRoleLambdaBasic,
  LambdaFunctionSecure,
  DynamoDbTableStandard,
  ApiGatewayRestApiStandard,
  CloudFrontDistributionSecure,
  Route53HostedZoneStandard,
  Route53RecordSetStandard
} from '@vibtellect/aws-cdk-constructs';

export class ServerlessApiStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // 1. KMS Key für Verschlüsselung
    const kmsKey = new KmsKeyManaged(this, 'AppKey', {
      keyAlias: 'my-app-key',
      enableKeyRotation: true,
      enableDynamoDbAccess: true,
      enableLogsAccess: true
    });

    // 2. DynamoDB Tabelle
    const table = new DynamoDbTableStandard(this, 'Table', {
      tableName: 'my-app-data',
      partitionKey: { name: 'pk', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'sk', type: dynamodb.AttributeType.STRING },
      encryptionKey: kmsKey.key
    });

    // 3. Lambda Logs
    const logs = new LogGroupShortRetention(this, 'Logs', {
      logGroupName: '/aws/lambda/my-api',
      encryptionKey: kmsKey.key
    });

    // 4. Lambda IAM Role
    const role = new IamRoleLambdaBasic(this, 'LambdaRole', {
      roleName: 'my-api-lambda-role',
      enableXRay: true
    });

    // DynamoDB Permissions
    table.table.grantReadWriteData(role.role);

    // 5. Lambda Function
    const fn = new LambdaFunctionSecure(this, 'ApiFunction', {
      functionName: 'my-api-handler',
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda'),
      role: role.role,
      logGroup: logs.logGroup,
      environment: {
        TABLE_NAME: table.tableName,
        NODE_ENV: 'production'
      },
      reservedConcurrentExecutions: 10
    });

    // 6. API Gateway
    const api = new ApiGatewayRestApiStandard(this, 'Api', {
      restApiName: 'my-api',
      deployOptions: {
        stageName: 'prod',
        loggingLevel: apigateway.MethodLoggingLevel.INFO
      }
    });

    // Routes
    const items = api.restApi.root.addResource('items');
    items.addMethod('GET', new apigateway.LambdaIntegration(fn.function));
    items.addMethod('POST', new apigateway.LambdaIntegration(fn.function));

    // 7. CloudFront CDN
    const distribution = new CloudFrontDistributionSecure(this, 'CDN', {
      originBucket: myBucket.bucket,  // S3 Bucket mit Static Assets
      comment: 'API CDN'
    });

    // 8. Route53 DNS
    const zone = new Route53HostedZoneStandard(this, 'Zone', {
      zoneName: 'example.com'
    });

    const apiRecord = new Route53RecordSetStandard(this, 'ApiRecord', {
      hostedZone: zone.hostedZone,
      recordName: 'api.example.com',
      recordType: route53.RecordType.A,
      target: route53.RecordTarget.fromAlias(
        new targets.CloudFrontTarget(distribution.distribution)
      )
    });

    // Outputs
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.apiUrl
    });
    new cdk.CfnOutput(this, 'TableName', {
      value: table.tableName
    });
  }
}
```

---

## 💡 Best Practices

### Kosten-Optimierung
- **LogGroupShortRetention**: 14 Tage Retention spart ~70% Kosten
- **DynamoDB**: On-Demand Pricing für unvorhersehbare Workloads
- **CloudFront**: PriceClass_100 für EU/US Only
- **Lambda**: Reservierte Concurrency für kritische Functions

### Security
- **KMS**: Immer Customer Managed Keys für Production
- **S3**: Block Public Access standardmäßig aktiviert
- **API Gateway**: Resource Policies für IP-Whitelist
- **CloudFront**: HTTPS-only, TLS 1.2+

### High Availability
- **Route53**: Failover Routing für kritische Services
- **DynamoDB**: Point-in-Time Recovery aktivieren
- **Lambda**: Multi-AZ durch AWS automatisch
- **S3**: Cross-Region Replication für kritische Daten

---

Vollständige Dokumentation: [README_DE.md](./README_DE.md)