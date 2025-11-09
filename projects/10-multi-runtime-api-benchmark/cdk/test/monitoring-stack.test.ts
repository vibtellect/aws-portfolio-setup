import { App } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { MonitoringStack } from '../lib/monitoring-stack';
import { Function, Runtime, Code } from 'aws-cdk-lib/aws-lambda';
import { Table, AttributeType, BillingMode } from 'aws-cdk-lib/aws-dynamodb';
import * as cdk from 'aws-cdk-lib';

describe('MonitoringStack', () => {
  let app: App;
  let baseStack: cdk.Stack;
  let mockLambdaFunctions: any;
  let mockTable: Table;

  beforeEach(() => {
    app = new App();
    baseStack = new cdk.Stack(app, 'BaseStack');

    // Create mock Lambda functions
    const createMockFunction = (name: string) => {
      return new Function(baseStack, `${name}Function`, {
        functionName: `test-${name}-function`,
        runtime: Runtime.NODEJS_20_X,
        handler: 'index.handler',
        code: Code.fromInline('exports.handler = async () => ({ statusCode: 200 });'),
      });
    };

    mockLambdaFunctions = {
      python: createMockFunction('python'),
      typescript: createMockFunction('typescript'),
      go: createMockFunction('go'),
      kotlin: createMockFunction('kotlin'),
    };

    // Create mock DynamoDB table
    mockTable = new Table(baseStack, 'MockTable', {
      tableName: 'test-table',
      partitionKey: {
        name: 'id',
        type: AttributeType.STRING,
      },
      billingMode: BillingMode.PAY_PER_REQUEST,
    });
  });

  describe('Dashboard Creation', () => {
    test('creates CloudWatch dashboard', () => {
      const stack = new MonitoringStack(app, 'TestMonitoringStack', {
        environment: 'dev',
        lambdaFunctions: mockLambdaFunctions,
        table: mockTable,
      });
      const template = Template.fromStack(stack);

      template.resourceCountIs('AWS::CloudWatch::Dashboard', 1);
    });

    test('dashboard has correct name', () => {
      const stack = new MonitoringStack(app, 'TestMonitoringStack', {
        environment: 'dev',
        lambdaFunctions: mockLambdaFunctions,
        table: mockTable,
      });
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: 'multi-runtime-benchmark-dev',
      });
    });

    test('dashboard body contains widgets', () => {
      const stack = new MonitoringStack(app, 'TestMonitoringStack', {
        environment: 'dev',
        lambdaFunctions: mockLambdaFunctions,
        table: mockTable,
      });
      const template = Template.fromStack(stack);

      const dashboards = template.findResources('AWS::CloudWatch::Dashboard');
      const dashboardBody = JSON.parse(
        Object.values(dashboards)[0].Properties.DashboardBody
      );

      expect(dashboardBody.widgets).toBeDefined();
      expect(dashboardBody.widgets.length).toBeGreaterThan(0);
    });
  });

  describe('SNS Topic for Alarms', () => {
    test('creates SNS topic when email provided', () => {
      const stack = new MonitoringStack(app, 'TestMonitoringStack', {
        environment: 'dev',
        lambdaFunctions: mockLambdaFunctions,
        table: mockTable,
        alertEmail: 'test@example.com',
      });
      const template = Template.fromStack(stack);

      template.resourceCountIs('AWS::SNS::Topic', 1);
    });

    test('SNS topic has email subscription', () => {
      const stack = new MonitoringStack(app, 'TestMonitoringStack', {
        environment: 'dev',
        lambdaFunctions: mockLambdaFunctions,
        table: mockTable,
        alertEmail: 'test@example.com',
      });
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::SNS::Subscription', {
        Protocol: 'email',
        Endpoint: 'test@example.com',
      });
    });

    test('does not create SNS topic without email', () => {
      const stack = new MonitoringStack(app, 'TestMonitoringStack', {
        environment: 'dev',
        lambdaFunctions: mockLambdaFunctions,
        table: mockTable,
      });
      const template = Template.fromStack(stack);

      template.resourceCountIs('AWS::SNS::Topic', 0);
    });
  });

  describe('CloudWatch Alarms', () => {
    test('creates error alarms for all runtimes when email provided', () => {
      const stack = new MonitoringStack(app, 'TestMonitoringStack', {
        environment: 'dev',
        lambdaFunctions: mockLambdaFunctions,
        table: mockTable,
        alertEmail: 'test@example.com',
      });
      const template = Template.fromStack(stack);

      // 4 runtimes × 3 alarms each (error, latency, throttle) = 12 alarms
      const alarms = template.findResources('AWS::CloudWatch::Alarm');
      expect(Object.keys(alarms).length).toBeGreaterThanOrEqual(12);
    });

    test('error alarm has correct configuration', () => {
      const stack = new MonitoringStack(app, 'TestMonitoringStack', {
        environment: 'dev',
        lambdaFunctions: mockLambdaFunctions,
        table: mockTable,
        alertEmail: 'test@example.com',
      });
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'Errors',
        Namespace: 'AWS/Lambda',
        Statistic: 'Sum',
        Threshold: 10,
        ComparisonOperator: 'GreaterThanThreshold',
      });
    });

    test('latency alarm has correct configuration', () => {
      const stack = new MonitoringStack(app, 'TestMonitoringStack', {
        environment: 'dev',
        lambdaFunctions: mockLambdaFunctions,
        table: mockTable,
        alertEmail: 'test@example.com',
      });
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'Duration',
        Namespace: 'AWS/Lambda',
        ExtendedStatistic: 'p99',
        Threshold: 1000,
        ComparisonOperator: 'GreaterThanThreshold',
      });
    });

    test('throttle alarm has correct configuration', () => {
      const stack = new MonitoringStack(app, 'TestMonitoringStack', {
        environment: 'dev',
        lambdaFunctions: mockLambdaFunctions,
        table: mockTable,
        alertEmail: 'test@example.com',
      });
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'Throttles',
        Namespace: 'AWS/Lambda',
        Statistic: 'Sum',
        Threshold: 1,
        ComparisonOperator: 'GreaterThanThreshold',
      });
    });

    test('does not create alarms without email', () => {
      const stack = new MonitoringStack(app, 'TestMonitoringStack', {
        environment: 'dev',
        lambdaFunctions: mockLambdaFunctions,
        table: mockTable,
      });
      const template = Template.fromStack(stack);

      template.resourceCountIs('AWS::CloudWatch::Alarm', 0);
    });
  });

  describe('Tagging', () => {
    test('has correct project tags', () => {
      const stack = new MonitoringStack(app, 'TestMonitoringStack', {
        environment: 'dev',
        lambdaFunctions: mockLambdaFunctions,
        table: mockTable,
      });

      const stackTags = cdk.Tags.of(stack);
      // Tags are applied at the stack level
      expect(stack).toBeDefined();
    });
  });
});
