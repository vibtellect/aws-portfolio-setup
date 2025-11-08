import { describe, test, beforeEach, expect } from '@jest/globals';
import { App, Stack, RemovalPolicy } from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { KmsKeyManaged } from '../src';

describe('KmsKeyManaged', () => {
  let app: App;
  let stack: Stack;

  beforeEach(() => {
    app = new App();
    stack = new Stack(app, 'TestStack');
  });

  // ========================================
  // Test 1: Grundlegende Funktionalität
  // ========================================
  test('creates KMS key with default settings', () => {
    // Arrange & Act
    new KmsKeyManaged(stack, 'TestKey');

    // Assert
    const template = Template.fromStack(stack);
    template.resourceCountIs('AWS::KMS::Key', 1);
  });

  // ========================================
  // Test 2: Key Rotation standardmäßig aktiviert
  // ========================================
  test('enables key rotation by default', () => {
    // Arrange & Act
    new KmsKeyManaged(stack, 'TestKey');

    const template = Template.fromStack(stack);

    // Assert
    template.hasResourceProperties('AWS::KMS::Key', {
      EnableKeyRotation: true,
    });
  });

  // ========================================
  // Test 3: Key Rotation kann deaktiviert werden
  // ========================================
  test('allows disabling key rotation', () => {
    // Arrange & Act
    new KmsKeyManaged(stack, 'TestKey', {
      enableKeyRotation: false,
    });

    const template = Template.fromStack(stack);

    // Assert
    template.hasResourceProperties('AWS::KMS::Key', {
      EnableKeyRotation: false,
    });
  });

  // ========================================
  // Test 4: Alias wird erstellt
  // ========================================
  test('creates key alias', () => {
    // Arrange & Act
    new KmsKeyManaged(stack, 'TestKey');

    const template = Template.fromStack(stack);

    // Assert - Genau 1 Alias wird erstellt
    template.resourceCountIs('AWS::KMS::Alias', 1);
  });

  // ========================================
  // Test 5: Custom Alias funktioniert
  // ========================================
  test('uses custom alias when provided', () => {
    // Arrange & Act
    const customAlias = 'alias/my-custom-key';
    new KmsKeyManaged(stack, 'TestKey', {
      alias: customAlias,
    });

    const template = Template.fromStack(stack);

    // Assert
    template.hasResourceProperties('AWS::KMS::Alias', {
      AliasName: customAlias,
    });
  });

  // ========================================
  // Test 6: Description wird gesetzt
  // ========================================
  test('uses custom description when provided', () => {
    // Arrange & Act
    const description = 'My encryption key for sensitive data';
    new KmsKeyManaged(stack, 'TestKey', {
      description,
    });

    const template = Template.fromStack(stack);

    // Assert
    template.hasResourceProperties('AWS::KMS::Key', {
      Description: description,
    });
  });

  // ========================================
  // Test 7: Lambda kann Key nutzen
  // ========================================
  test('allows Lambda service to use key when enabled', () => {
    // Arrange & Act
    new KmsKeyManaged(stack, 'TestKey', {
      enableLambdaAccess: true,
    });

    const template = Template.fromStack(stack);

    // Assert - Prüfe dass Lambda Service Principal im Key Policy ist
    const json = template.toJSON();
    const stringified = JSON.stringify(json);

    expect(stringified).toContain('lambda.amazonaws.com');
    expect(stringified).toContain('kms:Decrypt');
  });

  // ========================================
  // Test 8: SQS kann Key nutzen
  // ========================================
  test('allows SQS service to use key when enabled', () => {
    // Arrange & Act
    new KmsKeyManaged(stack, 'TestKey', {
      enableSqsAccess: true,
    });

    const template = Template.fromStack(stack);

    // Assert
    const json = template.toJSON();
    const stringified = JSON.stringify(json);

    expect(stringified).toContain('sqs.amazonaws.com');
    expect(stringified).toContain('kms:Decrypt');
  });

  // ========================================
  // Test 9: SNS kann Key nutzen
  // ========================================
  test('allows SNS service to use key when enabled', () => {
    // Arrange & Act
    new KmsKeyManaged(stack, 'TestKey', {
      enableSnsAccess: true,
    });

    const template = Template.fromStack(stack);

    // Assert
    const json = template.toJSON();
    const stringified = JSON.stringify(json);

    expect(stringified).toContain('sns.amazonaws.com');
    expect(stringified).toContain('kms:Decrypt');
  });

  // ========================================
  // Test 10: S3 kann Key nutzen
  // ========================================
  test('allows S3 service to use key when enabled', () => {
    // Arrange & Act
    new KmsKeyManaged(stack, 'TestKey', {
      enableS3Access: true,
    });

    const template = Template.fromStack(stack);

    // Assert
    const json = template.toJSON();
    const stringified = JSON.stringify(json);

    expect(stringified).toContain('s3.amazonaws.com');
    expect(stringified).toContain('kms:Decrypt');
  });

  // ========================================
  // Test 11: Mehrere Services gleichzeitig
  // ========================================
  test('allows multiple services to use key simultaneously', () => {
    // Arrange & Act
    new KmsKeyManaged(stack, 'TestKey', {
      enableLambdaAccess: true,
      enableSqsAccess: true,
      enableSnsAccess: true,
    });

    const template = Template.fromStack(stack);

    // Assert
    const json = template.toJSON();
    const stringified = JSON.stringify(json);

    expect(stringified).toContain('lambda.amazonaws.com');
    expect(stringified).toContain('sqs.amazonaws.com');
    expect(stringified).toContain('sns.amazonaws.com');
  });

  // ========================================
  // Test 12: Environment Detection (Dev)
  // ========================================
  test('uses DESTROY removal policy for dev stacks', () => {
    // Arrange
    const devStack = new Stack(app, 'DevTestStack');

    // Act
    new KmsKeyManaged(devStack, 'TestKey');

    // Assert
    const template = Template.fromStack(devStack);
    template.hasResource('AWS::KMS::Key', {
      DeletionPolicy: 'Delete',
    });
  });

  // ========================================
  // Test 13: Environment Detection (Prod)
  // ========================================
  test('uses RETAIN removal policy for production stacks', () => {
    // Arrange
    const prodStack = new Stack(app, 'ProductionStack');

    // Act
    new KmsKeyManaged(prodStack, 'TestKey');

    // Assert
    const template = Template.fromStack(prodStack);
    template.hasResource('AWS::KMS::Key', {
      DeletionPolicy: 'Retain',
    });
  });

  // ========================================
  // Test 14: Custom RemovalPolicy
  // ========================================
  test('allows custom removal policy', () => {
    // Arrange & Act
    new KmsKeyManaged(stack, 'TestKey', {
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const template = Template.fromStack(stack);

    // Assert
    template.hasResource('AWS::KMS::Key', {
      DeletionPolicy: 'Delete',
    });
  });

  // ========================================
  // Test 15: Outputs sind verfügbar
  // ========================================
  test('provides key, keyArn, and keyId outputs', () => {
    // Arrange & Act
    const construct = new KmsKeyManaged(stack, 'TestKey');

    // Assert
    expect(construct.key).toBeDefined();
    expect(construct.keyArn).toBeDefined();
    expect(construct.keyId).toBeDefined();
  });

  // ========================================
  // Test 16: Validierung - Description zu lang
  // ========================================
  test('throws error when description exceeds 8192 characters', () => {
    // Arrange
    const tooLongDescription = 'a'.repeat(8193);

    // Act & Assert
    expect(() => {
      new KmsKeyManaged(stack, 'TestKey', {
        description: tooLongDescription,
      });
    }).toThrow('Description must be <= 8192 characters');
  });

  // ========================================
  // Test 17: Validierung - Alias muss mit 'alias/' beginnen
  // ========================================
  test('throws error when alias does not start with "alias/"', () => {
    // Arrange
    const invalidAlias = 'my-key-alias';

    // Act & Assert
    expect(() => {
      new KmsKeyManaged(stack, 'TestKey', {
        alias: invalidAlias,
      });
    }).toThrow('Alias must start with "alias/"');
  });

  // ========================================
  // Test 18: Validierung - Alias darf nicht 'alias/aws/' sein
  // ========================================
  test('throws error when alias starts with "alias/aws/"', () => {
    // Arrange
    const reservedAlias = 'alias/aws/my-key';

    // Act & Assert
    expect(() => {
      new KmsKeyManaged(stack, 'TestKey', {
        alias: reservedAlias,
      });
    }).toThrow('Alias cannot start with "alias/aws/"');
  });

  // ========================================
  // Test 19: Default Alias Pattern
  // ========================================
  test('generates default alias from construct id', () => {
    // Arrange & Act
    new KmsKeyManaged(stack, 'MyEncryptionKey');

    const template = Template.fromStack(stack);

    // Assert - Default alias sollte 'alias/' + lowercase construct id sein
    template.hasResourceProperties('AWS::KMS::Alias', {
      AliasName: Match.stringLikeRegexp('alias/.*'),
    });
  });
});
