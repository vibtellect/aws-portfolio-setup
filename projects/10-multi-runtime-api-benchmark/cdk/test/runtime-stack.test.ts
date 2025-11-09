import { App, Stack } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { RuntimeStack } from '../lib/runtime-stack';

describe('RuntimeStack', () => {
  let app: App;
  let template: Template;

  const mockProps = {
    runtimeName: 'python' as const,
    environment: 'dev' as const,
    tableName: 'dev-benchmark-items',
    tableArn: 'arn:aws:dynamodb:us-east-1:123456789012:table/dev-benchmark-items',
    apiId: 'test-api-id',
    apiRootResourceId: 'test-root-id',
  };

  beforeEach(() => {
    app = new App();
  });

  describe('Python Runtime Stack', () => {
    beforeEach(() => {
      const stack = new RuntimeStack(app, 'TestPythonStack', {
        ...mockProps,
        runtimeName: 'python',
      });
      template = Template.fromStack(stack);
    });

    test('creates Lambda function with Python runtime', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'python3.11',
        Handler: 'app.handler',
        MemorySize: 512,
        Timeout: 30,
      });
    });

    test('Lambda has correct environment variables', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Environment: {
          Variables: {
            TABLE_NAME: 'dev-benchmark-items',
            RUNTIME_NAME: 'python',
            ENVIRONMENT: 'dev',
            POWERTOOLS_SERVICE_NAME: 'benchmark-python',
            LOG_LEVEL: 'DEBUG',
          },
        },
      });
    });

    test('Lambda has DynamoDB permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: [
            {
              Action: [
                'dynamodb:PutItem',
                'dynamodb:GetItem',
                'dynamodb:UpdateItem',
                'dynamodb:DeleteItem',
                'dynamodb:Query',
                'dynamodb:Scan',
              ],
              Effect: 'Allow',
              Resource: [
                'arn:aws:dynamodb:us-east-1:123456789012:table/dev-benchmark-items',
                'arn:aws:dynamodb:us-east-1:123456789012:table/dev-benchmark-items/index/*',
              ],
            },
          ],
        },
      });
    });
  });

  describe('TypeScript Runtime Stack', () => {
    beforeEach(() => {
      const stack = new RuntimeStack(app, 'TestTypeScriptStack', {
        ...mockProps,
        runtimeName: 'typescript',
      });
      template = Template.fromStack(stack);
    });

    test('creates Lambda function with Node.js runtime', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs20.x',
        Handler: 'index.handler',
        MemorySize: 512,
        Timeout: 30,
      });
    });

    test('Lambda has correct environment variables', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Environment: {
          Variables: {
            TABLE_NAME: 'dev-benchmark-items',
            RUNTIME_NAME: 'typescript',
            ENVIRONMENT: 'dev',
            NODE_ENV: 'dev',
            LOG_LEVEL: 'debug',
          },
        },
      });
    });
  });

  describe('IAM Role', () => {
    beforeEach(() => {
      const stack = new RuntimeStack(app, 'TestRoleStack', mockProps);
      template = Template.fromStack(stack);
    });

    test('creates IAM role for Lambda', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
            },
          ],
        },
      });
    });

    test('role has CloudWatch Logs permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: [
            {
              Action: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
              ],
              Effect: 'Allow',
            },
          ],
        },
      });
    });

    test('role has X-Ray permissions when enabled', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: [
            {
              Action: ['xray:PutTraceSegments', 'xray:PutTelemetryRecords'],
              Effect: 'Allow',
            },
          ],
        },
      });
    });
  });

  describe('CloudWatch Log Group', () => {
    beforeEach(() => {
      const stack = new RuntimeStack(app, 'TestLogStack', mockProps);
      template = Template.fromStack(stack);
    });

    test('creates log group with correct name', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: '/aws/lambda/multi-runtime-benchmark-python-dev',
        RetentionInDays: 7,
      });
    });
  });

  describe('API Gateway Integration', () => {
    beforeEach(() => {
      const stack = new RuntimeStack(app, 'TestApiStack', mockProps);
      template = Template.fromStack(stack);
    });

    test('creates Lambda permission for API Gateway', () => {
      template.hasResourceProperties('AWS::Lambda::Permission', {
        Action: 'lambda:InvokeFunction',
        Principal: 'apigateway.amazonaws.com',
      });
    });

    test('creates API Gateway methods', () => {
      template.resourceCountIs('AWS::ApiGateway::Method', 6); // GET, POST, PUT, DELETE for items + health + metrics
    });
  });

  describe('CloudFormation Outputs', () => {
    beforeEach(() => {
      const stack = new RuntimeStack(app, 'TestOutputStack', mockProps);
      template = Template.fromStack(stack);
    });

    test('exports function name', () => {
      template.hasOutput('FunctionName', {
        Export: {
          Name: 'multi-runtime-benchmark-python-function-name-dev',
        },
      });
    });

    test('exports function ARN', () => {
      template.hasOutput('FunctionArn', {
        Export: {
          Name: 'multi-runtime-benchmark-python-function-arn-dev',
        },
      });
    });
  });

  describe('Tagging', () => {
    beforeEach(() => {
      const stack = new RuntimeStack(app, 'TestTagStack', mockProps);
      template = Template.fromStack(stack);
    });

    test('Lambda function has correct tags', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Tags: [
          {
            Key: 'Project',
            Value: 'MultiRuntimeBenchmark',
          },
          {
            Key: 'Environment',
            Value: 'dev',
          },
          {
            Key: 'Runtime',
            Value: 'python',
          },
        ],
      });
    });
  });
});
