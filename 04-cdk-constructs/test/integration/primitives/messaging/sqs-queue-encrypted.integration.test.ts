/**
 * Integration tests for SqsQueueEncrypted construct with LocalStack
 */

import { describe, test, beforeAll, afterAll, expect } from '@jest/globals';
import {
  SQSClient,
  GetQueueAttributesCommand,
  SendMessageCommand,
  ReceiveMessageCommand,
  GetQueueUrlCommand,
} from '@aws-sdk/client-sqs';
import { SqsQueueEncrypted } from '../../../../src/primitives/messaging/sqs-queue-encrypted';
import {
  createTestApp,
  createTestStack,
  deployStack,
  destroyStack,
  addOutput,
} from '../../helpers/cdk-deploy-helper';
import {
  localstackConfig,
  waitForLocalStack,
  generateTestResourceName,
  isServiceAvailable,
} from '../../helpers/localstack-config';

describe('SqsQueueEncrypted - LocalStack Integration', () => {
  const stackName = generateTestResourceName('SqsQueueTest');
  const queueName = generateTestResourceName('test-queue');
  let sqsClient: SQSClient;
  let queueUrl: string;

  beforeAll(async () => {
    await waitForLocalStack();

    const sqsAvailable = await isServiceAvailable('sqs');
    if (!sqsAvailable) {
      throw new Error('SQS service is not available in LocalStack');
    }

    sqsClient = new SQSClient(localstackConfig);

    const app = createTestApp();
    const stack = createTestStack(app, stackName);

    const queue = new SqsQueueEncrypted(stack, 'TestQueue', {
      queueName,
    });

    addOutput(stack, 'QueueUrl', queue.queueUrl, 'The URL of the SQS queue');
    addOutput(stack, 'QueueArn', queue.queueArn, 'The ARN of the SQS queue');
    addOutput(stack, 'QueueName', queue.queueName, 'The name of the SQS queue');

    const result = await deployStack(stack, stackName);
    queueUrl = result.outputs.QueueUrl;

    // If queueUrl is not in outputs, try to get it
    if (!queueUrl) {
      const urlResponse = await sqsClient.send(
        new GetQueueUrlCommand({ QueueName: queueName })
      );
      queueUrl = urlResponse.QueueUrl!;
    }

    console.log(`Deployed queue URL: ${queueUrl}`);
  }, 120000);

  afterAll(async () => {
    await destroyStack(stackName);
    sqsClient.destroy();
  }, 60000);

  test('queue should exist and be accessible', async () => {
    const command = new GetQueueAttributesCommand({
      QueueUrl: queueUrl,
      AttributeNames: ['All'],
    });

    const response = await sqsClient.send(command);
    expect(response.Attributes).toBeDefined();
  });

  test('queue should have encryption enabled', async () => {
    const command = new GetQueueAttributesCommand({
      QueueUrl: queueUrl,
      AttributeNames: ['KmsMasterKeyId', 'SqsManagedSseEnabled'],
    });

    const response = await sqsClient.send(command);
    // LocalStack might use SQS managed encryption
    const hasKmsKey = response.Attributes?.KmsMasterKeyId !== undefined;
    const hasSqsManagedSse = response.Attributes?.SqsManagedSseEnabled === 'true';

    expect(hasKmsKey || hasSqsManagedSse).toBe(true);
  });

  test('should be able to send and receive messages', async () => {
    const testMessage = 'Hello from LocalStack integration test!';
    const messageAttributes = {
      TestAttribute: {
        StringValue: 'test-value',
        DataType: 'String',
      },
    };

    // Send message
    const sendResponse = await sqsClient.send(
      new SendMessageCommand({
        QueueUrl: queueUrl,
        MessageBody: testMessage,
        MessageAttributes: messageAttributes,
      })
    );

    expect(sendResponse.MessageId).toBeDefined();

    // Receive message
    const receiveResponse = await sqsClient.send(
      new ReceiveMessageCommand({
        QueueUrl: queueUrl,
        MaxNumberOfMessages: 1,
        MessageAttributeNames: ['All'],
        WaitTimeSeconds: 5,
      })
    );

    expect(receiveResponse.Messages).toBeDefined();
    expect(receiveResponse.Messages).toHaveLength(1);
    expect(receiveResponse.Messages?.[0].Body).toBe(testMessage);
    expect(receiveResponse.Messages?.[0].MessageAttributes?.TestAttribute?.StringValue).toBe(
      'test-value'
    );
  });

  test('queue should have visibility timeout configured', async () => {
    const command = new GetQueueAttributesCommand({
      QueueUrl: queueUrl,
      AttributeNames: ['VisibilityTimeout'],
    });

    const response = await sqsClient.send(command);
    expect(response.Attributes?.VisibilityTimeout).toBeDefined();
    const visibilityTimeout = parseInt(response.Attributes?.VisibilityTimeout || '0', 10);
    expect(visibilityTimeout).toBeGreaterThan(0);
  });
});
