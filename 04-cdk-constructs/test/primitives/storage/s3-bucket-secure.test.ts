import { describe, test, beforeEach, expect } from '@jest/globals';
import { App, Stack, RemovalPolicy } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { S3BucketSecure } from '../../../src/primitives/storage/s3-bucket-secure';

describe('S3BucketSecure', () => {
  let app: App;
  let stack: Stack;

  beforeEach(() => {
    app = new App();
    stack = new Stack(app, 'TestStack');
  });

  test('creates S3 bucket with secure defaults', () => {
    new S3BucketSecure(stack, 'TestBucket');

    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::S3::Bucket', {
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true,
      },
    });
  });

  test('enables encryption by default', () => {
    new S3BucketSecure(stack, 'TestBucket');

    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::S3::Bucket', {
      BucketEncryption: {
        ServerSideEncryptionConfiguration: [
          {
            ServerSideEncryptionByDefault: {
              SSEAlgorithm: 'AES256',
            },
          },
        ],
      },
    });
  });

  test('enables versioning by default', () => {
    new S3BucketSecure(stack, 'TestBucket');

    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::S3::Bucket', {
      VersioningConfiguration: {
        Status: 'Enabled',
      },
    });
  });

  test('allows disabling versioning', () => {
    new S3BucketSecure(stack, 'TestBucket', {
      versioned: false,
    });

    const template = Template.fromStack(stack);
    const resources = template.findResources('AWS::S3::Bucket');
    const bucket = Object.values(resources)[0];
    expect(bucket.Properties.VersioningConfiguration).toBeUndefined();
  });

  test('uses custom bucket name when provided', () => {
    new S3BucketSecure(stack, 'TestBucket', {
      bucketName: 'my-custom-bucket',
    });

    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::S3::Bucket', {
      BucketName: 'my-custom-bucket',
    });
  });

  test('uses DESTROY removal policy for dev stacks', () => {
    const devStack = new Stack(app, 'DevStack', {
      stackName: 'dev-stack',
    });

    new S3BucketSecure(devStack, 'TestBucket');

    const template = Template.fromStack(devStack);
    template.hasResource('AWS::S3::Bucket', {
      DeletionPolicy: 'Delete',
      UpdateReplacePolicy: 'Delete',
    });
  });

  test('uses RETAIN removal policy for production stacks', () => {
    const prodStack = new Stack(app, 'ProdStack', {
      stackName: 'production-stack',
    });

    new S3BucketSecure(prodStack, 'TestBucket');

    const template = Template.fromStack(prodStack);
    template.hasResource('AWS::S3::Bucket', {
      DeletionPolicy: 'Retain',
      UpdateReplacePolicy: 'Retain',
    });
  });

  test('provides bucket, bucketArn, and bucketName outputs', () => {
    const construct = new S3BucketSecure(stack, 'TestBucket');

    expect(construct.bucket).toBeDefined();
    expect(construct.bucketArn).toBeDefined();
    expect(construct.bucketName).toBeDefined();
  });

  test('enables website hosting when configured', () => {
    new S3BucketSecure(stack, 'TestBucket', {
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'error.html',
    });

    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::S3::Bucket', {
      WebsiteConfiguration: {
        IndexDocument: 'index.html',
        ErrorDocument: 'error.html',
      },
    });
  });

  test('applies managed-by and construct tags', () => {
    new S3BucketSecure(stack, 'TestBucket');

    const template = Template.fromStack(stack);
    const resources = template.findResources('AWS::S3::Bucket');
    const bucket = Object.values(resources)[0];

    expect(bucket.Properties.Tags).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ Key: 'ManagedBy', Value: 'CDK' }),
        expect.objectContaining({ Key: 'Construct', Value: 'S3BucketSecure' }),
      ])
    );
  });
});
