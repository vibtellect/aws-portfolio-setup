import { describe, test, beforeEach, expect } from '@jest/globals';
import { App, Stack } from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { ApiGatewayRestApiStandard } from '../../../src/primitives/api/api-gateway-rest-api-standard';

describe('ApiGatewayRestApiStandard', () => {
  let app: App;
  let stack: Stack;

  beforeEach(() => {
    app = new App();
    stack = new Stack(app, 'TestStack');
  });

  // ========================================
  // Test 1: Grundlegende Funktionalität
  // ========================================
  test('creates REST API with secure defaults', () => {
    // Arrange & Act
    const api = new ApiGatewayRestApiStandard(stack, 'TestApi');

    // Add dummy method to make API valid
    api.root.addMethod('GET', new apigateway.MockIntegration());

    // Assert
    const template = Template.fromStack(stack);
    template.resourceCountIs('AWS::ApiGateway::RestApi', 1);
  });

  // ========================================
  // Test 2: Custom API Name
  // ========================================
  test('uses custom API name when provided', () => {
    // Arrange & Act
    const api = new ApiGatewayRestApiStandard(stack, 'TestApi', {
      restApiName: 'my-custom-api',
    });

    // Add dummy method
    api.root.addMethod('GET', new apigateway.MockIntegration());

    // Assert
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::ApiGateway::RestApi', {
      Name: 'my-custom-api',
    });
  });

  // ========================================
  // Test 3: CORS Configuration
  // ========================================
  test('disables CORS by default', () => {
    // Arrange & Act
    const construct = new ApiGatewayRestApiStandard(stack, 'TestApi');

    // Assert - No default CORS configuration
    expect(construct.restApi.defaultCorsPreflightOptions).toBeUndefined();
  });

  // ========================================
  // Test 4: Enable CORS
  // ========================================
  test('enables CORS when specified', () => {
    // Arrange & Act
    new ApiGatewayRestApiStandard(stack, 'TestApi', {
      corsOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
    });

    // Assert
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::ApiGateway::Method', {
      HttpMethod: 'OPTIONS',
    });
  });

  // ========================================
  // Test 5: Deployment Stage
  // ========================================
  test('creates deployment with default stage name', () => {
    // Arrange & Act
    const api = new ApiGatewayRestApiStandard(stack, 'TestApi');
    api.root.addMethod('GET', new apigateway.MockIntegration());

    // Assert
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::ApiGateway::Stage', {
      StageName: 'prod',
    });
  });

  // ========================================
  // Test 6: Custom Stage Name
  // ========================================
  test('uses custom stage name when provided', () => {
    // Arrange & Act
    const api = new ApiGatewayRestApiStandard(stack, 'TestApi', {
      defaultStageName: 'dev',
    });
    api.root.addMethod('GET', new apigateway.MockIntegration());

    // Assert
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::ApiGateway::Stage', {
      StageName: 'dev',
    });
  });

  // ========================================
  // Test 7: CloudWatch Logs
  // ========================================
  test('enables CloudWatch logging by default', () => {
    // Arrange & Act
    const api = new ApiGatewayRestApiStandard(stack, 'TestApi');
    api.root.addMethod('GET', new apigateway.MockIntegration());

    // Assert
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::ApiGateway::Stage', {
      MethodSettings: [
        {
          DataTraceEnabled: true,
          HttpMethod: '*',
          LoggingLevel: 'INFO',
          ResourcePath: '/*',
        },
      ],
    });
  });

  // ========================================
  // Test 8: CloudWatch Role
  // ========================================
  test('creates CloudWatch role for API Gateway', () => {
    // Arrange & Act
    const api = new ApiGatewayRestApiStandard(stack, 'TestApi');
    api.root.addMethod('GET', new apigateway.MockIntegration());

    // Assert
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::IAM::Role', {
      AssumeRolePolicyDocument: {
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'apigateway.amazonaws.com',
            },
          },
        ],
      },
      ManagedPolicyArns: [
        {
          'Fn::Join': [
            '',
            [
              'arn:',
              { Ref: 'AWS::Partition' },
              ':iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs',
            ],
          ],
        },
      ],
    });
  });

  // ========================================
  // Test 9: Description
  // ========================================
  test('uses custom description when provided', () => {
    // Arrange & Act
    const api = new ApiGatewayRestApiStandard(stack, 'TestApi', {
      description: 'My API description',
    });
    api.root.addMethod('GET', new apigateway.MockIntegration());

    // Assert
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::ApiGateway::RestApi', {
      Description: 'My API description',
    });
  });

  // ========================================
  // Test 10: Allows Adding Methods
  // ========================================
  test('allows adding custom methods', () => {
    // Arrange & Act
    const api = new ApiGatewayRestApiStandard(stack, 'TestApi');
    api.root.addMethod('GET', new apigateway.MockIntegration());
    api.root.addMethod('POST', new apigateway.MockIntegration());

    // Assert
    const template = Template.fromStack(stack);
    // Should have 2 methods (GET and POST)
    template.resourceCountIs('AWS::ApiGateway::Method', 2);
  });

  // ========================================
  // Test 11: Outputs
  // ========================================
  test('provides restApi, restApiId, and url outputs', () => {
    // Arrange & Act
    const construct = new ApiGatewayRestApiStandard(stack, 'TestApi');

    // Assert
    expect(construct.restApi).toBeDefined();
    expect(construct.restApiId).toBeDefined();
    expect(construct.url).toBeDefined();
  });

  // ========================================
  // Test 12: Root Resource
  // ========================================
  test('provides root resource for adding methods', () => {
    // Arrange & Act
    const construct = new ApiGatewayRestApiStandard(stack, 'TestApi');

    // Assert
    expect(construct.root).toBeDefined();
  });

  // ========================================
  // Test 13: Tags
  // ========================================
  test('applies managed-by and construct tags', () => {
    // Arrange & Act
    const api = new ApiGatewayRestApiStandard(stack, 'TestApi');
    api.root.addMethod('GET', new apigateway.MockIntegration());

    // Assert
    const template = Template.fromStack(stack);
    const resources = template.findResources('AWS::ApiGateway::RestApi');
    const apiResource = Object.values(resources)[0];

    expect(apiResource.Properties.Tags).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ Key: 'ManagedBy', Value: 'CDK' }),
        expect.objectContaining({ Key: 'Construct', Value: 'ApiGatewayRestApiStandard' }),
      ])
    );
  });

  // ========================================
  // Test 14: API Key Not Required by Default
  // ========================================
  test('does not require API key by default', () => {
    // Arrange & Act
    const construct = new ApiGatewayRestApiStandard(stack, 'TestApi');

    // Assert
    expect(construct.restApi.deploymentStage.methodOptions).toBeUndefined();
  });

  // ========================================
  // Test 15: Binary Media Types
  // ========================================
  test('supports custom binary media types', () => {
    // Arrange & Act
    const api = new ApiGatewayRestApiStandard(stack, 'TestApi', {
      binaryMediaTypes: ['image/png', 'image/jpeg'],
    });
    api.root.addMethod('GET', new apigateway.MockIntegration());

    // Assert
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::ApiGateway::RestApi', {
      BinaryMediaTypes: ['image/png', 'image/jpeg'],
    });
  });
});
