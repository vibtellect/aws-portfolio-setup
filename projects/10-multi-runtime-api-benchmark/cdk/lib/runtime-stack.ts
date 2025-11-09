import { Stack, StackProps, CfnOutput, Tags, Duration, Fn } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import { getConfig, RuntimeConfig, COMMON_TAGS } from './config';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';

export interface RuntimeStackProps extends StackProps {
  runtimeName: 'python' | 'typescript' | 'go' | 'kotlin';
  environment?: 'dev' | 'staging' | 'prod';
  tableName: string;
  tableArn: string;
  apiId: string;
  apiRootResourceId: string;
}

/**
 * Runtime-specific stack for Multi-Runtime API Benchmark
 *
 * Creates Lambda function for a specific runtime and integrates it with API Gateway
 */
export class RuntimeStack extends Stack {
  public readonly lambdaFunction: lambda.Function;

  constructor(scope: Construct, id: string, props: RuntimeStackProps) {
    super(scope, id, props);

    const config = getConfig(props.environment || 'dev');
    const runtimeConfig = config.runtimes[props.runtimeName];

    // Apply common tags
    Object.entries(COMMON_TAGS).forEach(([key, value]) => {
      Tags.of(this).add(key, value);
    });
    Tags.of(this).add('Environment', config.environment);
    Tags.of(this).add('Runtime', runtimeConfig.name);

    // Create IAM role for Lambda
    const lambdaRole = new iam.Role(this, `${runtimeConfig.name}LambdaRole`, {
      roleName: `${config.projectName}-${runtimeConfig.name}-lambda-${config.environment}`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
      ],
    });

    // Add DynamoDB permissions
    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'dynamodb:PutItem',
          'dynamodb:GetItem',
          'dynamodb:UpdateItem',
          'dynamodb:DeleteItem',
          'dynamodb:Query',
          'dynamodb:Scan',
        ],
        resources: [props.tableArn, `${props.tableArn}/index/*`],
      })
    );

    // Add X-Ray permissions if enabled
    if (config.enableXRay) {
      lambdaRole.addToPolicy(
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            'xray:PutTraceSegments',
            'xray:PutTelemetryRecords',
          ],
          resources: ['*'],
        })
      );
    }


    // Determine Lambda code based on runtime
    const lambdaCode = this.getLambdaCode(runtimeConfig);

    // Create Lambda function
    this.lambdaFunction = new lambda.Function(this, `${runtimeConfig.name}Lambda`, {
      functionName: `${config.projectName}-${runtimeConfig.name}-${config.environment}`,
      description: `${runtimeConfig.displayName} - API Benchmark`,
      runtime: runtimeConfig.runtime,
      handler: runtimeConfig.handler,
      code: lambdaCode,
      memorySize: runtimeConfig.memorySize,
      timeout: runtimeConfig.timeout,
      role: lambdaRole,
      logRetention: config.logRetention,
      environment: {
        TABLE_NAME: props.tableName,
        RUNTIME_NAME: runtimeConfig.name,
        ENVIRONMENT: config.environment,
        ...runtimeConfig.environment,
      },
      tracing: config.enableXRay ? lambda.Tracing.ACTIVE : lambda.Tracing.DISABLED,
    });

    // Add tags
    Tags.of(this.lambdaFunction).add('Runtime', runtimeConfig.name);

    // Import API Gateway
    const api = this.importApiGateway(props.apiId, props.apiRootResourceId);

    // Create Lambda integration
    const lambdaIntegration = new apigateway.LambdaIntegration(this.lambdaFunction, {
      proxy: true,
    });

    // Add routes to API Gateway
    // Note: In a real implementation, we'd add these to specific resources
    // For now, we create runtime-specific paths

    const runtimeResource = api.root.addResource(runtimeConfig.name);

    // Health endpoint
    const healthResource = runtimeResource.addResource('health');
    healthResource.addMethod('GET', lambdaIntegration);

    // Items endpoints
    const itemsResource = runtimeResource.addResource('items');
    itemsResource.addMethod('GET', lambdaIntegration); // List all
    itemsResource.addMethod('POST', lambdaIntegration); // Create

    const itemResource = itemsResource.addResource('{id}');
    itemResource.addMethod('GET', lambdaIntegration); // Get one
    itemResource.addMethod('PUT', lambdaIntegration); // Update
    itemResource.addMethod('DELETE', lambdaIntegration); // Delete

    // Metrics endpoint
    const metricsResource = runtimeResource.addResource('metrics');
    metricsResource.addMethod('GET', lambdaIntegration);

    // Outputs
    new CfnOutput(this, 'FunctionName', {
      value: this.lambdaFunction.functionName,
      description: `${runtimeConfig.displayName} - Lambda function name`,
      exportName: `${config.projectName}-${runtimeConfig.name}-function-name-${config.environment}`,
    });

    new CfnOutput(this, 'FunctionArn', {
      value: this.lambdaFunction.functionArn,
      description: `${runtimeConfig.displayName} - Lambda function ARN`,
      exportName: `${config.projectName}-${runtimeConfig.name}-function-arn-${config.environment}`,
    });

    new CfnOutput(this, 'ApiEndpoint', {
      value: `${api.url}${runtimeConfig.name}/`,
      description: `${runtimeConfig.displayName} - API endpoint`,
    });
  }

  private getLambdaCode(runtimeConfig: RuntimeConfig): lambda.Code {
    // For now, use dummy code - will be replaced with actual implementations
    return lambda.Code.fromAsset(runtimeConfig.codePath);
  }

  private importApiGateway(apiId: string, rootResourceId: string): apigateway.RestApi {
    return apigateway.RestApi.fromRestApiAttributes(this, 'ImportedApi', {
      restApiId: apiId,
      rootResourceId: rootResourceId,
    }) as apigateway.RestApi;
  }
}
