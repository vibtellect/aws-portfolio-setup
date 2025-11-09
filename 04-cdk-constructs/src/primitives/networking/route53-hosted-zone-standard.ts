import * as cdk from 'aws-cdk-lib';
import * as route53 from 'aws-cdk-lib/aws-route53';
import { Construct } from 'constructs';

/**
 * VPC configuration for private hosted zones
 */
export interface VpcConfig {
  /**
   * VPC ID
   */
  readonly vpcId: string;

  /**
   * VPC Region
   */
  readonly region: string;
}

/**
 * Properties for Route53HostedZoneStandard construct
 */
export interface Route53HostedZoneStandardProps {
  /**
   * The name of the domain (e.g., 'example.com')
   */
  readonly zoneName: string;

  /**
   * Comment to describe the hosted zone
   * @default - No comment
   */
  readonly comment?: string;

  /**
   * VPCs to associate with a private hosted zone
   * If provided, creates a private hosted zone
   * @default - Public hosted zone
   */
  readonly vpcs?: VpcConfig[];

  /**
   * Enable query logging
   * Requires queryLoggingLogGroupArn
   * @default false
   */
  readonly enableQueryLogging?: boolean;

  /**
   * CloudWatch Logs log group ARN for query logging
   * Required if enableQueryLogging is true
   * @default - No query logging
   */
  readonly queryLoggingLogGroupArn?: string;

  /**
   * Custom tags for the hosted zone
   * @default - ManagedBy: CDK, Construct: Route53HostedZoneStandard
   */
  readonly tags?: Record<string, string>;
}

/**
 * Route53 Hosted Zone with best practices
 *
 * Features:
 * - Public or Private hosted zones
 * - VPC association for private zones
 * - Query logging support
 * - Automatic tagging
 * - Name server exposure
 *
 * @example
 * ```typescript
 * // Public hosted zone
 * const zone = new Route53HostedZoneStandard(this, 'PublicZone', {
 *   zoneName: 'example.com',
 *   comment: 'Production DNS zone'
 * });
 *
 * // Private hosted zone
 * const privateZone = new Route53HostedZoneStandard(this, 'PrivateZone', {
 *   zoneName: 'internal.example.com',
 *   vpcs: [
 *     { vpcId: vpc.vpcId, region: this.region }
 *   ]
 * });
 *
 * // With query logging
 * const zone = new Route53HostedZoneStandard(this, 'Zone', {
 *   zoneName: 'example.com',
 *   enableQueryLogging: true,
 *   queryLoggingLogGroupArn: logGroup.logGroupArn
 * });
 * ```
 */
export class Route53HostedZoneStandard extends Construct {
  /**
   * The Route53 hosted zone
   */
  public readonly hostedZone: route53.IHostedZone;

  /**
   * The hosted zone ID
   */
  public readonly hostedZoneId: string;

  /**
   * The zone name
   */
  public readonly zoneName: string;

  /**
   * The name servers for this hosted zone
   */
  public readonly hostedZoneNameServers: string[];

  constructor(scope: Construct, id: string, props: Route53HostedZoneStandardProps) {
    super(scope, id);

    // Validate props
    this.validateProps(props);

    // Determine if private zone
    const isPrivate = props.vpcs && props.vpcs.length > 0;

    // Build VPCs array for private zone
    const vpcs = isPrivate
      ? props.vpcs!.map((vpc) => ({
          vpcId: vpc.vpcId,
          vpcRegion: vpc.region
        }))
      : undefined;

    // Create hosted zone config
    const hostedZoneConfig = props.comment
      ? { comment: props.comment }
      : undefined;

    // Normalize zone name - add trailing dot if not present
    const normalizedZoneName = props.zoneName.endsWith('.') ? props.zoneName : `${props.zoneName}.`;

    // Build query logging config
    const queryLoggingConfig = props.enableQueryLogging && props.queryLoggingLogGroupArn
      ? { cloudWatchLogsLogGroupArn: props.queryLoggingLogGroupArn }
      : undefined;

    // Create the L1 construct
    const cfnZone = new route53.CfnHostedZone(this, 'HostedZone', {
      name: normalizedZoneName,
      hostedZoneConfig,
      vpcs,
      queryLoggingConfig
    });

    // Apply tags using CDK Tags API
    const tagConfig: Record<string, string> = {
      'managed-by': 'aws-cdk',
      'construct': 'route53-hosted-zone-standard',
      ...(props.tags ?? {})
    };

    Object.entries(tagConfig).forEach(([key, value]) => {
      cdk.Tags.of(cfnZone).add(key, value);
    });

    // Create IHostedZone from CfnHostedZone
    this.hostedZone = route53.HostedZone.fromHostedZoneAttributes(this, 'IHostedZone', {
      hostedZoneId: cfnZone.ref,
      zoneName: props.zoneName
    });

    // Store outputs
    this.hostedZoneId = this.hostedZone.hostedZoneId;
    this.zoneName = props.zoneName;
    this.hostedZoneNameServers = cfnZone.attrNameServers;
  }

  /**
   * Validate construct properties
   */
  private validateProps(props: Route53HostedZoneStandardProps): void {
    // Validate zone name
    if (!props.zoneName || props.zoneName.trim().length === 0) {
      throw new Error(
        'Zone name cannot be empty. ' +
        'Provide a valid domain name (e.g., "example.com").'
      );
    }

    if (props.zoneName.length > 255) {
      throw new Error(
        `Zone name must be 255 characters or less. ` +
        `Got ${props.zoneName.length} characters.`
      );
    }

    // Validate comment length
    if (props.comment && props.comment.length > 256) {
      throw new Error(
        `Comment must be 256 characters or less. ` +
        `Got ${props.comment.length} characters.`
      );
    }

    // Validate query logging configuration
    if (props.enableQueryLogging && !props.queryLoggingLogGroupArn) {
      throw new Error(
        'When enableQueryLogging is true, query logging log group ARN must be provided. ' +
        'Use the queryLoggingLogGroupArn property to specify a CloudWatch Logs log group ARN.'
      );
    }

    // Validate log group ARN format and region
    if (props.queryLoggingLogGroupArn) {
      const arnPattern = /^arn:aws:logs:([a-z0-9-]+):\d{12}:log-group:.+$/;
      if (!arnPattern.test(props.queryLoggingLogGroupArn)) {
        throw new Error(
          `Invalid log group ARN format. ` +
          `Expected format: arn:aws:logs:region:account-id:log-group:log-group-name. ` +
          `Got: ${props.queryLoggingLogGroupArn}`
        );
      }

      // Route 53 query logging requires log group in us-east-1
      const arnRegion = props.queryLoggingLogGroupArn.match(arnPattern)![1];
      if (arnRegion !== 'us-east-1') {
        throw new Error(
          `Route 53 query logging requires CloudWatch log group in us-east-1. ` +
          `Detected region: ${arnRegion}.`
        );
      }
    }

    // Validate query logging is only for public zones
    if (props.enableQueryLogging && props.vpcs && props.vpcs.length > 0) {
      throw new Error(
        'Query logging is only supported for public hosted zones. ' +
        'Remove VPC associations if enableQueryLogging is true.'
      );
    }
  }
}
