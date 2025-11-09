# AWS CDK Interface Implementation Pattern

## Problem

Die ursprünglichen Custom Constructs verwendeten das **Composition Pattern** ohne Interface-Implementierung:

```typescript
export class LambdaFunctionSecure extends Construct {
  public readonly function: lambda.Function; // ❌ Nicht kompatibel mit IFunction
}
```

Das führt zu TypeScript-Fehlern, wenn die Constructs verwendet werden, wo AWS CDK Interfaces erwartet werden (z.B. `IFunction`, `IRole`, `ITable`).

## Lösung: Interface Delegation Pattern

**Richtige Implementierung:**

```typescript
export class LambdaFunctionSecure extends Construct implements lambda.IFunction {
  private readonly _function: lambda.Function;
  
  // Alle IFunction Properties als public readonly
  public readonly functionArn: string;
  public readonly functionName: string;
  public readonly grantPrincipal: iam.IPrincipal;
  // ... alle anderen IFunction properties
  
  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);
    
    // Erstelle innere Function
    this._function = new lambda.Function(this, 'Function', props);
    
    // Delegiere alle Properties
    this.functionArn = this._function.functionArn;
    this.functionName = this._function.functionName;
    this.grantPrincipal = this._function.grantPrincipal;
    // ... alle anderen properties
  }
  
  // Delegiere alle Methoden
  public grantInvoke(identity: iam.IGrantable): iam.Grant {
    return this._function.grantInvoke(identity);
  }
  // ... alle anderen methods
}
```

## Vorteile

✅ **Type-Safe**: Funktioniert überall wo IFunction erwartet wird
✅ **Best Practices**: Opinionated Defaults durch Wrapper
✅ **Kompatibel**: Mit allen AWS CDK APIs und Tools
✅ **Wartbar**: Zentrale Stelle für Security/Cost Best Practices

## AWS CDK Interfaces

### IFunction (lambda)
- **Properties**: ~15 (functionArn, functionName, grantPrincipal, etc.)
- **Methods**: ~15 (grantInvoke, addEventSource, metric*, etc.)
- **Dokumentation**: https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_lambda.IFunction.html

### IRole (iam)
- **Properties**: ~10 (roleArn, roleName, grantPrincipal, etc.)
- **Methods**: ~10 (grant, grantPassRole, addToPolicy, etc.)
- **Dokumentation**: https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_iam.IRole.html

### ITable (dynamodb)
- **Properties**: ~10 (tableArn, tableName, tableStreamArn, etc.)
- **Methods**: ~15 (grant*, metric*, autoScaleReadCapacity, etc.)
- **Dokumentation**: https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_dynamodb.ITable.html

## Referenz-Implementierung

Siehe `src/primitives/compute/lambda-function-secure-v2.ts` für eine vollständige, funktionierende Implementierung mit:
- Korrekter Interface-Implementierung
- Vollständiger Dokumentation
- Allen erforderlichen Properties und Methoden
- Best Practices aus AWS CDK Dokumentation

## Migration

### Alt (nicht kompatibel):
```typescript
const fn = new LambdaFunctionSecure(this, 'Fn', {...});
// fn.function.grantInvoke(role); // ❌ Muss auf .function zugreifen
```

### Neu (kompatibel):
```typescript
const fn = new LambdaFunctionSecure(this, 'Fn', {...});
fn.grantInvoke(role); // ✅ Direkt verwendbar
new apigateway.LambdaIntegration(fn); // ✅ Funktioniert!
```

## Status

### Kritische Constructs (für Project 10)
- ✅ **LambdaFunctionSecure**: Vollständig implementiert → `IFunction`
- ✅ **IamRoleLambdaBasic**: Vollständig implementiert → `IRole`
- ✅ **DynamoDbTableStandard**: Vollständig implementiert → `ITable`

### Weitere Constructs (noch ausstehend)
- ⏳ **LogGroupShortRetention**: Benötigt `ILogGroup`
- ⏳ **ApiGatewayRestApiStandard**: Benötigt `IRestApi`
- ⏳ **S3BucketSecure**: Benötigt `IBucket`
- ⏳ **SnsTopicEncrypted**: Benötigt `ITopic`
- ⏳ **SqsQueueEncrypted**: Benötigt `IQueue`
- ⏳ **KmsKeyManaged**: Benötigt `IKey`
- ⏳ **Alle anderen Constructs**: Benötigen Interface-Implementierung

## Quellen

- AWS CDK Best Practices: https://docs.aws.amazon.com/cdk/v2/guide/best-practices.html
- AWS CDK Constructs: https://docs.aws.amazon.com/cdk/v2/guide/constructs.html
- AWS CDK API Reference: https://docs.aws.amazon.com/cdk/api/v2/docs/aws-construct-library.html
