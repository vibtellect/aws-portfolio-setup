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

Möchtest du, dass ich weitermache mit:
- Messaging (SQS/SNS)
- CDN (CloudFront)
- Authentication (Cognito)
- Observability (CloudWatch)
- Advanced Configuration
- Deployment-Strategien?