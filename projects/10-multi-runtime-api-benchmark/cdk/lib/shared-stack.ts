import { Stack, StackProps, CfnOutput, Tags, RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { AttributeType, BillingMode, StreamViewType } from 'aws-cdk-lib/aws-dynamodb';
import {
  DynamoDbTableStandard,
  ApiGatewayRestApiStandard,
} from '@vibtellect/aws-cdk-constructs';
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
  public readonly table: DynamoDbTableStandard;
  public readonly api: ApiGatewayRestApiStandard;

  constructor(scope: Construct, id: string, props?: SharedStackProps) {
    super(scope, id, props);

    const config = getConfig(props?.environment || 'dev');

    // Apply common tags
    Object.entries(COMMON_TAGS).forEach(([key, value]) => {
      Tags.of(this).add(key, value);
    });
    Tags.of(this).add('Environment', config.environment);

    // Create DynamoDB table with standard configuration
    this.table = new DynamoDbTableStandard(this, 'ItemsTable', {
      tableName: config.tableName,
      partitionKey: {
        name: 'id',
        type: AttributeType.STRING,
      },
      billingMode: BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: config.environment === 'prod',
      stream: StreamViewType.NEW_AND_OLD_IMAGES,
      removalPolicy: config.environment === 'prod'
        ? RemovalPolicy.RETAIN
        : RemovalPolicy.DESTROY,
    });

    // Create API Gateway
    this.api = new ApiGatewayRestApiStandard(this, 'BenchmarkApi', {
      restApiName: `${config.projectName}-api-${config.environment}`,
      description: 'Multi-Runtime API Benchmark - Performance Comparison Platform',
      deployOptions: {
        stageName: config.environment,
        metricsEnabled: config.enableDetailedMetrics,
        tracingEnabled: config.enableXRay,
        dataTraceEnabled: config.environment !== 'prod',
        loggingLevel: config.environment === 'prod'
          ? 'ERROR'
          : 'INFO',
      },
      defaultCorsPreflightOptions: API_CORS_CONFIG,
    });

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
