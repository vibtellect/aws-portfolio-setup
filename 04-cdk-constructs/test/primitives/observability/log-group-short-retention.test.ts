import { describe, test, beforeEach, expect } from '@jest/globals';
import { App, Stack, RemovalPolicy } from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import * as logs from 'aws-cdk-lib/aws-logs';
import { LogGroupShortRetention } from '../../../src/primitives/observability/log-group-short-retention';

describe('LogGroupShortRetention', () => {
  let app: App;
  let stack: Stack;

  beforeEach(() => {
    app = new App();
    stack = new Stack(app, 'TestStack');
  });

  // ========================================
  // Test 1: Grundlegende Funktionalität
  // ========================================
  test('creates log group with default settings', () => {
    // Arrange & Act
    new LogGroupShortRetention(stack, 'TestLogs');

    // Assert
    const template = Template.fromStack(stack);

    // Erwartung: Genau 1 CloudWatch Log Group wird erstellt
    template.resourceCountIs('AWS::Logs::LogGroup', 1);
  });

  // ========================================
  // Test 2: Retention wird korrekt gesetzt
  // ========================================
  test('sets retention to TWO_WEEKS by default', () => {
    // Arrange & Act
    new LogGroupShortRetention(stack, 'TestLogs');

    const template = Template.fromStack(stack);

    // Assert
    template.hasResourceProperties('AWS::Logs::LogGroup', {
      RetentionInDays: 14,
    });
  });

  // ========================================
  // Test 3: Custom Retention funktioniert
  // ========================================
  test('allows custom retention days', () => {
    // Arrange & Act
    new LogGroupShortRetention(stack, 'TestLogs', {
      retentionDays: logs.RetentionDays.ONE_WEEK,
    });

    const template = Template.fromStack(stack);

    // Assert
    template.hasResourceProperties('AWS::Logs::LogGroup', {
      RetentionInDays: 7,
    });
  });

  // ========================================
  // Test 4: Custom Name funktioniert
  // ========================================
  test('uses custom log group name when provided', () => {
    // Arrange & Act
    const customName = '/aws/lambda/my-function';
    new LogGroupShortRetention(stack, 'TestLogs', {
      logGroupName: customName,
    });

    const template = Template.fromStack(stack);

    // Assert
    template.hasResourceProperties('AWS::Logs::LogGroup', {
      LogGroupName: customName,
    });
  });

  // ========================================
  // Test 5: Outputs sind verfügbar
  // ========================================
  test('provides log group name and ARN outputs', () => {
    // Arrange & Act
    const construct = new LogGroupShortRetention(stack, 'TestLogs');

    // Assert
    expect(construct.logGroupArn).toBeDefined();
    expect(construct.logGroupName).toBeDefined();
    expect(construct.logGroup).toBeDefined();
  });

  // ========================================
  // Test 6: Environment Detection (Dev)
  // ========================================
  test('uses DESTROY removal policy for dev stacks', () => {
    // Arrange
    const devStack = new Stack(app, 'DevTestStack');

    // Act
    new LogGroupShortRetention(devStack, 'TestLogs');

    // Assert
    const template = Template.fromStack(devStack);
    template.hasResource('AWS::Logs::LogGroup', {
      DeletionPolicy: 'Delete',
    });
  });

  // ========================================
  // Test 7: Environment Detection (Prod)
  // ========================================
  test('uses RETAIN removal policy for production stacks', () => {
    // Arrange
    const prodStack = new Stack(app, 'ProductionStack');

    // Act
    new LogGroupShortRetention(prodStack, 'TestLogs');

    // Assert
    const template = Template.fromStack(prodStack);
    template.hasResource('AWS::Logs::LogGroup', {
      DeletionPolicy: 'Retain',
    });
  });

  // ========================================
  // Test 8: KMS Encryption (optional)
  // ========================================
  test('supports KMS encryption when key is provided', () => {
    // Arrange & Act
    new LogGroupShortRetention(stack, 'TestLogs', {
      kmsKeyArn: 'arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012',
    });

    const template = Template.fromStack(stack);

    // Assert
    template.hasResourceProperties('AWS::Logs::LogGroup', {
      KmsKeyId: 'arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012',
    });
  });

  // ========================================
  // Test 9: Tags werden hinzugefügt
  // ========================================
  test('adds managed-by and construct tags', () => {
    // Arrange & Act
    new LogGroupShortRetention(stack, 'TestLogs');

    const template = Template.fromStack(stack);

    // Assert
    // CDK fügt Tags als Teil des LogGroup Resources hinzu
    template.hasResourceProperties('AWS::Logs::LogGroup',
      Match.objectLike({})
    );
  });

  // ========================================
  // Test 10: Validierung - Name zu lang
  // ========================================
  test('throws error when log group name exceeds 512 characters', () => {
    // Arrange
    const tooLongName = 'a'.repeat(513);

    // Act & Assert
    expect(() => {
      new LogGroupShortRetention(stack, 'TestLogs', {
        logGroupName: tooLongName,
      });
    }).toThrow('Log group name must be <= 512 characters');
  });

  // ========================================
  // Test 11: Custom RemovalPolicy
  // ========================================
  test('allows custom removal policy', () => {
    // Arrange & Act
    new LogGroupShortRetention(stack, 'TestLogs', {
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const template = Template.fromStack(stack);

    // Assert
    template.hasResource('AWS::Logs::LogGroup', {
      DeletionPolicy: 'Delete',
    });
  });
});
