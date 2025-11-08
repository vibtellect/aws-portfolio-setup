import { describe, test, beforeEach, expect } from '@jest/globals';
import { App, Stack } from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import * as iam from 'aws-cdk-lib/aws-iam';
import { IamRoleLambdaBasic } from '../src';

describe('IamRoleLambdaBasic', () => {
  let app: App;
  let stack: Stack;

  beforeEach(() => {
    app = new App();
    stack = new Stack(app, 'TestStack');
  });

  // ========================================
  // Test 1: Grundlegende Funktionalität
  // ========================================
  test('creates IAM role with default settings', () => {
    // Arrange & Act
    new IamRoleLambdaBasic(stack, 'TestRole');

    // Assert
    const template = Template.fromStack(stack);
    template.resourceCountIs('AWS::IAM::Role', 1);
  });

  // ========================================
  // Test 2: AssumeRole Policy für Lambda
  // ========================================
  test('has correct assume role policy for Lambda', () => {
    // Arrange & Act
    new IamRoleLambdaBasic(stack, 'TestRole');

    const template = Template.fromStack(stack);

    // Assert
    template.hasResourceProperties('AWS::IAM::Role', {
      AssumeRolePolicyDocument: {
        Statement: Match.arrayWith([
          Match.objectLike({
            Effect: 'Allow',
            Principal: {
              Service: 'lambda.amazonaws.com',
            },
            Action: 'sts:AssumeRole',
          }),
        ]),
      },
    });
  });

  // ========================================
  // Test 3: CloudWatch Logs Permissions
  // ========================================
  test('includes CloudWatch Logs permissions', () => {
    // Arrange & Act
    new IamRoleLambdaBasic(stack, 'TestRole');

    const template = Template.fromStack(stack);

    // Assert - CDK erstellt separate IAM::Policy Resource
    // Prüfe dass die Logs Actions im Template sind
    const json = template.toJSON();
    const stringified = JSON.stringify(json);

    expect(stringified).toContain('logs:CreateLogGroup');
    expect(stringified).toContain('logs:CreateLogStream');
    expect(stringified).toContain('logs:PutLogEvents');
  });

  // ========================================
  // Test 4: X-Ray Permissions (wenn aktiviert)
  // ========================================
  test('adds X-Ray permissions when enabled', () => {
    // Arrange & Act
    new IamRoleLambdaBasic(stack, 'TestRole', {
      enableXray: true,
    });

    const template = Template.fromStack(stack);

    // Assert - Prüfe dass X-Ray Actions im Template sind
    const json = template.toJSON();
    const stringified = JSON.stringify(json);

    expect(stringified).toContain('xray:PutTraceSegments');
    expect(stringified).toContain('xray:PutTelemetryRecords');
  });

  // ========================================
  // Test 5: Keine X-Ray Permissions standardmäßig
  // ========================================
  test('does not include X-Ray permissions by default', () => {
    // Arrange & Act
    new IamRoleLambdaBasic(stack, 'TestRole');

    const template = Template.fromStack(stack);

    // Assert - Prüfe dass keine X-Ray managed policies attached sind
    // X-Ray wird über inline policies hinzugefügt, nicht managed policies
    const json = template.toJSON();
    const stringified = JSON.stringify(json);

    // Keine xray Actions sollten existieren
    expect(stringified).not.toContain('xray:PutTraceSegments');
    expect(stringified).not.toContain('xray:PutTelemetryRecords');
  });

  // ========================================
  // Test 6: Extra Policies funktionieren
  // ========================================
  test('allows adding extra policies', () => {
    // Arrange
    const extraPolicy = new iam.PolicyStatement({
      actions: ['s3:GetObject'],
      resources: ['arn:aws:s3:::my-bucket/*'],
    });

    // Act
    new IamRoleLambdaBasic(stack, 'TestRole', {
      extraPolicies: [extraPolicy],
    });

    const template = Template.fromStack(stack);

    // Assert - Prüfe dass S3 Action im Template vorkommt
    const json = template.toJSON();
    const stringified = JSON.stringify(json);

    expect(stringified).toContain('s3:GetObject');
    expect(stringified).toContain('arn:aws:s3:::my-bucket/*');
  });

  // ========================================
  // Test 7: Mehrere Extra Policies
  // ========================================
  test('allows multiple extra policies', () => {
    // Arrange
    const s3Policy = new iam.PolicyStatement({
      actions: ['s3:GetObject'],
      resources: ['arn:aws:s3:::bucket1/*'],
    });

    const dynamoPolicy = new iam.PolicyStatement({
      actions: ['dynamodb:GetItem'],
      resources: ['arn:aws:dynamodb:*:*:table/MyTable'],
    });

    // Act
    new IamRoleLambdaBasic(stack, 'TestRole', {
      extraPolicies: [s3Policy, dynamoPolicy],
    });

    const template = Template.fromStack(stack);

    // Assert - Beide Actions sollten im Template sein
    const json = template.toJSON();
    const stringified = JSON.stringify(json);

    expect(stringified).toContain('s3:GetObject');
    expect(stringified).toContain('dynamodb:GetItem');
    expect(stringified).toContain('arn:aws:s3:::bucket1/*');
    expect(stringified).toContain('arn:aws:dynamodb:*:*:table/MyTable');
  });

  // ========================================
  // Test 8: Outputs sind verfügbar
  // ========================================
  test('provides role, roleArn, and roleName outputs', () => {
    // Arrange & Act
    const construct = new IamRoleLambdaBasic(stack, 'TestRole');

    // Assert
    expect(construct.role).toBeDefined();
    expect(construct.roleArn).toBeDefined();
    expect(construct.roleName).toBeDefined();
  });

  // ========================================
  // Test 9: Custom Description
  // ========================================
  test('uses custom description when provided', () => {
    // Arrange & Act
    const description = 'My custom Lambda role';
    new IamRoleLambdaBasic(stack, 'TestRole', {
      description,
    });

    const template = Template.fromStack(stack);

    // Assert
    template.hasResourceProperties('AWS::IAM::Role', {
      Description: description,
    });
  });

  // ========================================
  // Test 10: Validierung - Role Name zu lang
  // ========================================
  test('throws error when role name exceeds 64 characters', () => {
    // Arrange
    const tooLongName = 'a'.repeat(65);

    // Act & Assert
    expect(() => {
      new IamRoleLambdaBasic(stack, 'TestRole', {
        roleName: tooLongName,
      });
    }).toThrow('Role name must be <= 64 characters');
  });

  // ========================================
  // Test 11: Validierung - Ungültiges Role Name Pattern
  // ========================================
  test('throws error for invalid role name pattern', () => {
    // Arrange
    const invalidName = 'my role with spaces!';

    // Act & Assert
    expect(() => {
      new IamRoleLambdaBasic(stack, 'TestRole', {
        roleName: invalidName,
      });
    }).toThrow('Role name must match pattern');
  });

  // ========================================
  // Test 12: Validierung - Zu viele Extra Policies
  // ========================================
  test('throws error when more than 10 extra policies provided', () => {
    // Arrange
    const tooManyPolicies = Array.from({ length: 11 }, () =>
      new iam.PolicyStatement({
        actions: ['s3:GetObject'],
        resources: ['*'],
      })
    );

    // Act & Assert
    expect(() => {
      new IamRoleLambdaBasic(stack, 'TestRole', {
        extraPolicies: tooManyPolicies,
      });
    }).toThrow('Maximum 10 extra policies allowed');
  });

  // ========================================
  // Test 13: Custom Role Name funktioniert
  // ========================================
  test('uses custom role name when provided', () => {
    // Arrange & Act
    const roleName = 'MyCustomLambdaRole';
    new IamRoleLambdaBasic(stack, 'TestRole', {
      roleName,
    });

    const template = Template.fromStack(stack);

    // Assert
    template.hasResourceProperties('AWS::IAM::Role', {
      RoleName: roleName,
    });
  });
});
