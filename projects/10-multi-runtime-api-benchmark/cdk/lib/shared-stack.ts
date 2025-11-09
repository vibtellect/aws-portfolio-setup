import { Stack, StackProps, CfnOutput, Tags, RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import { getConfig, COMMON_TAGS, API_CORS_CONFIG } from './config';

export interface SharedStackProps extends StackProps {
  environment?: 'dev' | 'staging' | 'prod';
}

/**
 * Shared infrastructure stack for Multi-Runtime API Benchmark
 *
 * Creates:
 * - DynamoDB table for storing items
 * - API Gateway REST API as entry point
 *
 * These resources are shared across all runtime implementations.
 */
export class SharedStack extends Stack {
  public readonly table: dynamodb.ITable;
  public readonly api: apigateway.RestApi;

  constructor(scope: Construct, id: string, props?: SharedStackProps) {
    super(scope, id, props);

    const config = getConfig(props?.environment || 'dev');

    // Apply common tags
    Object.entries(COMMON_TAGS).forEach(([key, value]) => {
      Tags.of(this).add(key, value);
    });
    Tags.of(this).add('Environment', config.environment);

    // Create DynamoDB table with standard configuration
    this.table = new dynamodb.Table(this, 'ItemsTable', {
      tableName: config.tableName,
      partitionKey: {
        name: 'id',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: config.environment === 'prod',
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
      removalPolicy: config.environment === 'prod'
        ? RemovalPolicy.RETAIN
        : RemovalPolicy.DESTROY,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
    });

    Tags.of(this.table).add('ManagedBy', 'CDK');
    Tags.of(this.table).add('CostCenter', config.projectName);

    // Create CloudWatch role for API Gateway
    const cloudWatchRole = new iam.Role(this, 'ApiGatewayCloudWatchRole', {
      assumedBy: new iam.ServicePrincipal('apigateway.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AmazonAPIGatewayPushToCloudWatchLogs'
        ),
      ],
    });

    // Create API Gateway
    this.api = new apigateway.RestApi(this, 'BenchmarkApi', {
      restApiName: `${config.projectName}-api-${config.environment}`,
      description: 'Multi-Runtime API Benchmark - Performance Comparison Platform',
      deploy: true,
      deployOptions: {
        stageName: config.environment,
        metricsEnabled: config.enableDetailedMetrics,
        tracingEnabled: config.enableXRay,
        dataTraceEnabled: config.environment !== 'prod',
        loggingLevel: config.environment === 'prod'
          ? apigateway.MethodLoggingLevel.ERROR
          : apigateway.MethodLoggingLevel.INFO,
      },
      defaultCorsPreflightOptions: API_CORS_CONFIG,
      cloudWatchRole: true,
    });

    // Set account-level CloudWatch role
    new apigateway.CfnAccount(this, 'ApiGatewayAccount', {
      cloudWatchRoleArn: cloudWatchRole.roleArn,
    });

    Tags.of(this.api).add('ManagedBy', 'CDK');

    // Create resource structure for API
    // /health - Health check endpoint
    // /items - Items CRUD operations
    // /items/{id} - Single item operations
    // /metrics - Runtime metrics

    const healthResource = this.api.root.addResource('health');
    const metricsResource = this.api.root.addResource('metrics');
    const itemsResource = this.api.root.addResource('items');
    const itemResource = itemsResource.addResource('{id}');

    // Export values for use in other stacks
    new CfnOutput(this, 'TableName', {
      value: this.table.tableName,
      description: 'DynamoDB table name',
      exportName: `${config.projectName}-table-name-${config.environment}`,
    });

    new CfnOutput(this, 'TableArn', {
      value: this.table.tableArn,
      description: 'DynamoDB table ARN',
      exportName: `${config.projectName}-table-arn-${config.environment}`,
    });

    new CfnOutput(this, 'ApiId', {
      value: this.api.restApiId,
      description: 'API Gateway ID',
      exportName: `${config.projectName}-api-id-${config.environment}`,
    });

    new CfnOutput(this, 'ApiUrl', {
      value: this.api.url,
      description: 'API Gateway URL',
      exportName: `${config.projectName}-api-url-${config.environment}`,
    });

    new CfnOutput(this, 'ApiRootResourceId', {
      value: this.api.root.resourceId,
      description: 'API Gateway root resource ID',
      exportName: `${config.projectName}-api-root-id-${config.environment}`,
    });
  }
}
