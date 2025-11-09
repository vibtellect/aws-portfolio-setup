import { Construct, Node } from 'constructs';
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

/**
 * Properties for LambdaFunctionSecure
 * 
 * @see https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_lambda.FunctionProps.html
 */
export interface LambdaFunctionSecureProps {
  readonly functionName?: string;
  readonly runtime: lambda.Runtime;
  readonly handler: string;
  readonly code: lambda.Code;
  readonly role?: iam.IRole;
  readonly environment?: { [key: string]: string };
  readonly timeout?: cdk.Duration;
  readonly memorySize?: number;
  readonly reservedConcurrentExecutions?: number;
  readonly tracing?: lambda.Tracing;
  readonly logRetention?: logs.RetentionDays;
  readonly description?: string;
}

/**
 * Lambda Function mit Production Best Practices und IFunction Interface
 * 
 * Diese Klasse implementiert das IFunction Interface durch Delegation an die
 * innere lambda.Function. Das ermöglicht:
 * - Verwendung überall wo IFunction erwartet wird
 * - Zugriff auf alle IFunction Methoden
 * - Best Practices durch opinionated Defaults
 * 
 * @example
 * ```ts
 * const fn = new LambdaFunctionSecure(this, 'MyFunction', {
 *   runtime: lambda.Runtime.PYTHON_3_11,
 *   handler: 'index.handler',
 *   code: lambda.Code.fromAsset('../backend'),
 * });
 * 
 * // Kann überall verwendet werden wo IFunction erwartet wird
 * new apigateway.LambdaIntegration(fn);
 * ```
 */
export class LambdaFunctionSecure extends Construct implements lambda.IFunction {
  /** Die innere Lambda Function */
  private readonly _function: lambda.Function;

  // ========================================
  // IFunction INTERFACE PROPERTIES
  // ========================================
  
  public readonly functionArn: string;
  public readonly functionName: string;
  public readonly grantPrincipal: iam.IPrincipal;
  public readonly isBoundToVpc: boolean;
  public readonly latestVersion: lambda.IVersion;
  public readonly permissionsNode: Node;
  public readonly architecture: lambda.Architecture;
  public readonly resourceArnsForGrantInvoke: string[];
  public readonly role?: iam.IRole;
  public readonly functionRef: lambda.FunctionReference;
  
  // IResource properties (from IFunction)
  public readonly env: cdk.ResourceEnvironment;
  public readonly stack: cdk.Stack;
  
  constructor(scope: Construct, id: string, props: LambdaFunctionSecureProps) {
    super(scope, id);

    // Create IAM role if not provided
    const role = props.role ?? new iam.Role(this, 'Role', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
      ],
    });

    // Create Lambda function with best practices
    this._function = new lambda.Function(this, 'Function', {
      functionName: props.functionName,
      runtime: props.runtime,
      handler: props.handler,
      code: props.code,
      role: role,
      environment: props.environment,
      timeout: props.timeout ?? cdk.Duration.seconds(3),
      memorySize: props.memorySize ?? 128,
      reservedConcurrentExecutions: props.reservedConcurrentExecutions,
      tracing: props.tracing,
      description: props.description,
      logRetention: props.logRetention ?? logs.RetentionDays.TWO_WEEKS,
    });

    // Add tags
    cdk.Tags.of(this._function).add('ManagedBy', 'CDK');
    cdk.Tags.of(this._function).add('Construct', 'LambdaFunctionSecure');

    // Initialize IFunction interface properties by delegation
    this.functionArn = this._function.functionArn;
    this.functionName = this._function.functionName;
    this.grantPrincipal = this._function.grantPrincipal;
    this.isBoundToVpc = this._function.isBoundToVpc;
    this.latestVersion = this._function.latestVersion;
    this.permissionsNode = this._function.permissionsNode;
    this.architecture = this._function.architecture;
    this.resourceArnsForGrantInvoke = this._function.resourceArnsForGrantInvoke;
    this.role = this._function.role;
    this.functionRef = (this._function as any).functionRef;
    this.env = this._function.env;
    this.stack = cdk.Stack.of(this);
  }

  // ========================================
  // IFunction INTERFACE METHODS - Delegation
  // ========================================

  public get connections(): ec2.Connections {
    return this._function.connections;
  }

  public addEventSource(source: lambda.IEventSource): void {
    this._function.addEventSource(source);
  }

  public addEventSourceMapping(
    id: string,
    options: lambda.EventSourceMappingOptions
  ): lambda.EventSourceMapping {
    return this._function.addEventSourceMapping(id, options);
  }

  public addPermission(id: string, permission: lambda.Permission): void {
    this._function.addPermission(id, permission);
  }

  public addToRolePolicy(statement: iam.PolicyStatement): void {
    this._function.addToRolePolicy(statement);
  }

  public grantInvoke(identity: iam.IGrantable): iam.Grant {
    return this._function.grantInvoke(identity);
  }

  public grantInvokeCompositePrincipal(compositePrincipal: iam.CompositePrincipal): iam.Grant[] {
    return this._function.grantInvokeCompositePrincipal(compositePrincipal);
  }

  public grantInvokeUrl(identity: iam.IGrantable): iam.Grant {
    return this._function.grantInvokeUrl(identity);
  }

  public metric(
    metricName: string,
    props?: cdk.aws_cloudwatch.MetricOptions
  ): cdk.aws_cloudwatch.Metric {
    return this._function.metric(metricName, props);
  }

  public metricInvocations(props?: cdk.aws_cloudwatch.MetricOptions): cdk.aws_cloudwatch.Metric {
    return this._function.metricInvocations(props);
  }

  public metricErrors(props?: cdk.aws_cloudwatch.MetricOptions): cdk.aws_cloudwatch.Metric {
    return this._function.metricErrors(props);
  }

  public metricDuration(props?: cdk.aws_cloudwatch.MetricOptions): cdk.aws_cloudwatch.Metric {
    return this._function.metricDuration(props);
  }

  public metricThrottles(props?: cdk.aws_cloudwatch.MetricOptions): cdk.aws_cloudwatch.Metric {
    return this._function.metricThrottles(props);
  }

  public addFunctionUrl(options?: lambda.FunctionUrlOptions): lambda.FunctionUrl {
    return this._function.addFunctionUrl(options);
  }

  public configureAsyncInvoke(options: lambda.EventInvokeConfigOptions): void {
    this._function.configureAsyncInvoke(options);
  }

  public applyRemovalPolicy(policy: cdk.RemovalPolicy): void {
    this._function.applyRemovalPolicy(policy);
  }

  // Additional methods from IFunction interface
  public grantInvokeLatestVersion(identity: iam.IGrantable): iam.Grant {
    return this._function.grantInvokeLatestVersion(identity);
  }

  public grantInvokeVersion(identity: iam.IGrantable, version: lambda.IVersion): iam.Grant {
    return this._function.grantInvokeVersion(identity, version);
  }

  /**
   * Access to the underlying lambda.Function for advanced use cases
   * 
   * @internal
   */
  public get function(): lambda.Function {
    return this._function;
  }
}
