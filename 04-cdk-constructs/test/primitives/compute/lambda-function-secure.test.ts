import { describe, test, beforeEach, expect } from '@jest/globals';
import { App, Stack, Duration } from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import { LambdaFunctionSecure } from '../../../src/primitives/compute/lambda-function-secure';
import { IamRoleLambdaBasic } from '../../../src/primitives/security/iam-role-lambda-basic';

describe('LambdaFunctionSecure', () => {
  let app: App;
  let stack: Stack;

  beforeEach(() => {
    app = new App();
    stack = new Stack(app, 'TestStack');
  });

  // ========================================
  // Test 1: Grundlegende Funktionalität
  // ========================================
  test('creates Lambda function with required properties', () => {
    // Arrange & Act
    new LambdaFunctionSecure(stack, 'TestFunction', {
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: 'index.handler',
      code: lambda.Code.fromInline('def handler(event, context): return "Hello"'),
    });

    // Assert
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::Lambda::Function', {
      Runtime: 'python3.11',
      Handler: 'index.handler',
    });
  });

  // ========================================
  // Test 2: Custom IAM Role
  // ========================================
  test('uses provided IAM role', () => {
    // Arrange
    const customRole = new IamRoleLambdaBasic(stack, 'CustomRole', {
      enableXray: true,
    });

    // Act
    new LambdaFunctionSecure(stack, 'TestFunction', {
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: 'index.handler',
      code: lambda.Code.fromInline('def handler(event, context): return "Hello"'),
      role: customRole.role,
    });

    // Assert - Should use the custom role
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::Lambda::Function', {
      Role: Match.objectLike({
        'Fn::GetAtt': Match.arrayWith([Match.stringLikeRegexp('CustomRole.*')]),
      }),
    });
  });

  // ========================================
  // Test 3: Auto-create IAM Role
  // ========================================
  test('creates IAM role automatically if not provided', () => {
    // Arrange & Act
    const construct = new LambdaFunctionSecure(stack, 'TestFunction', {
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: 'index.handler',
      code: lambda.Code.fromInline('def handler(event, context): return "Hello"'),
    });

    // Assert - Role should be defined
    expect(construct.role).toBeDefined();
  });

  // ========================================
  // Test 4: Environment Variables
  // ========================================
  test('sets environment variables', () => {
    // Arrange & Act
    new LambdaFunctionSecure(stack, 'TestFunction', {
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: 'index.handler',
      code: lambda.Code.fromInline('def handler(event, context): return "Hello"'),
      environment: {
        TABLE_NAME: 'my-table',
        STAGE: 'dev',
      },
    });

    // Assert
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::Lambda::Function', {
      Environment: {
        Variables: {
          TABLE_NAME: 'my-table',
          STAGE: 'dev',
        },
      },
    });
  });

  // ========================================
  // Test 5: Timeout (Default: 3 seconds)
  // ========================================
  test('uses 3 second timeout by default', () => {
    // Arrange & Act
    new LambdaFunctionSecure(stack, 'TestFunction', {
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: 'index.handler',
      code: lambda.Code.fromInline('def handler(event, context): return "Hello"'),
    });

    // Assert
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::Lambda::Function', {
      Timeout: 3,
    });
  });

  // ========================================
  // Test 6: Custom Timeout
  // ========================================
  test('allows custom timeout', () => {
    // Arrange & Act
    new LambdaFunctionSecure(stack, 'TestFunction', {
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: 'index.handler',
      code: lambda.Code.fromInline('def handler(event, context): return "Hello"'),
      timeout: Duration.seconds(30),
    });

    // Assert
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::Lambda::Function', {
      Timeout: 30,
    });
  });

  // ========================================
  // Test 7: Memory Size (Default: 128 MB)
  // ========================================
  test('uses 128 MB memory by default', () => {
    // Arrange & Act
    new LambdaFunctionSecure(stack, 'TestFunction', {
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: 'index.handler',
      code: lambda.Code.fromInline('def handler(event, context): return "Hello"'),
    });

    // Assert
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::Lambda::Function', {
      MemorySize: 128,
    });
  });

  // ========================================
  // Test 8: Custom Memory Size
  // ========================================
  test('allows custom memory size', () => {
    // Arrange & Act
    new LambdaFunctionSecure(stack, 'TestFunction', {
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: 'index.handler',
      code: lambda.Code.fromInline('def handler(event, context): return "Hello"'),
      memorySize: 512,
    });

    // Assert
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::Lambda::Function', {
      MemorySize: 512,
    });
  });

  // ========================================
  // Test 9: Function Name
  // ========================================
  test('uses custom function name when provided', () => {
    // Arrange & Act
    new LambdaFunctionSecure(stack, 'TestFunction', {
      functionName: 'my-custom-function',
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: 'index.handler',
      code: lambda.Code.fromInline('def handler(event, context): return "Hello"'),
    });

    // Assert
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::Lambda::Function', {
      FunctionName: 'my-custom-function',
    });
  });

  // ========================================
  // Test 10: X-Ray Tracing
  // ========================================
  test('enables X-Ray tracing when specified', () => {
    // Arrange & Act
    new LambdaFunctionSecure(stack, 'TestFunction', {
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: 'index.handler',
      code: lambda.Code.fromInline('def handler(event, context): return "Hello"'),
      tracing: lambda.Tracing.ACTIVE,
    });

    // Assert
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::Lambda::Function', {
      TracingConfig: {
        Mode: 'Active',
      },
    });
  });

  // ========================================
  // Test 11: Outputs (function, functionArn, functionName)
  // ========================================
  test('provides function, functionArn, and functionName outputs', () => {
    // Arrange & Act
    const construct = new LambdaFunctionSecure(stack, 'TestFunction', {
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: 'index.handler',
      code: lambda.Code.fromInline('def handler(event, context): return "Hello"'),
    });

    // Assert
    expect(construct.function).toBeDefined();
    expect(construct.functionArn).toBeDefined();
    expect(construct.functionName).toBeDefined();
  });

  // ========================================
  // Test 12: Tags
  // ========================================
  test('applies managed-by and construct tags', () => {
    // Arrange & Act
    new LambdaFunctionSecure(stack, 'TestFunction', {
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: 'index.handler',
      code: lambda.Code.fromInline('def handler(event, context): return "Hello"'),
    });

    // Assert
    const template = Template.fromStack(stack);
    const resources = template.findResources('AWS::Lambda::Function');
    const functionResource = Object.values(resources)[0];

    expect(functionResource.Properties.Tags).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ Key: 'ManagedBy', Value: 'CDK' }),
        expect.objectContaining({ Key: 'Construct', Value: 'LambdaFunctionSecure' }),
      ])
    );
  });
});
