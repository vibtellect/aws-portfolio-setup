/**
 * Integration tests for S3BucketSecure construct with LocalStack
 *
 * These tests deploy actual resources to LocalStack and verify their behavior.
 */

import { describe, test, beforeAll, afterAll, expect } from '@jest/globals';
import {
  S3Client,
  HeadBucketCommand,
  PutObjectCommand,
  GetObjectCommand,
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
  GetPublicAccessBlockCommand,
} from '@aws-sdk/client-s3';
import { S3BucketSecure } from '../../../../src/primitives/storage/s3-bucket-secure';
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

describe('S3BucketSecure - LocalStack Integration', () => {
  const stackName = generateTestResourceName('S3BucketSecureTest');
  const bucketName = generateTestResourceName('test-bucket');
  let s3Client: S3Client;
  let deployedBucketName: string;

  beforeAll(async () => {
    // Wait for LocalStack to be ready
    await waitForLocalStack();

    // Check if S3 service is available
    const s3Available = await isServiceAvailable('s3');
    if (!s3Available) {
      throw new Error('S3 service is not available in LocalStack');
    }

    // Create S3 client
    s3Client = new S3Client(localstackConfig);

    // Create and deploy stack
    const app = createTestApp();
    const stack = createTestStack(app, stackName);

    const bucket = new S3BucketSecure(stack, 'TestBucket', {
      bucketName,
    });

    addOutput(stack, 'BucketName', bucket.bucketName, 'The name of the S3 bucket');
    addOutput(stack, 'BucketArn', bucket.bucketArn, 'The ARN of the S3 bucket');

    // Deploy to LocalStack
    const result = await deployStack(stack, stackName);
    deployedBucketName = result.outputs.BucketName || bucketName;

    console.log(`Deployed bucket: ${deployedBucketName}`);
  }, 120000); // 2 minute timeout for deployment

  afterAll(async () => {
    // Clean up - destroy stack
    await destroyStack(stackName);
    s3Client.destroy();
  }, 60000);

  test('bucket should exist and be accessible', async () => {
    const command = new HeadBucketCommand({
      Bucket: deployedBucketName,
    });

    await expect(s3Client.send(command)).resolves.toBeDefined();
  });

  test('bucket should have encryption enabled', async () => {
    const command = new GetBucketEncryptionCommand({
      Bucket: deployedBucketName,
    });

    const response = await s3Client.send(command);
    expect(response.ServerSideEncryptionConfiguration).toBeDefined();
    expect(response.ServerSideEncryptionConfiguration?.Rules).toHaveLength(1);
    expect(
      response.ServerSideEncryptionConfiguration?.Rules?.[0]
        .ApplyServerSideEncryptionByDefault?.SSEAlgorithm
    ).toBe('AES256');
  });

  test('bucket should have versioning enabled', async () => {
    const command = new GetBucketVersioningCommand({
      Bucket: deployedBucketName,
    });

    const response = await s3Client.send(command);
    expect(response.Status).toBe('Enabled');
  });

  test('bucket should block public access', async () => {
    const command = new GetPublicAccessBlockCommand({
      Bucket: deployedBucketName,
    });

    const response = await s3Client.send(command);
    expect(response.PublicAccessBlockConfiguration).toBeDefined();
    expect(response.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
    expect(response.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
    expect(response.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
    expect(response.PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);
  });

  test('should be able to put and get objects', async () => {
    const testKey = 'test-object.txt';
    const testContent = 'Hello from LocalStack integration test!';

    // Put object
    await s3Client.send(
      new PutObjectCommand({
        Bucket: deployedBucketName,
        Key: testKey,
        Body: testContent,
      })
    );

    // Get object
    const getResponse = await s3Client.send(
      new GetObjectCommand({
        Bucket: deployedBucketName,
        Key: testKey,
      })
    );

    const retrievedContent = await getResponse.Body?.transformToString();
    expect(retrievedContent).toBe(testContent);
  });
});
