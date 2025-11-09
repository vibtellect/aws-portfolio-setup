import * as cdk from 'aws-cdk-lib';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import { Construct } from 'constructs';

/**
 * Properties for CloudFrontDistributionSecure construct
 */
export interface CloudFrontDistributionSecureProps {
  /**
   * The S3 bucket to use as the origin
   */
  readonly originBucket: s3.IBucket;

  /**
   * Optional origin path (e.g., '/static')
   * @default - No origin path
   */
  readonly originPath?: string;

  /**
   * Comment to describe the distribution
   * @default - No comment
   */
  readonly comment?: string;

  /**
   * SSL/TLS certificate for custom domain names
   * Required if domainNames is provided
   * @default - No certificate (uses CloudFront default certificate)
   */
  readonly certificate?: acm.ICertificate;

  /**
   * Custom domain names (CNAMEs) for the distribution
   * Requires certificate to be provided
   * @default - No custom domain names
   */
  readonly domainNames?: string[];

  /**
   * Minimum TLS protocol version
   * @default TLSv1.2_2021
   */
  readonly minimumProtocolVersion?: cloudfront.SecurityPolicyProtocol;

  /**
   * Price class for the distribution (affects edge locations used)
   * @default PriceClass.PRICE_CLASS_100 (US, Canada, Europe)
   */
  readonly priceClass?: cloudfront.PriceClass;

  /**
   * Enable IPv6
   * @default true
   */
  readonly enableIpv6?: boolean;

  /**
   * Default root object (e.g., 'index.html')
   * @default 'index.html'
   */
  readonly defaultRootObject?: string;

  /**
   * Custom error responses
   * @default - No custom error responses
   */
  readonly errorResponses?: cloudfront.ErrorResponse[];

  /**
   * Enable access logging
   * @default false
   */
  readonly enableLogging?: boolean;

  /**
   * S3 bucket for access logs
   * Required if enableLogging is true
   * @default - No logging
   */
  readonly logBucket?: s3.IBucket;

  /**
   * Prefix for log files in the log bucket
   * @default - No prefix
   */
  readonly logFilePrefix?: string;

  /**
   * WAF Web ACL ID to associate with the distribution
   * @default - No WAF
   */
  readonly webAclId?: string;

  /**
   * Geo-restriction configuration
   * @default - No geo-restrictions
   */
  readonly geoRestriction?: cloudfront.GeoRestriction;

  /**
   * Custom cache policy
   * @default - CachingOptimized managed policy
   */
  readonly cachePolicy?: cloudfront.ICachePolicy;

  /**
   * Removal policy for the distribution
   * @default - Auto-detect based on stack name (dev=DESTROY, prod=RETAIN)
   */
  readonly removalPolicy?: cdk.RemovalPolicy;

  /**
   * Custom tags for the distribution
   * @default - ManagedBy: CDK, Construct: CloudFrontDistributionSecure
   */
  readonly tags?: Record<string, string>;
}

/**
 * CloudFront Distribution with security best practices and S3 origin
 *
 * Features:
 * - Origin Access Identity (OAI) for secure S3 access
 * - HTTPS-only by default (redirect-to-https)
 * - Minimum TLS v1.2
 * - Block all public access to origin bucket
 * - Cost-optimized price class (PriceClass_100)
 * - Optional custom domain names with ACM certificate
 * - Optional CloudWatch logging
 * - Optional WAF integration
 * - Optional geo-restrictions
 *
 * @example
 * ```typescript
 * const bucket = new S3BucketSecure(this, 'WebsiteBucket', {
 *   bucketName: 'my-website',
 * });
 *
 * const distribution = new CloudFrontDistributionSecure(this, 'Distribution', {
 *   originBucket: bucket.bucket,
 *   comment: 'My website CDN',
 * });
 *
 * // With custom domain
 * const certificate = acm.Certificate.fromCertificateArn(
 *   this,
 *   'Certificate',
 *   'arn:aws:acm:us-east-1:123456789012:certificate/...'
 * );
 *
 * const distribution = new CloudFrontDistributionSecure(this, 'Distribution', {
 *   originBucket: bucket.bucket,
 *   certificate,
 *   domainNames: ['www.example.com'],
 * });
 * ```
 */
export class CloudFrontDistributionSecure extends Construct {
  /**
   * The CloudFront distribution
   */
  public readonly distribution: cloudfront.Distribution;

  /**
   * The distribution ID
   */
  public readonly distributionId: string;

  /**
   * The distribution domain name (e.g., d111111abcdef8.cloudfront.net)
   */
  public readonly distributionDomainName: string;

  /**
   * The Origin Access Identity used for S3 access
   */
  public readonly originAccessIdentity: cloudfront.OriginAccessIdentity;

  constructor(scope: Construct, id: string, props: CloudFrontDistributionSecureProps) {
    super(scope, id);

    // Validate props
    this.validateProps(props);

    // Create Origin Access Identity for secure S3 access
    this.originAccessIdentity = new cloudfront.OriginAccessIdentity(this, 'OAI', {
      comment: `OAI for ${id}`,
    });

    // Configure logging
    const loggingConfig = this.configureLogging(props);

    // Create the CloudFront distribution
    this.distribution = new cloudfront.Distribution(this, 'Distribution', {
      comment: props.comment,
      defaultRootObject: props.defaultRootObject ?? 'index.html',

      // Origin configuration
      defaultBehavior: {
        origin: new origins.S3Origin(props.originBucket, {
          originPath: props.originPath,
          originAccessIdentity: this.originAccessIdentity,
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: props.cachePolicy ?? cloudfront.CachePolicy.CACHING_OPTIMIZED,
        compress: true,
      },

      // Security (Certificate)
      certificate: props.certificate,
      domainNames: props.domainNames,
      minimumProtocolVersion: props.minimumProtocolVersion ?? cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,

      // Performance & Cost
      priceClass: props.priceClass ?? cloudfront.PriceClass.PRICE_CLASS_100,
      enableIpv6: props.enableIpv6 ?? true,

      // Error handling
      errorResponses: props.errorResponses,

      // Logging
      enableLogging: props.enableLogging ?? false,
      logBucket: loggingConfig?.logBucket,
      logFilePrefix: loggingConfig?.logFilePrefix,

      // WAF & Restrictions
      webAclId: props.webAclId,
      geoRestriction: props.geoRestriction,
    });

    // Store outputs
    this.distributionId = this.distribution.distributionId;
    this.distributionDomainName = this.distribution.distributionDomainName;

    // Apply tags
    this.applyTags(props);

    // Apply removal policy
    const removalPolicy = props.removalPolicy ?? this.determineRemovalPolicy();
    this.distribution.applyRemovalPolicy(removalPolicy);
    cdk.Tags.of(this.distribution).add('RemovalPolicy', removalPolicy.toString());
  }

  /**
   * Validate construct properties
   */
  private validateProps(props: CloudFrontDistributionSecureProps): void {
    // Validate comment length
    if (props.comment && props.comment.length > 128) {
      throw new Error(
        `CloudFront distribution comment must be 128 characters or less. ` +
        `Got ${props.comment.length} characters.`
      );
    }

    // Validate certificate and domain names
    if (props.certificate && (!props.domainNames || props.domainNames.length === 0)) {
      throw new Error(
        'When providing a certificate, domain names must be provided. ' +
        'Use the domainNames property to specify custom domain names.'
      );
    }

    if (props.domainNames && props.domainNames.length > 0 && !props.certificate) {
      throw new Error(
        'When providing domain names, a certificate must be provided. ' +
        'Use the certificate property to specify an ACM certificate.'
      );
    }

    // Validate domain names count
    if (props.domainNames && props.domainNames.length > 100) {
      throw new Error(
        `CloudFront distribution supports a maximum of 100 domain names. ` +
        `Got ${props.domainNames.length} domain names.`
      );
    }

    // Validate logging configuration
    if (props.enableLogging && !props.logBucket) {
      throw new Error(
        'When enableLogging is true, a log bucket must be provided. ' +
        'Use the logBucket property to specify an S3 bucket for logs.'
      );
    }
  }

  /**
   * Configure logging
   */
  private configureLogging(
    props: CloudFrontDistributionSecureProps
  ): { logBucket: s3.IBucket; logFilePrefix?: string } | undefined {
    if (props.enableLogging && props.logBucket) {
      return {
        logBucket: props.logBucket,
        logFilePrefix: props.logFilePrefix,
      };
    }
    return undefined;
  }

  /**
   * Apply tags to the distribution
   */
  private applyTags(props: CloudFrontDistributionSecureProps): void {
    // Apply default tags
    cdk.Tags.of(this.distribution).add('ManagedBy', 'CDK');
    cdk.Tags.of(this.distribution).add('Construct', 'CloudFrontDistributionSecure');

    // Apply custom tags
    if (props.tags) {
      Object.entries(props.tags).forEach(([key, value]) => {
        cdk.Tags.of(this.distribution).add(key, value);
      });
    }
  }

  /**
   * Determine removal policy based on stack name
   */
  private determineRemovalPolicy(): cdk.RemovalPolicy {
    const stackName = cdk.Stack.of(this).stackName.toLowerCase();
    if (stackName.includes('prod') || stackName.includes('production')) {
      return cdk.RemovalPolicy.RETAIN;
    }
    return cdk.RemovalPolicy.DESTROY;
  }
}
