import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as iam from 'aws-cdk-lib/aws-iam';

export interface KmsKeyManagedProps {
  readonly description?: string;
  readonly alias?: string;
  readonly enableKeyRotation?: boolean;
  readonly enableLambdaAccess?: boolean;
  readonly enableSqsAccess?: boolean;
  readonly enableSnsAccess?: boolean;
  readonly enableS3Access?: boolean;
  readonly removalPolicy?: cdk.RemovalPolicy;
}

export class KmsKeyManaged extends Construct implements kms.IKey {
  private readonly _key: kms.Key;
  
  public readonly keyArn: string;
  public readonly keyId: string;
  public readonly env: cdk.ResourceEnvironment;
  public readonly stack: cdk.Stack;
  
  public get keyRef(): kms.KeyReference {
    return this._key.keyRef;
  }
  
  constructor(scope: Construct, id: string, props: KmsKeyManagedProps = {}) {
    super(scope, id);
    
    this.validateProps(props);
    
    const enableKeyRotation = props.enableKeyRotation ?? true;
    const removalPolicy = props.removalPolicy ?? this.getDefaultRemovalPolicy();
    const description = props.description ?? 'Managed KMS key created by CDK';
    
    const keyPolicy = new iam.PolicyDocument({
      statements: [
        new iam.PolicyStatement({
          sid: 'Enable IAM User Permissions',
          effect: iam.Effect.ALLOW,
          principals: [new iam.AccountRootPrincipal()],
          actions: ['kms:*'],
          resources: ['*'],
        }),
      ],
    });
    
    this._key = new kms.Key(this, 'Key', {
      description,
      enableKeyRotation,
      policy: keyPolicy,
      removalPolicy,
    });
    
    const aliasName = props.alias ?? `alias/${id.toLowerCase()}`;
    this._key.addAlias(aliasName);
    
    if (props.enableLambdaAccess) this.addServiceAccess('lambda.amazonaws.com');
    if (props.enableSqsAccess) this.addServiceAccess('sqs.amazonaws.com');
    if (props.enableSnsAccess) this.addServiceAccess('sns.amazonaws.com');
    if (props.enableS3Access) this.addServiceAccess('s3.amazonaws.com');
    
    cdk.Tags.of(this._key).add('ManagedBy', 'CDK');
    cdk.Tags.of(this._key).add('Construct', 'KmsKeyManaged');
    cdk.Tags.of(this._key).add('Purpose', 'Encryption');
    
    this.keyArn = this._key.keyArn;
    this.keyId = this._key.keyId;
    this.env = this._key.env;
    this.stack = this._key.stack;
  }
  
  public addAlias(alias: string): kms.Alias {
    return this._key.addAlias(alias);
  }
  
  public addToResourcePolicy(statement: iam.PolicyStatement, allowNoOp?: boolean): iam.AddToResourcePolicyResult {
    return this._key.addToResourcePolicy(statement, allowNoOp);
  }
  
  public grant(grantee: iam.IGrantable, ...actions: string[]): iam.Grant {
    return this._key.grant(grantee, ...actions);
  }
  
  public grantDecrypt(grantee: iam.IGrantable): iam.Grant {
    return this._key.grantDecrypt(grantee);
  }
  
  public grantEncrypt(grantee: iam.IGrantable): iam.Grant {
    return this._key.grantEncrypt(grantee);
  }
  
  public grantEncryptDecrypt(grantee: iam.IGrantable): iam.Grant {
    return this._key.grantEncryptDecrypt(grantee);
  }
  
  public grantSign(grantee: iam.IGrantable): iam.Grant {
    return this._key.grantSign(grantee);
  }
  
  public grantVerify(grantee: iam.IGrantable): iam.Grant {
    return this._key.grantVerify(grantee);
  }
  
  public grantSignVerify(grantee: iam.IGrantable): iam.Grant {
    return this._key.grantSignVerify(grantee);
  }
  
  public grantGenerateMac(grantee: iam.IGrantable): iam.Grant {
    return this._key.grantGenerateMac(grantee);
  }
  
  public grantVerifyMac(grantee: iam.IGrantable): iam.Grant {
    return this._key.grantVerifyMac(grantee);
  }
  
  public applyRemovalPolicy(policy: cdk.RemovalPolicy): void {
    this._key.applyRemovalPolicy(policy);
  }
  
  private addServiceAccess(servicePrincipal: string): void {
    this._key.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: `Allow ${servicePrincipal} to use key`,
        effect: iam.Effect.ALLOW,
        principals: [new iam.ServicePrincipal(servicePrincipal)],
        actions: [
          'kms:Decrypt',
          'kms:Encrypt',
          'kms:ReEncrypt*',
          'kms:GenerateDataKey*',
          'kms:DescribeKey',
        ],
        resources: ['*'],
      })
    );
  }
  
  private getDefaultRemovalPolicy(): cdk.RemovalPolicy {
    const stackName = cdk.Stack.of(this).stackName.toLowerCase();
    const devPatterns = ['dev', 'test', 'sandbox', 'local', 'demo'];
    const isDev = devPatterns.some((pattern) => stackName.includes(pattern));
    return isDev ? cdk.RemovalPolicy.DESTROY : cdk.RemovalPolicy.RETAIN;
  }
  
  private validateProps(props: KmsKeyManagedProps): void {
    if (props.description && props.description.length > 8192) {
      throw new Error('Description must be <= 8192 characters');
    }
    if (props.alias) {
      if (!props.alias.startsWith('alias/')) {
        throw new Error('Alias must start with "alias/"');
      }
      if (props.alias.startsWith('alias/aws/')) {
        throw new Error('Alias cannot start with "alias/aws/" (reserved for AWS managed keys)');
      }
    }
  }

  /**
   * Access to the underlying kms.Key for advanced use cases
   *
   * @internal
   */
  public get key(): kms.Key {
    return this._key;
  }
}
