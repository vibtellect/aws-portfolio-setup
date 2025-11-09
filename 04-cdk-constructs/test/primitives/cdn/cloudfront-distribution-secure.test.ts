import { describe, test, beforeEach, expect } from '@jest/globals';
import { App, Stack, RemovalPolicy, Duration } from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import { CloudFrontDistributionSecure } from '../../../src/primitives/cdn/cloudfront-distribution-secure';

describe('CloudFrontDistributionSecure', () => {
  let app: App;
  let stack: Stack;
  let bucket: s3.Bucket;

  beforeEach(() => {
    app = new App();
    stack = new Stack(app, 'TestStack', {
      env: { region: 'us-east-1', account: '123456789012' },
    });
    bucket = new s3.Bucket(stack, 'TestBucket');
  });

  // ============================================================================
  // Basic Creation Tests
  // ============================================================================

  test('creates CloudFront distribution with default settings', () => {
    new CloudFrontDistributionSecure(stack, 'TestDistribution', {
      originBucket: bucket,
    });

    const template = Template.fromStack(stack);
    template.resourceCountIs('AWS::CloudFront::Distribution', 1);
  });

  test('uses custom comment when provided', () => {
    new CloudFrontDistributionSecure(stack, 'TestDistribution', {
      originBucket: bucket,
      comment: 'My test distribution',
    });

    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: {
        Comment: 'My test distribution',
      },
    });
  });

  test('provides distribution ID and domain name outputs', () => {
    const distribution = new CloudFrontDistributionSecure(stack, 'TestDistribution', {
      originBucket: bucket,
    });

    expect(distribution.distribution).toBeDefined();
    expect(distribution.distributionId).toBeDefined();
    expect(distribution.distributionDomainName).toBeDefined();
  });

  // ============================================================================
  // Origin Configuration Tests
  // ============================================================================

  test('creates Origin Access Identity for S3 bucket', () => {
    new CloudFrontDistributionSecure(stack, 'TestDistribution', {
      originBucket: bucket,
    });

    const template = Template.fromStack(stack);
    template.resourceCountIs('AWS::CloudFront::CloudFrontOriginAccessIdentity', 1);
  });

  test('uses custom origin path when provided', () => {
    new CloudFrontDistributionSecure(stack, 'TestDistribution', {
      originBucket: bucket,
      originPath: '/static',
    });

    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: {
        Origins: [
          Match.objectLike({
            OriginPath: '/static',
          }),
        ],
      },
    });
  });

  test('grants OAI read permissions to S3 bucket', () => {
    new CloudFrontDistributionSecure(stack, 'TestDistribution', {
      originBucket: bucket,
    });

    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::S3::BucketPolicy', {
      PolicyDocument: {
        Statement: Match.arrayWith([
          Match.objectLike({
            Effect: 'Allow',
            Action: 's3:GetObject', // Can be string or array
          }),
        ]),
      },
    });
  });

  // ============================================================================
  // Security Tests
  // ============================================================================

  test('enforces HTTPS only by default', () => {
    new CloudFrontDistributionSecure(stack, 'TestDistribution', {
      originBucket: bucket,
    });

    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: {
        DefaultCacheBehavior: {
          ViewerProtocolPolicy: 'redirect-to-https',
        },
      },
    });
  });

  test('uses CloudFront default certificate when no custom certificate provided', () => {
    new CloudFrontDistributionSecure(stack, 'TestDistribution', {
      originBucket: bucket,
    });

    const template = Template.fromStack(stack);
    const json = template.toJSON();
    const distribution = Object.values(json.Resources).find(
      (r: any) => r.Type === 'AWS::CloudFront::Distribution'
    ) as any;

    // When no certificate is provided, CDK doesn't set ViewerCertificate property
    // CloudFront uses its default certificate in this case
    expect(distribution.Properties.DistributionConfig.ViewerCertificate).toBeUndefined();
  });

  test('supports custom certificate when provided', () => {
    const certificate = acm.Certificate.fromCertificateArn(
      stack,
      'Certificate',
      'arn:aws:acm:us-east-1:123456789012:certificate/12345678-1234-1234-1234-123456789012'
    );

    new CloudFrontDistributionSecure(stack, 'TestDistribution', {
      originBucket: bucket,
      certificate,
      domainNames: ['example.com'],
    });

    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: {
        Aliases: ['example.com'],
        ViewerCertificate: {
          AcmCertificateArn: 'arn:aws:acm:us-east-1:123456789012:certificate/12345678-1234-1234-1234-123456789012',
          SslSupportMethod: 'sni-only',
          MinimumProtocolVersion: 'TLSv1.2_2021',
        },
      },
    });
  });

  test('throws error when certificate provided without domain names', () => {
    const certificate = acm.Certificate.fromCertificateArn(
      stack,
      'Certificate',
      'arn:aws:acm:us-east-1:123456789012:certificate/12345678-1234-1234-1234-123456789012'
    );

    expect(() => {
      new CloudFrontDistributionSecure(stack, 'TestDistribution', {
        originBucket: bucket,
        certificate,
      });
    }).toThrow(/domain names must be provided/i);
  });

  // ============================================================================
  // Caching & Performance Tests
  // ============================================================================

  test('uses CachingOptimized policy by default', () => {
    new CloudFrontDistributionSecure(stack, 'TestDistribution', {
      originBucket: bucket,
    });

    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: {
        DefaultCacheBehavior: {
          CachePolicyId: '658327ea-f89d-4fab-a63d-7e88639e58f6', // CachingOptimized
        },
      },
    });
  });

  test('uses PriceClass 100 by default for cost optimization', () => {
    new CloudFrontDistributionSecure(stack, 'TestDistribution', {
      originBucket: bucket,
    });

    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: {
        PriceClass: 'PriceClass_100',
      },
    });
  });

  test('allows custom price class', () => {
    new CloudFrontDistributionSecure(stack, 'TestDistribution', {
      originBucket: bucket,
      priceClass: cloudfront.PriceClass.PRICE_CLASS_ALL,
    });

    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: {
        PriceClass: 'PriceClass_All',
      },
    });
  });

  test('enables IPv6 by default', () => {
    new CloudFrontDistributionSecure(stack, 'TestDistribution', {
      originBucket: bucket,
    });

    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: {
        IPV6Enabled: true,
      },
    });
  });

  test('allows disabling IPv6', () => {
    new CloudFrontDistributionSecure(stack, 'TestDistribution', {
      originBucket: bucket,
      enableIpv6: false,
    });

    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: {
        IPV6Enabled: false,
      },
    });
  });

  // ============================================================================
  // Default Root Object & Error Pages
  // ============================================================================

  test('uses index.html as default root object', () => {
    new CloudFrontDistributionSecure(stack, 'TestDistribution', {
      originBucket: bucket,
    });

    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: {
        DefaultRootObject: 'index.html',
      },
    });
  });

  test('allows custom default root object', () => {
    new CloudFrontDistributionSecure(stack, 'TestDistribution', {
      originBucket: bucket,
      defaultRootObject: 'home.html',
    });

    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: {
        DefaultRootObject: 'home.html',
      },
    });
  });

  test('configures custom error responses when provided', () => {
    new CloudFrontDistributionSecure(stack, 'TestDistribution', {
      originBucket: bucket,
      errorResponses: [
        {
          httpStatus: 404,
          responsePagePath: '/404.html',
          responseHttpStatus: 404,
          ttl: Duration.minutes(5),
        },
      ],
    });

    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: {
        CustomErrorResponses: [
          {
            ErrorCode: 404,
            ResponseCode: 404,
            ResponsePagePath: '/404.html',
            ErrorCachingMinTTL: 300,
          },
        ],
      },
    });
  });

  // ============================================================================
  // Logging Tests
  // ============================================================================

  test('enables logging when log bucket provided', () => {
    const logBucket = new s3.Bucket(stack, 'LogBucket');

    new CloudFrontDistributionSecure(stack, 'TestDistribution', {
      originBucket: bucket,
      enableLogging: true,
      logBucket,
    });

    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: {
        Logging: {
          Bucket: Match.anyValue(),
        },
      },
    });
  });

  test('does not enable logging by default', () => {
    new CloudFrontDistributionSecure(stack, 'TestDistribution', {
      originBucket: bucket,
    });

    const template = Template.fromStack(stack);
    const distribution = template.findResources('AWS::CloudFront::Distribution');
    const config = Object.values(distribution)[0].Properties.DistributionConfig;
    expect(config.Logging).toBeUndefined();
  });

  test('throws error when logging enabled without log bucket', () => {
    expect(() => {
      new CloudFrontDistributionSecure(stack, 'TestDistribution', {
        originBucket: bucket,
        enableLogging: true,
      });
    }).toThrow(/log bucket must be provided/i);
  });

  // ============================================================================
  // WAF & Geo-Restriction Tests
  // ============================================================================

  test('allows WAF web ACL association', () => {
    new CloudFrontDistributionSecure(stack, 'TestDistribution', {
      originBucket: bucket,
      webAclId: 'arn:aws:wafv2:us-east-1:123456789012:global/webacl/test/a1234567-890a-bcde-f123-456789abcdef',
    });

    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: {
        WebACLId: 'arn:aws:wafv2:us-east-1:123456789012:global/webacl/test/a1234567-890a-bcde-f123-456789abcdef',
      },
    });
  });

  test('allows geo-restriction configuration', () => {
    new CloudFrontDistributionSecure(stack, 'TestDistribution', {
      originBucket: bucket,
      geoRestriction: cloudfront.GeoRestriction.allowlist('US', 'CA', 'GB'),
    });

    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: {
        Restrictions: {
          GeoRestriction: {
            RestrictionType: 'whitelist',
            Locations: ['US', 'CA', 'GB'],
          },
        },
      },
    });
  });

  // ============================================================================
  // Removal Policy & Tags
  // ============================================================================

  test('uses DESTROY removal policy for dev stacks', () => {
    const devStack = new Stack(app, 'DevStack', {
      stackName: 'my-dev-stack',
    });
    const devBucket = new s3.Bucket(devStack, 'Bucket');

    new CloudFrontDistributionSecure(devStack, 'Distribution', {
      originBucket: devBucket,
    });

    const template = Template.fromStack(devStack);
    const distribution = template.findResources('AWS::CloudFront::Distribution');
    const resource = Object.values(distribution)[0];
    expect(resource.DeletionPolicy).toBe('Delete'); // Dev stacks use Delete policy for cleanup
  });

  test('uses RETAIN removal policy for production stacks', () => {
    const prodStack = new Stack(app, 'ProdStack', {
      stackName: 'my-production-stack',
    });
    const prodBucket = new s3.Bucket(prodStack, 'Bucket');

    new CloudFrontDistributionSecure(prodStack, 'Distribution', {
      originBucket: prodBucket,
    });

    const template = Template.fromStack(prodStack);
    const distribution = template.findResources('AWS::CloudFront::Distribution');
    const resource = Object.values(distribution)[0];
    expect(resource.DeletionPolicy).toBe('Retain'); // Production stacks use Retain policy for safety
  });

  test('adds managed-by and construct tags', () => {
    new CloudFrontDistributionSecure(stack, 'TestDistribution', {
      originBucket: bucket,
    });

    const template = Template.fromStack(stack);
    const json = template.toJSON();
    const distribution = Object.values(json.Resources).find(
      (r: any) => r.Type === 'AWS::CloudFront::Distribution'
    ) as any;

    const tags = distribution.Properties.Tags;
    const tagMap = Object.fromEntries(tags.map((t: any) => [t.Key, t.Value]));

    // Check that default tags are present
    expect(tagMap['ManagedBy']).toBe('CDK');
    expect(tagMap['Construct']).toBe('CloudFrontDistributionSecure');
  });

  test('allows custom tags', () => {
    new CloudFrontDistributionSecure(stack, 'TestDistribution', {
      originBucket: bucket,
      tags: {
        Environment: 'test',
        Project: 'my-project',
      },
    });

    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::CloudFront::Distribution', {
      Tags: Match.arrayWith([
        { Key: 'Environment', Value: 'test' },
        { Key: 'Project', Value: 'my-project' },
      ]),
    });
  });

  // ============================================================================
  // Validation Tests
  // ============================================================================

  test('throws error when domain names provided without certificate', () => {
    expect(() => {
      new CloudFrontDistributionSecure(stack, 'TestDistribution', {
        originBucket: bucket,
        domainNames: ['example.com'],
      });
    }).toThrow(/certificate must be provided/i);
  });

  test('throws error for invalid comment length', () => {
    const longComment = 'a'.repeat(300);

    expect(() => {
      new CloudFrontDistributionSecure(stack, 'TestDistribution', {
        originBucket: bucket,
        comment: longComment,
      });
    }).toThrow(/comment must be 128 characters or less/i);
  });

  test('throws error for too many domain names', () => {
    const certificate = acm.Certificate.fromCertificateArn(
      stack,
      'Certificate',
      'arn:aws:acm:us-east-1:123456789012:certificate/12345678-1234-1234-1234-123456789012'
    );
    const manyDomains = Array.from({ length: 150 }, (_, i) => `domain${i}.example.com`);

    expect(() => {
      new CloudFrontDistributionSecure(stack, 'TestDistribution', {
        originBucket: bucket,
        certificate,
        domainNames: manyDomains,
      });
    }).toThrow(/maximum of 100 domain names/i);
  });
});
