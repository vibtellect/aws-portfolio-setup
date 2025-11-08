# CDK Constructs Analyse für 01-serverless-todo-app

> **Erstellt:** 2025-11-08
> **Projekt:** 01-serverless-todo-app
> **CDK Constructs Library Version:** 2.0.0 (Phase 2.1)

---

## 📋 Übersicht

Diese Analyse identifiziert welche CDK Constructs aus `04-cdk-constructs/` für die Serverless Todo App benötigt werden und erstellt einen Integrationsplan.

---

## 🎯 Todo App Architektur - Benötigte AWS Services

### **1. Auth Stack (Cognito)**
- AWS Cognito User Pool
- AWS Cognito User Pool Client
- Optional: Identity Pool

### **2. Backend Stack (API + Lambda + DynamoDB)**
- DynamoDB Table (userId + todoId keys)
- Lambda Functions (CRUD handlers: create, read, update, delete)
- API Gateway REST API
- Cognito Authorizer
- IAM Roles für Lambda
- CloudWatch Logs

### **3. Frontend Stack (S3 + CloudFront)**
- S3 Bucket (Static Website Hosting)
- CloudFront Distribution
- Origin Access Identity (OAI) oder Origin Access Control (OAC)

---

## 📊 Mapping: Todo App → CDK Constructs

### ✅ **VERFÜGBAR** (Kann sofort verwendet werden)

| Todo App Komponente | CDK Construct | Status | Location |
|---------------------|---------------|--------|----------|
| IAM Role für Lambda | `iam-role-lambda-basic` | ✅ Production-Ready | `primitives/security/iam-role-lambda-basic/` |
| CloudWatch Logs | `log-group-short-retention` | ✅ Production-Ready | `primitives/observability/log-group-short-retention/` |
| KMS Encryption Keys | `kms-key-managed` | ✅ Production-Ready | `primitives/security/kms-key-managed/` |
| SNS Notifications (optional) | `sns-topic-encrypted` | ✅ Production-Ready | `primitives/messaging/sns-topic-encrypted/` |
| SQS Queue (optional) | `sqs-queue-encrypted` | ✅ Production-Ready | `primitives/messaging/sqs-queue-encrypted/` |

### 🔴 **FEHLT** (Muss noch implementiert werden)

| Todo App Komponente | Benötigtes Construct | Status | Priorität |
|---------------------|---------------------|--------|-----------|
| DynamoDB Table | `dynamodb-table-standard` | 🔴 Geplant (Phase 2.2) | **HOCH** |
| Lambda Functions | `lambda-function-secure` | 🔴 Geplant (Phase 2.2) | **HOCH** |
| S3 Bucket (Frontend) | `s3-bucket-secure` | 🔴 Geplant (Phase 2.2) | **HOCH** |
| API Gateway REST API | `rest-api-lambda` | 🔴 Nicht geplant | **HOCH** |
| CloudFront + S3 | `static-site-cloudfront` | 🟡 Pattern existiert (nur README) | **MITTEL** |
| Cognito User Pool | `cognito-user-pool` | 🔴 Nicht geplant | **HOCH** |
| API Gateway Authorizer | `cognito-authorizer` | 🔴 Nicht geplant | **MITTEL** |

---

## 🏗️ Integrationsplan

### **Phase 1: Verfügbare Constructs integrieren** (Sofort möglich)

#### 1.1 Auth Stack Setup
```typescript
// infrastructure/stacks/todo-auth-stack.ts
import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cognito from 'aws-cdk-lib/aws-cognito';

export class TodoAuthStack extends Stack {
  public readonly userPool: cognito.UserPool;
  public readonly userPoolClient: cognito.UserPoolClient;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // ⚠️ Noch nicht verfügbar - muss manuell erstellt werden
    // oder warten bis cognito-user-pool Construct existiert
    this.userPool = new cognito.UserPool(this, 'TodoUserPool', {
      userPoolName: 'todo-app-users',
      selfSignUpEnabled: true,
      signInAliases: {
        email: true,
      },
      autoVerify: {
        email: true,
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: false,
      },
    });

    this.userPoolClient = this.userPool.addClient('TodoWebClient', {
      authFlows: {
        userPassword: true,
        userSrp: true,
      },
    });
  }
}
```

#### 1.2 Backend Stack Setup (mit verfügbaren Constructs)
```typescript
// infrastructure/stacks/todo-backend-stack.ts
import { Stack, StackProps, Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';

// ✅ Verfügbare Constructs
import { IamRoleLambdaBasic } from '../../../04-cdk-constructs/primitives/security/iam-role-lambda-basic/src';
import { LogGroupShortRetention } from '../../../04-cdk-constructs/primitives/observability/log-group-short-retention/src';
import { KmsKeyManaged } from '../../../04-cdk-constructs/primitives/security/kms-key-managed/src';

export class TodoBackendStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // ✅ 1. KMS Key für Verschlüsselung (verfügbar)
    const kmsKey = new KmsKeyManaged(this, 'TodoEncryptionKey', {
      description: 'Encryption key for Todo App (DynamoDB, Logs)',
      enableKeyRotation: true,
      enableLambdaAccess: true,
      alias: 'alias/todo-app-key',
    });

    // ⚠️ 2. DynamoDB Table (noch nicht verfügbar - manuell)
    const todosTable = new dynamodb.Table(this, 'TodosTable', {
      tableName: 'todo-app-todos',
      partitionKey: {
        name: 'userId',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'todoId',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.CUSTOMER_MANAGED,
      encryptionKey: kmsKey.key,
      pointInTimeRecovery: false, // Kosten sparen
    });

    // ✅ 3. IAM Role für Lambda (verfügbar)
    const lambdaRole = new IamRoleLambdaBasic(this, 'TodoLambdaRole', {
      description: 'Role for Todo App Lambda functions',
      enableXray: true,
      extraPolicies: [
        new iam.PolicyStatement({
          actions: [
            'dynamodb:GetItem',
            'dynamodb:PutItem',
            'dynamodb:UpdateItem',
            'dynamodb:DeleteItem',
            'dynamodb:Query',
          ],
          resources: [todosTable.tableArn],
        }),
      ],
    });

    // ✅ 4. CloudWatch Logs (verfügbar)
    const logGroup = new LogGroupShortRetention(this, 'TodoLambdaLogs', {
      logGroupName: '/aws/lambda/todo-app',
      kmsKeyArn: kmsKey.keyArn,
    });

    // ⚠️ 5. Lambda Functions (noch nicht verfügbar - manuell)
    const createTodoFn = new lambda.Function(this, 'CreateTodoFn', {
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: 'create_todo.handler',
      code: lambda.Code.fromAsset('../backend/src/handlers'),
      role: lambdaRole.role,
      environment: {
        TABLE_NAME: todosTable.tableName,
      },
      logGroup: logGroup.logGroup,
    });

    // ⚠️ 6. API Gateway (noch nicht verfügbar - manuell)
    const api = new apigateway.RestApi(this, 'TodoApi', {
      restApiName: 'Todo App API',
      description: 'REST API for Todo App',
    });

    // API Routes
    const todos = api.root.addResource('todos');
    todos.addMethod('GET', new apigateway.LambdaIntegration(getTodosFn));
    todos.addMethod('POST', new apigateway.LambdaIntegration(createTodoFn));

    const todo = todos.addResource('{todoId}');
    todo.addMethod('GET', new apigateway.LambdaIntegration(getTodoFn));
    todo.addMethod('PUT', new apigateway.LambdaIntegration(updateTodoFn));
    todo.addMethod('DELETE', new apigateway.LambdaIntegration(deleteTodoFn));
  }
}
```

#### 1.3 Frontend Stack Setup
```typescript
// infrastructure/stacks/todo-frontend-stack.ts
import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';

export class TodoFrontendStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // ⚠️ S3 Bucket (noch nicht verfügbar - manuell)
    const websiteBucket = new s3.Bucket(this, 'TodoWebsiteBucket', {
      bucketName: 'todo-app-frontend',
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
    });

    // ⚠️ CloudFront Distribution (Pattern existiert, aber nicht implementiert)
    const distribution = new cloudfront.CloudFrontWebDistribution(this, 'TodoDistribution', {
      originConfigs: [{
        s3OriginSource: {
          s3BucketSource: websiteBucket,
        },
        behaviors: [{ isDefaultBehavior: true }],
      }],
    });
  }
}
```

---

### **Phase 2: Fehlende Constructs implementieren** (Empfohlene Reihenfolge)

#### Priority 1: Kritische Primitives (2-3 Tage)
1. ✅ **`dynamodb-table-standard`** (2-3h)
   - Features: Partition/Sort Keys, Encryption, Streams, GSI Support
   - Needed für: Todo Backend Storage

2. ✅ **`lambda-function-secure`** (3-4h)
   - Features: IAM Integration, Logs, X-Ray, Environment Vars
   - Needed für: Todo CRUD Operations

3. ✅ **`s3-bucket-secure`** (2-3h)
   - Features: Block Public Access, SSE, Lifecycle Policies
   - Needed für: Frontend Static Hosting

#### Priority 2: API & Auth Constructs (2-3 Tage)
4. ✅ **`cognito-user-pool`** (neu, 3-4h)
   - Features: User Pool, Client, Email Verification, Password Policies
   - Needed für: User Authentication

5. ✅ **`rest-api-lambda`** (Pattern, neu, 4-6h)
   - Features: REST API + Lambda Integration, CORS, Authorizers
   - Needed für: Todo API Endpoints

#### Priority 3: Patterns (2 Tage)
6. ✅ **`static-site-cloudfront`** (Pattern existiert, implementieren 4-6h)
   - Features: S3 + CloudFront + OAC
   - Needed für: Frontend Hosting

---

## 📝 Aktionsplan

### **Option A: Sofort starten (mit manueller CDK)**
✅ **Vorteile:**
- Kann sofort mit Todo App beginnen
- Nutzt native CDK L2 Constructs
- Keine Wartezeit

❌ **Nachteile:**
- Weniger Wiederverwendbarkeit
- Keine standardisierten Security/Cost Defaults
- Mehr Boilerplate Code

**Empfohlung:** Für Quick Prototype OK, aber nicht für Production

---

### **Option B: Warten auf Constructs (empfohlen für Production)**
✅ **Vorteile:**
- Nutzt enterprise-grade Constructs (100% Test Coverage)
- Standardisierte Security Best Practices
- Kostenoptimierung eingebaut
- Einfachere Maintenance

❌ **Nachteile:**
- Wartezeit von 5-7 Tagen für alle Constructs

**Zeitplan:**
- **Phase 2.2 (4 Primitives):** ~10-14h → 2-3 Tage
- **Phase 3 (Patterns):** ~12-18h → 2-3 Tage
- **Total:** 5-7 Tage

---

### **Option C: Hybrid-Ansatz (EMPFOHLEN)**
✅ **Vorteile:**
- Nutzt verfügbare Constructs sofort
- Implementiert fehlende Constructs parallel
- Best of both worlds

**Plan:**
1. **Woche 1:** Verfügbare Constructs nutzen (IAM, Logs, KMS)
2. **Woche 2:** Kritische Constructs implementieren (DynamoDB, Lambda, S3)
3. **Woche 3:** Pattern Constructs implementieren (REST API, Static Site, Cognito)
4. **Woche 4:** Migration von manuellem CDK zu Constructs

---

## 🚀 Nächste Schritte

### **Sofort (Heute)**
1. ✅ Analyse abgeschlossen
2. ⏳ Entscheidung: Option A, B, oder C?
3. ⏳ Wenn Option C: Projektstruktur erstellen

### **Diese Woche**
1. ⏳ Infrastructure Ordner erstellen
2. ⏳ CDK App Bootstrap
3. ⏳ Verfügbare Constructs integrieren (IAM, Logs, KMS)

### **Nächste Woche** (abhängig von Entscheidung)
- **Option A:** Backend/Frontend manuell implementieren
- **Option B:** Warten auf Constructs
- **Option C:** Parallel entwickeln (manuelle CDK + Construct Implementation)

---

## 📊 Ressourcen-Übersicht

### **Verfügbar in `04-cdk-constructs/`:**
```
✅ primitives/security/iam-role-lambda-basic/      (13 tests, 100% coverage)
✅ primitives/security/kms-key-managed/            (19 tests, 100% coverage)
✅ primitives/observability/log-group-short-retention/ (11 tests, 100% coverage)
✅ primitives/messaging/sqs-queue-encrypted/       (17 tests, 100% coverage)
✅ primitives/messaging/sns-topic-encrypted/       (13 tests, 100% coverage)
```

### **Fehlt für Todo App:**
```
🔴 primitives/database/dynamodb-table-standard/    (geplant Phase 2.2)
🔴 primitives/compute/lambda-function-secure/      (geplant Phase 2.2)
🔴 primitives/storage/s3-bucket-secure/            (geplant Phase 2.2)
🔴 primitives/security/cognito-user-pool/          (nicht geplant)
🔴 patterns/api/rest-api-lambda/                   (nicht geplant)
🟡 patterns/web/static-site-cloudfront/            (README existiert)
```

---

## 💡 Empfehlung

**Ich empfehle Option C (Hybrid-Ansatz):**

1. **Sofort:** Todo App Struktur aufsetzen mit verfügbaren Constructs
2. **Parallel:** Fehlende Constructs mit TDD implementieren
3. **Migration:** Schrittweise von manuellem CDK zu Constructs

**Geschätzter Zeitrahmen:**
- Todo App MVP: 1-2 Wochen
- Vollständige Construct-Integration: 3-4 Wochen
- Production-Ready: 4-5 Wochen

---

**Erstellt:** 2025-11-08
**Autor:** Claude Code
**Status:** ✅ Analyse abgeschlossen
