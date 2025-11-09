import { App } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { SharedStack } from '../lib/shared-stack';

describe('SharedStack', () => {
  let app: App;
  let stack: SharedStack;
  let template: Template;

  beforeEach(() => {
    app = new App();
    stack = new SharedStack(app, 'TestSharedStack', {
      environment: 'dev',
    });
    template = Template.fromStack(stack);
  });

  describe('DynamoDB Table', () => {
    test('creates DynamoDB table with correct properties', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'dev-benchmark-items',
        BillingMode: 'PAY_PER_REQUEST',
        KeySchema: [
          {
            AttributeName: 'id',
            KeyType: 'HASH',
          },
        ],
        AttributeDefinitions: [
          {
            AttributeName: 'id',
            AttributeType: 'S',
          },
        ],
        StreamSpecification: {
          StreamViewType: 'NEW_AND_OLD_IMAGES',
        },
      });
    });

    test('table has correct tags', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        Tags: [
          {
            Key: 'Project',
            Value: 'MultiRuntimeBenchmark',
          },
          {
            Key: 'Environment',
            Value: 'dev',
          },
        ],
      });
    });

    test('production table has point-in-time recovery enabled', () => {
      const prodStack = new SharedStack(app, 'ProdSharedStack', {
        environment: 'prod',
      });
      const prodTemplate = Template.fromStack(prodStack);

      prodTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
        PointInTimeRecoverySpecification: {
          PointInTimeRecoveryEnabled: true,
        },
      });
    });

    test('dev table does not have point-in-time recovery', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        PointInTimeRecoverySpecification: {
          PointInTimeRecoveryEnabled: false,
        },
      });
    });
  });

  describe('API Gateway', () => {
    test('creates API Gateway REST API', () => {
      template.resourceCountIs('AWS::ApiGateway::RestApi', 1);
    });

    test('API has correct name', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: 'multi-runtime-benchmark-api-dev',
        Description: 'Multi-Runtime API Benchmark - Performance Comparison Platform',
      });
    });

    test('API has deployment stage', () => {
      template.hasResourceProperties('AWS::ApiGateway::Deployment', {});
      template.hasResourceProperties('AWS::ApiGateway::Stage', {
        StageName: 'dev',
      });
    });

    test('API has CloudWatch logging enabled', () => {
      template.hasResourceProperties('AWS::ApiGateway::Stage', {
        TracingEnabled: true,
      });
    });

    test('API has CORS configured', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'OPTIONS',
        Integration: {
          IntegrationResponses: [
            {
              ResponseParameters: {
                'method.response.header.Access-Control-Allow-Headers':
                  "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Runtime'",
                'method.response.header.Access-Control-Allow-Methods':
                  "'GET,POST,PUT,DELETE,OPTIONS'",
                'method.response.header.Access-Control-Allow-Origin': "'*'",
              },
              StatusCode: '204',
            },
          ],
        },
      });
    });
  });

  describe('CloudFormation Outputs', () => {
    test('exports table name', () => {
      template.hasOutput('TableName', {
        Export: {
          Name: 'multi-runtime-benchmark-table-name-dev',
        },
      });
    });

    test('exports table ARN', () => {
      template.hasOutput('TableArn', {
        Export: {
          Name: 'multi-runtime-benchmark-table-arn-dev',
        },
      });
    });

    test('exports API ID', () => {
      template.hasOutput('ApiId', {
        Export: {
          Name: 'multi-runtime-benchmark-api-id-dev',
        },
      });
    });

    test('exports API URL', () => {
      template.hasOutput('ApiUrl', {
        Export: {
          Name: 'multi-runtime-benchmark-api-url-dev',
        },
      });
    });
  });

  describe('Resource Counts', () => {
    test('has exactly one DynamoDB table', () => {
      template.resourceCountIs('AWS::DynamoDB::Table', 1);
    });

    test('has exactly one API Gateway', () => {
      template.resourceCountIs('AWS::ApiGateway::RestApi', 1);
    });

    test('has at least one CloudWatch log group', () => {
      const logGroups = template.findResources('AWS::Logs::LogGroup');
      expect(Object.keys(logGroups).length).toBeGreaterThan(0);
    });
  });
});
