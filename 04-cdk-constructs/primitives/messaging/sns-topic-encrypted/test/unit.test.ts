import { describe, test, beforeEach, expect } from '@jest/globals';
import { App, Stack, RemovalPolicy } from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import * as kms from 'aws-cdk-lib/aws-kms';
import { SnsTopicEncrypted } from '../src';

describe('SnsTopicEncrypted', () => {
  let app: App;
  let stack: Stack;
  let encryptionKey: kms.Key;

  beforeEach(() => {
    app = new App();
    stack = new Stack(app, 'TestStack');

    // Create a KMS key for testing
    encryptionKey = new kms.Key(stack, 'TestKey', {
      enableKeyRotation: true,
    });
  });

  // ========================================
  // Test 1: Grundlegende Funktionalität
  // ========================================
  test('creates SNS topic with default settings', () => {
    // Arrange & Act
    new SnsTopicEncrypted(stack, 'TestTopic', {
      masterKey: encryptionKey,
    });

    // Assert
    const template = Template.fromStack(stack);
    template.resourceCountIs('AWS::SNS::Topic', 1);
  });

  // ========================================
  // Test 2: SSE-KMS Encryption aktiviert
  // ========================================
  test('enables SSE-KMS encryption with provided key', () => {
    // Arrange & Act
    new SnsTopicEncrypted(stack, 'TestTopic', {
      masterKey: encryptionKey,
    });

    const template = Template.fromStack(stack);

    // Assert
    const json = template.toJSON();
    const stringified = JSON.stringify(json);

    expect(stringified).toContain('KmsMasterKeyId');
  });

  // ========================================
  // Test 3: Display Name kann gesetzt werden
  // ========================================
  test('uses custom display name when provided', () => {
    // Arrange & Act
    const displayName = 'My Topic Display Name';
    new SnsTopicEncrypted(stack, 'TestTopic', {
      masterKey: encryptionKey,
      displayName,
    });

    const template = Template.fromStack(stack);

    // Assert
    template.hasResourceProperties('AWS::SNS::Topic', {
      DisplayName: displayName,
    });
  });

  // ========================================
  // Test 4: Topic Name kann gesetzt werden
  // ========================================
  test('uses custom topic name when provided', () => {
    // Arrange & Act
    const topicName = 'MyCustomTopic';
    new SnsTopicEncrypted(stack, 'TestTopic', {
      masterKey: encryptionKey,
      topicName,
    });

    const template = Template.fromStack(stack);

    // Assert
    template.hasResourceProperties('AWS::SNS::Topic', {
      TopicName: topicName,
    });
  });

  // ========================================
  // Test 5: FIFO Topic kann erstellt werden
  // ========================================
  test('creates FIFO topic when fifo is true', () => {
    // Arrange & Act
    new SnsTopicEncrypted(stack, 'TestTopic', {
      masterKey: encryptionKey,
      fifo: true,
    });

    const template = Template.fromStack(stack);

    // Assert
    template.hasResourceProperties('AWS::SNS::Topic', {
      FifoTopic: true,
    });
  });

  // ========================================
  // Test 6: Content-Based Deduplication für FIFO
  // ========================================
  test('enables content-based deduplication for FIFO topics', () => {
    // Arrange & Act
    new SnsTopicEncrypted(stack, 'TestTopic', {
      masterKey: encryptionKey,
      fifo: true,
      contentBasedDeduplication: true,
    });

    const template = Template.fromStack(stack);

    // Assert
    template.hasResourceProperties('AWS::SNS::Topic', {
      FifoTopic: true,
      ContentBasedDeduplication: true,
    });
  });

  // ========================================
  // Test 7: FIFO Topic Name endet mit .fifo
  // ========================================
  test('appends .fifo to topic name for FIFO topics', () => {
    // Arrange & Act
    const topicName = 'MyTopic';
    new SnsTopicEncrypted(stack, 'TestTopic', {
      masterKey: encryptionKey,
      fifo: true,
      topicName,
    });

    const template = Template.fromStack(stack);

    // Assert
    template.hasResourceProperties('AWS::SNS::Topic', {
      TopicName: 'MyTopic.fifo',
    });
  });

  // ========================================
  // Test 8: Environment Detection (Dev)
  // ========================================
  test('uses DESTROY removal policy for dev stacks', () => {
    // Arrange
    const devStack = new Stack(app, 'DevTestStack');
    const devKey = new kms.Key(devStack, 'DevKey');

    // Act
    new SnsTopicEncrypted(devStack, 'TestTopic', {
      masterKey: devKey,
    });

    // Assert
    const template = Template.fromStack(devStack);
    template.hasResource('AWS::SNS::Topic', {
      DeletionPolicy: 'Delete',
    });
  });

  // ========================================
  // Test 9: Environment Detection (Prod)
  // ========================================
  test('uses RETAIN removal policy for production stacks', () => {
    // Arrange
    const prodStack = new Stack(app, 'ProductionStack');
    const prodKey = new kms.Key(prodStack, 'ProdKey');

    // Act
    new SnsTopicEncrypted(prodStack, 'TestTopic', {
      masterKey: prodKey,
    });

    // Assert
    const template = Template.fromStack(prodStack);
    template.hasResource('AWS::SNS::Topic', {
      DeletionPolicy: 'Retain',
    });
  });

  // ========================================
  // Test 10: Custom RemovalPolicy
  // ========================================
  test('allows custom removal policy', () => {
    // Arrange & Act
    new SnsTopicEncrypted(stack, 'TestTopic', {
      masterKey: encryptionKey,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const template = Template.fromStack(stack);

    // Assert
    template.hasResource('AWS::SNS::Topic', {
      DeletionPolicy: 'Delete',
    });
  });

  // ========================================
  // Test 11: Outputs sind verfügbar
  // ========================================
  test('provides topic, topicArn, and topicName outputs', () => {
    // Arrange & Act
    const construct = new SnsTopicEncrypted(stack, 'TestTopic', {
      masterKey: encryptionKey,
    });

    // Assert
    expect(construct.topic).toBeDefined();
    expect(construct.topicArn).toBeDefined();
    expect(construct.topicName).toBeDefined();
  });

  // ========================================
  // Test 12: Validierung - Master Key Required
  // ========================================
  test('throws error when master key is not provided', () => {
    // Act & Assert
    expect(() => {
      new SnsTopicEncrypted(stack, 'TestTopic', {
        // @ts-expect-error - Testing missing required prop
        masterKey: undefined,
      });
    }).toThrow('Master key is required');
  });

  // ========================================
  // Test 13: Content-Based Deduplication nur für FIFO
  // ========================================
  test('throws error when contentBasedDeduplication is used for non-FIFO topic', () => {
    // Act & Assert
    expect(() => {
      new SnsTopicEncrypted(stack, 'TestTopic', {
        masterKey: encryptionKey,
        fifo: false,
        contentBasedDeduplication: true,
      });
    }).toThrow('contentBasedDeduplication can only be enabled for FIFO topics');
  });
});
