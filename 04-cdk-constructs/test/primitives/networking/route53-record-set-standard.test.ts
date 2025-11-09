import { describe, test, beforeEach, expect } from '@jest/globals';
import { App, Stack, Duration } from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import * as elb from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import { Route53RecordSetStandard } from '../../../src/primitives/networking/route53-record-set-standard';

describe('Route53RecordSetStandard', () => {
  let app: App;
  let stack: Stack;
  let hostedZone: route53.IHostedZone;

  beforeEach(() => {
    app = new App();
    stack = new Stack(app, 'TestStack');
    hostedZone = new route53.PublicHostedZone(stack, 'Zone', {
      zoneName: 'example.com'
    });
  });

  // ============================================================================
  // Basic A Record Tests
  // ============================================================================

  test('creates A record with IP address', () => {
    new Route53RecordSetStandard(stack, 'ARecord', {
      hostedZone,
      recordName: 'www.example.com',
      recordType: route53.RecordType.A,
      target: route53.RecordTarget.fromIpAddresses('192.0.2.1')
    });

    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::Route53::RecordSet', {
      Name: 'www.example.com.',
      Type: 'A',
      ResourceRecords: ['192.0.2.1']
    });
  });

  test('creates A record with multiple IP addresses', () => {
    new Route53RecordSetStandard(stack, 'ARecord', {
      hostedZone,
      recordName: 'www.example.com',
      recordType: route53.RecordType.A,
      target: route53.RecordTarget.fromIpAddresses('192.0.2.1', '192.0.2.2')
    });

    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::Route53::RecordSet', {
      Name: 'www.example.com.',
      Type: 'A',
      ResourceRecords: ['192.0.2.1', '192.0.2.2']
    });
  });

  // ============================================================================
  // CNAME Record Tests
  // ============================================================================

  test('creates CNAME record', () => {
    new Route53RecordSetStandard(stack, 'CNAMERecord', {
      hostedZone,
      recordName: 'www.example.com',
      recordType: route53.RecordType.CNAME,
      target: route53.RecordTarget.fromValues('example.com')
    });

    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::Route53::RecordSet', {
      Name: 'www.example.com.',
      Type: 'CNAME',
      ResourceRecords: ['example.com']
    });
  });

  // ============================================================================
  // TTL Tests
  // ============================================================================

  test('uses default TTL of 300 seconds', () => {
    new Route53RecordSetStandard(stack, 'Record', {
      hostedZone,
      recordName: 'www.example.com',
      recordType: route53.RecordType.A,
      target: route53.RecordTarget.fromIpAddresses('192.0.2.1')
    });

    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::Route53::RecordSet', {
      TTL: '300'
    });
  });

  test('allows custom TTL', () => {
    new Route53RecordSetStandard(stack, 'Record', {
      hostedZone,
      recordName: 'www.example.com',
      recordType: route53.RecordType.A,
      target: route53.RecordTarget.fromIpAddresses('192.0.2.1'),
      ttl: Duration.seconds(600)
    });

    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::Route53::RecordSet', {
      TTL: '600'
    });
  });

  // ============================================================================
  // Alias Record Tests
  // ============================================================================

  test('creates alias record for CloudFront distribution', () => {
    const distribution = cloudfront.Distribution.fromDistributionAttributes(
      stack,
      'Distribution',
      {
        domainName: 'd111111abcdef8.cloudfront.net',
        distributionId: 'E1234567890ABC'
      }
    );

    new Route53RecordSetStandard(stack, 'AliasRecord', {
      hostedZone,
      recordName: 'www.example.com',
      recordType: route53.RecordType.A,
      target: route53.RecordTarget.fromAlias(
        new targets.CloudFrontTarget(distribution)
      )
    });

    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::Route53::RecordSet', {
      Name: 'www.example.com.',
      Type: 'A',
      AliasTarget: {
        DNSName: 'd111111abcdef8.cloudfront.net',
        HostedZoneId: Match.anyValue()  // CloudFront hosted zone ID (can be string or Fn::FindInMap)
      }
    });
  });

  // ============================================================================
  // Weighted Routing Tests
  // ============================================================================

  test('supports weighted routing policy', () => {
    new Route53RecordSetStandard(stack, 'WeightedRecord', {
      hostedZone,
      recordName: 'www.example.com',
      recordType: route53.RecordType.A,
      target: route53.RecordTarget.fromIpAddresses('192.0.2.1'),
      weight: 100,
      setIdentifier: 'weight-100'
    });

    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::Route53::RecordSet', {
      Name: 'www.example.com.',
      Type: 'A',
      Weight: 100,
      SetIdentifier: 'weight-100'
    });
  });

  // ============================================================================
  // Failover Routing Tests
  // ============================================================================

  test('supports failover routing policy - primary', () => {
    new Route53RecordSetStandard(stack, 'FailoverPrimary', {
      hostedZone,
      recordName: 'www.example.com',
      recordType: route53.RecordType.A,
      target: route53.RecordTarget.fromIpAddresses('192.0.2.1'),
      failover: 'PRIMARY',
      setIdentifier: 'primary'
    });

    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::Route53::RecordSet', {
      Name: 'www.example.com.',
      Type: 'A',
      Failover: 'PRIMARY',
      SetIdentifier: 'primary'
    });
  });

  test('supports failover routing policy - secondary', () => {
    new Route53RecordSetStandard(stack, 'FailoverSecondary', {
      hostedZone,
      recordName: 'www.example.com',
      recordType: route53.RecordType.A,
      target: route53.RecordTarget.fromIpAddresses('192.0.2.2'),
      failover: 'SECONDARY',
      setIdentifier: 'secondary'
    });

    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::Route53::RecordSet', {
      Name: 'www.example.com.',
      Type: 'A',
      Failover: 'SECONDARY',
      SetIdentifier: 'secondary'
    });
  });

  // ============================================================================
  // Geolocation Routing Tests
  // ============================================================================

  test('supports geolocation routing by continent', () => {
    new Route53RecordSetStandard(stack, 'GeoRecord', {
      hostedZone,
      recordName: 'www.example.com',
      recordType: route53.RecordType.A,
      target: route53.RecordTarget.fromIpAddresses('192.0.2.1'),
      geoLocation: {
        continentCode: 'EU'
      },
      setIdentifier: 'europe'
    });

    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::Route53::RecordSet', {
      Name: 'www.example.com.',
      Type: 'A',
      GeoLocation: {
        ContinentCode: 'EU'
      },
      SetIdentifier: 'europe'
    });
  });

  test('supports geolocation routing by country', () => {
    new Route53RecordSetStandard(stack, 'GeoRecord', {
      hostedZone,
      recordName: 'www.example.com',
      recordType: route53.RecordType.A,
      target: route53.RecordTarget.fromIpAddresses('192.0.2.1'),
      geoLocation: {
        countryCode: 'DE'
      },
      setIdentifier: 'germany'
    });

    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::Route53::RecordSet', {
      Name: 'www.example.com.',
      Type: 'A',
      GeoLocation: {
        CountryCode: 'DE'
      },
      SetIdentifier: 'germany'
    });
  });

  // ============================================================================
  // Latency Routing Tests
  // ============================================================================

  test('supports latency-based routing', () => {
    new Route53RecordSetStandard(stack, 'LatencyRecord', {
      hostedZone,
      recordName: 'www.example.com',
      recordType: route53.RecordType.A,
      target: route53.RecordTarget.fromIpAddresses('192.0.2.1'),
      region: 'eu-central-1',
      setIdentifier: 'frankfurt'
    });

    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::Route53::RecordSet', {
      Name: 'www.example.com.',
      Type: 'A',
      Region: 'eu-central-1',
      SetIdentifier: 'frankfurt'
    });
  });

  // ============================================================================
  // Comment Tests
  // ============================================================================

  test('adds comment when provided', () => {
    new Route53RecordSetStandard(stack, 'Record', {
      hostedZone,
      recordName: 'www.example.com',
      recordType: route53.RecordType.A,
      target: route53.RecordTarget.fromIpAddresses('192.0.2.1'),
      comment: 'Production web server'
    });

    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::Route53::RecordSet', {
      Comment: 'Production web server'
    });
  });

  // ============================================================================
  // Validation Tests
  // ============================================================================

  test('throws error when weight provided without setIdentifier', () => {
    expect(() => {
      new Route53RecordSetStandard(stack, 'InvalidRecord', {
        hostedZone,
        recordName: 'www.example.com',
        recordType: route53.RecordType.A,
        target: route53.RecordTarget.fromIpAddresses('192.0.2.1'),
        weight: 100
      });
    }).toThrow(/set identifier must be provided/i);
  });

  test('throws error when failover provided without setIdentifier', () => {
    expect(() => {
      new Route53RecordSetStandard(stack, 'InvalidRecord', {
        hostedZone,
        recordName: 'www.example.com',
        recordType: route53.RecordType.A,
        target: route53.RecordTarget.fromIpAddresses('192.0.2.1'),
        failover: 'PRIMARY'
      });
    }).toThrow(/set identifier must be provided/i);
  });

  test('throws error when geoLocation provided without setIdentifier', () => {
    expect(() => {
      new Route53RecordSetStandard(stack, 'InvalidRecord', {
        hostedZone,
        recordName: 'www.example.com',
        recordType: route53.RecordType.A,
        target: route53.RecordTarget.fromIpAddresses('192.0.2.1'),
        geoLocation: { continentCode: 'EU' }
      });
    }).toThrow(/set identifier must be provided/i);
  });

  test('throws error when region provided without setIdentifier', () => {
    expect(() => {
      new Route53RecordSetStandard(stack, 'InvalidRecord', {
        hostedZone,
        recordName: 'www.example.com',
        recordType: route53.RecordType.A,
        target: route53.RecordTarget.fromIpAddresses('192.0.2.1'),
        region: 'eu-central-1'
      });
    }).toThrow(/set identifier must be provided/i);
  });

  test('throws error for invalid weight', () => {
    expect(() => {
      new Route53RecordSetStandard(stack, 'InvalidRecord', {
        hostedZone,
        recordName: 'www.example.com',
        recordType: route53.RecordType.A,
        target: route53.RecordTarget.fromIpAddresses('192.0.2.1'),
        weight: 300,
        setIdentifier: 'test'
      });
    }).toThrow(/weight must be between 0 and 255/i);
  });

  test('throws error when comment exceeds maximum length', () => {
    const longComment = 'a'.repeat(300);

    expect(() => {
      new Route53RecordSetStandard(stack, 'InvalidRecord', {
        hostedZone,
        recordName: 'www.example.com',
        recordType: route53.RecordType.A,
        target: route53.RecordTarget.fromIpAddresses('192.0.2.1'),
        comment: longComment
      });
    }).toThrow(/comment must be 256 characters or less/i);
  });

  // ============================================================================
  // Output Tests
  // ============================================================================

  test('provides record name output', () => {
    const record = new Route53RecordSetStandard(stack, 'Record', {
      hostedZone,
      recordName: 'www.example.com',
      recordType: route53.RecordType.A,
      target: route53.RecordTarget.fromIpAddresses('192.0.2.1')
    });

    expect(record.recordName).toBe('www.example.com');
  });

  test('provides record type output', () => {
    const record = new Route53RecordSetStandard(stack, 'Record', {
      hostedZone,
      recordName: 'www.example.com',
      recordType: route53.RecordType.A,
      target: route53.RecordTarget.fromIpAddresses('192.0.2.1')
    });

    expect(record.recordType).toBe(route53.RecordType.A);
  });
});
