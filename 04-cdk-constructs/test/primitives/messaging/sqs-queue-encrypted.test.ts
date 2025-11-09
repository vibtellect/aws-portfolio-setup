import { describe, test, beforeEach, expect } from '@jest/globals';
import { App, Stack, RemovalPolicy, Duration } from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import * as kms from 'aws-cdk-lib/aws-kms';
import { SqsQueueEncrypted } from '../../../src/primitives/messaging/sqs-queue-encrypted';

describe('SqsQueueEncrypted', () => {
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
  test('creates SQS queue with default settings', () => {
    // Arrange & Act
    new SqsQueueEncrypted(stack, 'TestQueue', {
      encryptionMasterKey: encryptionKey,
    });

    // Assert
    const template = Template.fromStack(stack);
    template.resourceCountIs('AWS::SQS::Queue', 1);
  });

  // ========================================
  // Test 2: SSE-KMS Encryption aktiviert
  // ========================================
  test('enables SSE-KMS encryption with provided key', () => {
    // Arrange & Act
    new SqsQueueEncrypted(stack, 'TestQueue', {
      encryptionMasterKey: encryptionKey,
    });

    const template = Template.fromStack(stack);

    // Assert
    const json = template.toJSON();
    const stringified = JSON.stringify(json);

    expect(stringified).toContain('KmsMasterKeyId');
  });

  // ========================================
  // Test 3: Message Retention standardmäßig 14 Tage
  // ========================================
  test('sets message retention to 14 days by default', () => {
    // Arrange & Act
    new SqsQueueEncrypted(stack, 'TestQueue', {
      encryptionMasterKey: encryptionKey,
    });

    const template = Template.fromStack(stack);

    // Assert
    template.hasResourceProperties('AWS::SQS::Queue', {
      MessageRetentionPeriod: 1209600, // 14 days in seconds
    });
  });

  // ========================================
  // Test 4: Custom Message Retention
  // ========================================
  test('allows custom message retention period', () => {
    // Arrange & Act
    new SqsQueueEncrypted(stack, 'TestQueue', {
      encryptionMasterKey: encryptionKey,
      retentionPeriod: Duration.days(7),
    });

    const template = Template.fromStack(stack);

    // Assert
    template.hasResourceProperties('AWS::SQS::Queue', {
      MessageRetentionPeriod: 604800, // 7 days in seconds
    });
  });

  // ========================================
  // Test 5: Visibility Timeout konfigurierbar
  // ========================================
  test('allows custom visibility timeout', () => {
    // Arrange & Act
    new SqsQueueEncrypted(stack, 'TestQueue', {
      encryptionMasterKey: encryptionKey,
      visibilityTimeout: Duration.seconds(60),
    });

    const template = Template.fromStack(stack);

    // Assert
    template.hasResourceProperties('AWS::SQS::Queue', {
      VisibilityTimeout: 60,
    });
  });

  // ========================================
  // Test 6: DLQ kann hinzugefügt werden
  // ========================================
  test('allows adding dead letter queue', () => {
    // Arrange & Act
    new SqsQueueEncrypted(stack, 'TestQueue', {
      encryptionMasterKey: encryptionKey,
      enableDeadLetterQueue: true,
      maxReceiveCount: 3,
    });

    const template = Template.fromStack(stack);

    // Assert - Es sollten 2 Queues erstellt werden (main + DLQ)
    template.resourceCountIs('AWS::SQS::Queue', 2);

    const json = template.toJSON();
    const stringified = JSON.stringify(json);

    expect(stringified).toContain('RedrivePolicy');
    expect(stringified).toContain('maxReceiveCount');
  });

  // ========================================
  // Test 7: FIFO Queue kann erstellt werden
  // ========================================
  test('creates FIFO queue when fifo is true', () => {
    // Arrange & Act
    new SqsQueueEncrypted(stack, 'TestQueue', {
      encryptionMasterKey: encryptionKey,
      fifo: true,
    });

    const template = Template.fromStack(stack);

    // Assert
    template.hasResourceProperties('AWS::SQS::Queue', {
      FifoQueue: true,
    });
  });

  // ========================================
  // Test 8: Content-Based Deduplication für FIFO
  // ========================================
  test('enables content-based deduplication for FIFO queues', () => {
    // Arrange & Act
    new SqsQueueEncrypted(stack, 'TestQueue', {
      encryptionMasterKey: encryptionKey,
      fifo: true,
      contentBasedDeduplication: true,
    });

    const template = Template.fromStack(stack);

    // Assert
    template.hasResourceProperties('AWS::SQS::Queue', {
      FifoQueue: true,
      ContentBasedDeduplication: true,
    });
  });

  // ========================================
  // Test 9: Environment Detection (Dev)
  // ========================================
  test('uses DESTROY removal policy for dev stacks', () => {
    // Arrange
    const devStack = new Stack(app, 'DevTestStack');
    const devKey = new kms.Key(devStack, 'DevKey');

    // Act
    new SqsQueueEncrypted(devStack, 'TestQueue', {
      encryptionMasterKey: devKey,
    });

    // Assert
    const template = Template.fromStack(devStack);
    template.hasResource('AWS::SQS::Queue', {
      DeletionPolicy: 'Delete',
    });
  });

  // ========================================
  // Test 10: Environment Detection (Prod)
  // ========================================
  test('uses RETAIN removal policy for production stacks', () => {
    // Arrange
    const prodStack = new Stack(app, 'ProductionStack');
    const prodKey = new kms.Key(prodStack, 'ProdKey');

    // Act
    new SqsQueueEncrypted(prodStack, 'TestQueue', {
      encryptionMasterKey: prodKey,
    });

    // Assert
    const template = Template.fromStack(prodStack);
    template.hasResource('AWS::SQS::Queue', {
      DeletionPolicy: 'Retain',
    });
  });

  // ========================================
  // Test 11: Custom RemovalPolicy
  // ========================================
  test('allows custom removal policy', () => {
    // Arrange & Act
    new SqsQueueEncrypted(stack, 'TestQueue', {
      encryptionMasterKey: encryptionKey,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const template = Template.fromStack(stack);

    // Assert
    template.hasResource('AWS::SQS::Queue', {
      DeletionPolicy: 'Delete',
    });
  });

  // ========================================
  // Test 12: Outputs sind verfügbar
  // ========================================
  test('provides queue, queueArn, and queueUrl outputs', () => {
    // Arrange & Act
    const construct = new SqsQueueEncrypted(stack, 'TestQueue', {
      encryptionMasterKey: encryptionKey,
    });

    // Assert
    expect(construct.queue).toBeDefined();
    expect(construct.queueArn).toBeDefined();
    expect(construct.queueUrl).toBeDefined();
  });

  // ========================================
  // Test 13: Custom Queue Name
  // ========================================
  test('uses custom queue name when provided', () => {
    // Arrange & Act
    const queueName = 'MyCustomQueue';
    new SqsQueueEncrypted(stack, 'TestQueue', {
      encryptionMasterKey: encryptionKey,
      queueName,
    });

    const template = Template.fromStack(stack);

    // Assert
    template.hasResourceProperties('AWS::SQS::Queue', {
      QueueName: queueName,
    });
  });

  // ========================================
  // Test 14: FIFO Queue Name endet mit .fifo
  // ========================================
  test('appends .fifo to queue name for FIFO queues', () => {
    // Arrange & Act
    const queueName = 'MyQueue';
    new SqsQueueEncrypted(stack, 'TestQueue', {
      encryptionMasterKey: encryptionKey,
      fifo: true,
      queueName,
    });

    const template = Template.fromStack(stack);

    // Assert
    template.hasResourceProperties('AWS::SQS::Queue', {
      QueueName: 'MyQueue.fifo',
    });
  });

  // ========================================
  // Test 15: Validierung - Encryption Key Required
  // ========================================
  test('throws error when encryption key is not provided', () => {
    // Act & Assert
    expect(() => {
      new SqsQueueEncrypted(stack, 'TestQueue', {
        // @ts-expect-error - Testing missing required prop
        encryptionMasterKey: undefined,
      });
    }).toThrow('Encryption master key is required');
  });

  // ========================================
  // Test 16: Validierung - maxReceiveCount nur mit DLQ
  // ========================================
  test('throws error when maxReceiveCount is set without DLQ', () => {
    // Act & Assert
    expect(() => {
      new SqsQueueEncrypted(stack, 'TestQueue', {
        encryptionMasterKey: encryptionKey,
        enableDeadLetterQueue: false,
        maxReceiveCount: 3,
      });
    }).toThrow('maxReceiveCount can only be set when enableDeadLetterQueue is true');
  });

  // ========================================
  // Test 17: Content-Based Deduplication nur für FIFO
  // ========================================
  test('throws error when contentBasedDeduplication is used for non-FIFO queue', () => {
    // Act & Assert
    expect(() => {
      new SqsQueueEncrypted(stack, 'TestQueue', {
        encryptionMasterKey: encryptionKey,
        fifo: false,
        contentBasedDeduplication: true,
      });
    }).toThrow('contentBasedDeduplication can only be enabled for FIFO queues');
  });
});
