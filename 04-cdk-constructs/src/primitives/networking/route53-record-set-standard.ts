import * as cdk from 'aws-cdk-lib';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import { Construct } from 'constructs';

// Re-export targets for convenience
export { targets };

/**
 * Geolocation configuration for routing
 */
export interface GeoLocation {
  /**
   * Continent code (e.g., 'EU', 'NA', 'AS')
   */
  readonly continentCode?: string;

  /**
   * Country code (e.g., 'DE', 'US', 'FR')
   */
  readonly countryCode?: string;

  /**
   * Subdivision code (US states)
   */
  readonly subdivisionCode?: string;
}

/**
 * Properties for Route53RecordSetStandard construct
 */
export interface Route53RecordSetStandardProps {
  /**
   * The hosted zone in which to create the record
   */
  readonly hostedZone: route53.IHostedZone;

  /**
   * The record name (e.g., 'www.example.com')
   */
  readonly recordName: string;

  /**
   * The record type (A, AAAA, CNAME, etc.)
   */
  readonly recordType: route53.RecordType;

  /**
   * The target for this record
   */
  readonly target: route53.RecordTarget;

  /**
   * The TTL (Time To Live) for this record
   * @default Duration.seconds(300) - 5 minutes
   */
  readonly ttl?: cdk.Duration;

  /**
   * Comment to describe the record
   * @default - No comment
   */
  readonly comment?: string;

  /**
   * Weight for weighted routing policy (0-255)
   * Requires setIdentifier
   * @default - No weighted routing
   */
  readonly weight?: number;

  /**
   * Failover type for failover routing policy
   * Requires setIdentifier
   * @default - No failover routing
   */
  readonly failover?: 'PRIMARY' | 'SECONDARY';

  /**
   * Geolocation for geolocation routing policy
   * Requires setIdentifier
   * @default - No geolocation routing
   */
  readonly geoLocation?: GeoLocation;

  /**
   * Region for latency-based routing policy
   * Requires setIdentifier
   * @default - No latency-based routing
   */
  readonly region?: string;

  /**
   * Set identifier for routing policies
   * Required when using weight, failover, geoLocation, or region
   * @default - No set identifier (simple routing)
   */
  readonly setIdentifier?: string;
}

/**
 * Route53 Record Set with routing policies support
 *
 * Features:
 * - All record types (A, AAAA, CNAME, MX, TXT, etc.)
 * - Simple routing
 * - Weighted routing
 * - Failover routing (PRIMARY/SECONDARY)
 * - Geolocation routing
 * - Latency-based routing
 * - Alias records support
 *
 * @example
 * ```typescript
 * // Simple A record
 * new Route53RecordSetStandard(this, 'ARecord', {
 *   hostedZone: zone.hostedZone,
 *   recordName: 'www.example.com',
 *   recordType: route53.RecordType.A,
 *   target: route53.RecordTarget.fromIpAddresses('192.0.2.1')
 * });
 *
 * // Weighted routing
 * new Route53RecordSetStandard(this, 'WeightedRecord1', {
 *   hostedZone: zone.hostedZone,
 *   recordName: 'www.example.com',
 *   recordType: route53.RecordType.A,
 *   target: route53.RecordTarget.fromIpAddresses('192.0.2.1'),
 *   weight: 70,
 *   setIdentifier: 'server1'
 * });
 *
 * // Failover routing
 * new Route53RecordSetStandard(this, 'Primary', {
 *   hostedZone: zone.hostedZone,
 *   recordName: 'www.example.com',
 *   recordType: route53.RecordType.A,
 *   target: route53.RecordTarget.fromIpAddresses('192.0.2.1'),
 *   failover: 'PRIMARY',
 *   setIdentifier: 'primary'
 * });
 *
 * // CloudFront alias
 * new Route53RecordSetStandard(this, 'CloudFrontAlias', {
 *   hostedZone: zone.hostedZone,
 *   recordName: 'www.example.com',
 *   recordType: route53.RecordType.A,
 *   target: route53.RecordTarget.fromAlias(
 *     new route53.targets.CloudFrontTarget(distribution)
 *   )
 * });
 * ```
 */
export class Route53RecordSetStandard extends Construct {
  /**
   * The record name
   */
  public readonly recordName: string;

  /**
   * The record type
   */
  public readonly recordType: route53.RecordType;

  /**
   * The Route53 record
   */
  public readonly record: route53.RecordSet;

  constructor(scope: Construct, id: string, props: Route53RecordSetStandardProps) {
    super(scope, id);

    // Validate props
    this.validateProps(props);

    // Store outputs
    this.recordName = props.recordName;
    this.recordType = props.recordType;

    // Use CfnRecordSet for failover routing (not supported by L2 RecordSet)
    if (props.failover) {
      this.record = this.createCfnRecordSet(props);
    } else {
      // Use L2 RecordSet for other routing types
      this.record = new route53.RecordSet(this, 'RecordSet', {
        zone: props.hostedZone,
        recordName: props.recordName,
        recordType: props.recordType,
        target: props.target,
        ttl: props.ttl ?? cdk.Duration.seconds(300),
        comment: props.comment,
        weight: props.weight,
        setIdentifier: props.setIdentifier,
        ...this.buildRoutingConfig(props)
      });
    }
  }

  /**
   * Create CfnRecordSet for failover routing
   */
  private createCfnRecordSet(props: Route53RecordSetStandardProps): route53.RecordSet {
    // Create a temporary stack and record to extract the target configuration
    const tempRecord = new route53.RecordSet(this, 'TempRecordSet', {
      zone: props.hostedZone,
      recordName: props.recordName,
      recordType: props.recordType,
      target: props.target,
      ttl: props.ttl ?? cdk.Duration.seconds(300)
    });

    // Extract the values from the temporary record's CloudFormation representation
    const cfnTemp = tempRecord.node.defaultChild as route53.CfnRecordSet;

    // Normalize record name - add trailing dot if not present
    const normalizedName = props.recordName.endsWith('.') ? props.recordName : `${props.recordName}.`;

    // Now create the actual record with failover
    const cfnRecord = new route53.CfnRecordSet(this, 'RecordSet', {
      hostedZoneId: props.hostedZone.hostedZoneId,
      name: normalizedName,
      type: props.recordType.toString(),
      ttl: cfnTemp.ttl,
      comment: props.comment,
      resourceRecords: cfnTemp.resourceRecords,
      aliasTarget: cfnTemp.aliasTarget,
      setIdentifier: props.setIdentifier,
      failover: props.failover,
      weight: props.weight,
      ...this.buildCfnRoutingConfig(props)
    });

    // Remove the temporary record
    this.node.tryRemoveChild(tempRecord.node.id);

    // Return as IRecordSet-compatible object
    return cfnRecord as any as route53.RecordSet;
  }

  /**
   * Build routing configuration for CfnRecordSet
   */
  private buildCfnRoutingConfig(props: Route53RecordSetStandardProps): any {
    const config: any = {};

    // Geo location
    if (props.geoLocation) {
      config.geoLocation = {
        continentCode: props.geoLocation.continentCode,
        countryCode: props.geoLocation.countryCode,
        subdivisionCode: props.geoLocation.subdivisionCode
      };
    }

    // Region for latency-based routing
    if (props.region) {
      config.region = props.region;
    }

    return config;
  }

  /**
   * Build routing configuration
   */
  private buildRoutingConfig(props: Route53RecordSetStandardProps): any {
    const config: any = {};

    // Geo location
    if (props.geoLocation) {
      if (props.geoLocation.subdivisionCode && props.geoLocation.countryCode) {
        // Subdivision takes precedence (most specific)
        config.geoLocation = route53.GeoLocation.subdivision(props.geoLocation.countryCode, props.geoLocation.subdivisionCode);
      } else if (props.geoLocation.countryCode) {
        config.geoLocation = route53.GeoLocation.country(props.geoLocation.countryCode);
      } else if (props.geoLocation.continentCode) {
        config.geoLocation = route53.GeoLocation.continent(props.geoLocation.continentCode as any);
      }
    }

    // Region for latency-based routing
    if (props.region) {
      config.region = props.region;
    }

    return config;
  }

  /**
   * Validate construct properties
   */
  private validateProps(props: Route53RecordSetStandardProps): void {
    // Validate routing policy requirements
    const routingPolicies = [
      props.weight !== undefined,
      props.failover !== undefined,
      props.geoLocation !== undefined,
      props.region !== undefined
    ].filter(Boolean).length;

    if (routingPolicies > 0 && !props.setIdentifier) {
      throw new Error(
        'When using routing policies (weight, failover, geoLocation, or region), ' +
        'set identifier must be provided. ' +
        'Use the setIdentifier property to specify a unique identifier for this record.'
      );
    }

    // Validate weight range
    if (props.weight !== undefined && (props.weight < 0 || props.weight > 255)) {
      throw new Error(
        `Weight must be between 0 and 255. ` +
        `Got ${props.weight}.`
      );
    }

    // Validate comment length
    if (props.comment && props.comment.length > 256) {
      throw new Error(
        `Comment must be 256 characters or less. ` +
        `Got ${props.comment.length} characters.`
      );
    }
  }
}
