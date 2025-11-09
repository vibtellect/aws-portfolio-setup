import { describe, test, beforeEach, expect } from '@jest/globals';
import { App, Stack } from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { Route53HostedZoneStandard } from '../../../src/primitives/networking/route53-hosted-zone-standard';

describe('Route53HostedZoneStandard', () => {
  let app: App;
  let stack: Stack;

  beforeEach(() => {
    app = new App();
    stack = new Stack(app, 'TestStack');
  });

  // ============================================================================
  // Basic Creation Tests
  // ============================================================================

  test('creates hosted zone with default settings', () => {
    new Route53HostedZoneStandard(stack, 'HostedZone', {
      zoneName: 'example.com'
    });

    const template = Template.fromStack(stack);
    template.resourceCountIs('AWS::Route53::HostedZone', 1);
  });

  test('uses provided zone name', () => {
    new Route53HostedZoneStandard(stack, 'HostedZone', {
      zoneName: 'example.com'
    });

    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::Route53::HostedZone', {
      Name: 'example.com.'  // Route53 adds trailing dot
    });
  });

  test('provides hosted zone outputs', () => {
    const zone = new Route53HostedZoneStandard(stack, 'HostedZone', {
      zoneName: 'example.com'
    });

    expect(zone.hostedZone).toBeDefined();
    expect(zone.hostedZoneId).toBeDefined();
    expect(zone.zoneName).toBe('example.com');
  });

  // ============================================================================
  // Configuration Tests
  // ============================================================================

  test('adds comment when provided', () => {
    new Route53HostedZoneStandard(stack, 'HostedZone', {
      zoneName: 'example.com',
      comment: 'Production DNS zone'
    });

    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::Route53::HostedZone', {
      HostedZoneConfig: {
        Comment: 'Production DNS zone'
      }
    });
  });

  test('does not add comment by default', () => {
    new Route53HostedZoneStandard(stack, 'HostedZone', {
      zoneName: 'example.com'
    });

    const template = Template.fromStack(stack);
    const resources = template.findResources('AWS::Route53::HostedZone');
    const zone = Object.values(resources)[0];
    expect(zone.Properties.HostedZoneConfig).toBeUndefined();
  });

  test('supports VPC association', () => {
    const vpc = {
      vpcId: 'vpc-12345',
      region: 'eu-central-1'
    };

    new Route53HostedZoneStandard(stack, 'HostedZone', {
      zoneName: 'internal.example.com',
      vpcs: [vpc]
    });

    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::Route53::HostedZone', {
      VPCs: [
        {
          VPCId: 'vpc-12345',
          VPCRegion: 'eu-central-1'
        }
      ]
    });
  });

  test('allows multiple VPC associations', () => {
    const vpcs = [
      { vpcId: 'vpc-11111', region: 'eu-central-1' },
      { vpcId: 'vpc-22222', region: 'us-east-1' }
    ];

    new Route53HostedZoneStandard(stack, 'HostedZone', {
      zoneName: 'internal.example.com',
      vpcs
    });

    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::Route53::HostedZone', {
      VPCs: Match.arrayWith([
        { VPCId: 'vpc-11111', VPCRegion: 'eu-central-1' },
        { VPCId: 'vpc-22222', VPCRegion: 'us-east-1' }
      ])
    });
  });

  test.skip('enables query logging when log group provided', () => {
    // NOTE: Query logging is not yet supported in aws-cdk-lib@2.222.0
    // CfnQueryLoggingConfig does not exist in this version
    // This test is skipped until CDK supports it
    new Route53HostedZoneStandard(stack, 'HostedZone', {
      zoneName: 'example.com',
      enableQueryLogging: true,
      queryLoggingLogGroupArn: 'arn:aws:logs:eu-central-1:123456789012:log-group:/aws/route53/example.com'
    });

    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::Route53::QueryLoggingConfig', {
      CloudWatchLogsLogGroupArn: 'arn:aws:logs:eu-central-1:123456789012:log-group:/aws/route53/example.com'
    });
  });

  test('does not enable query logging by default', () => {
    new Route53HostedZoneStandard(stack, 'HostedZone', {
      zoneName: 'example.com'
    });

    const template = Template.fromStack(stack);
    template.resourceCountIs('AWS::Route53::QueryLoggingConfig', 0);
  });

  // ============================================================================
  // Tagging Tests
  // ============================================================================

  test('adds managed-by and construct tags', () => {
    new Route53HostedZoneStandard(stack, 'HostedZone', {
      zoneName: 'example.com'
    });

    const template = Template.fromStack(stack);
    const json = template.toJSON();
    const hostedZone = Object.values(json.Resources).find(
      (r: any) => r.Type === 'AWS::Route53::HostedZone'
    ) as any;

    const tags = hostedZone.Properties.HostedZoneTags;
    const tagMap = Object.fromEntries(tags.map((t: any) => [t.Key, t.Value]));

    // Check that default tags are present
    expect(tagMap['ManagedBy']).toBe('CDK');
    expect(tagMap['Construct']).toBe('Route53HostedZoneStandard');
  });

  test('allows custom tags', () => {
    new Route53HostedZoneStandard(stack, 'HostedZone', {
      zoneName: 'example.com',
      tags: {
        Environment: 'production',
        Project: 'my-app'
      }
    });

    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::Route53::HostedZone', {
      HostedZoneTags: Match.arrayWith([
        { Key: 'Environment', Value: 'production' },
        { Key: 'Project', Value: 'my-app' }
      ])
    });
  });

  // ============================================================================
  // Validation Tests
  // ============================================================================

  test('throws error for invalid zone name', () => {
    expect(() => {
      new Route53HostedZoneStandard(stack, 'HostedZone', {
        zoneName: ''
      });
    }).toThrow(/zone name cannot be empty/i);
  });

  test('throws error for zone name exceeding maximum length', () => {
    const longName = 'a'.repeat(256) + '.com';

    expect(() => {
      new Route53HostedZoneStandard(stack, 'HostedZone', {
        zoneName: longName
      });
    }).toThrow(/zone name must be 255 characters or less/i);
  });

  test('throws error when query logging enabled without log group ARN', () => {
    expect(() => {
      new Route53HostedZoneStandard(stack, 'HostedZone', {
        zoneName: 'example.com',
        enableQueryLogging: true
      });
    }).toThrow(/query logging log group ARN must be provided/i);
  });

  test('throws error for invalid log group ARN format', () => {
    expect(() => {
      new Route53HostedZoneStandard(stack, 'HostedZone', {
        zoneName: 'example.com',
        enableQueryLogging: true,
        queryLoggingLogGroupArn: 'invalid-arn'
      });
    }).toThrow(/invalid log group ARN format/i);
  });

  test('throws error when comment exceeds maximum length', () => {
    const longComment = 'a'.repeat(300);

    expect(() => {
      new Route53HostedZoneStandard(stack, 'HostedZone', {
        zoneName: 'example.com',
        comment: longComment
      });
    }).toThrow(/comment must be 256 characters or less/i);
  });

  test('accepts valid subdomain names', () => {
    const zone = new Route53HostedZoneStandard(stack, 'HostedZone', {
      zoneName: 'sub.example.com'
    });

    expect(zone.zoneName).toBe('sub.example.com');
  });

  test('accepts valid multi-level subdomain names', () => {
    const zone = new Route53HostedZoneStandard(stack, 'HostedZone', {
      zoneName: 'api.v1.example.com'
    });

    expect(zone.zoneName).toBe('api.v1.example.com');
  });

  // ============================================================================
  // Name Server Tests
  // ============================================================================

  test('exposes name servers', () => {
    const zone = new Route53HostedZoneStandard(stack, 'HostedZone', {
      zoneName: 'example.com'
    });

    expect(zone.hostedZoneNameServers).toBeDefined();
  });

  // ============================================================================
  // Public vs Private Zone Tests
  // ============================================================================

  test('creates public zone by default', () => {
    new Route53HostedZoneStandard(stack, 'HostedZone', {
      zoneName: 'example.com'
    });

    const template = Template.fromStack(stack);
    const resources = template.findResources('AWS::Route53::HostedZone');
    const zone = Object.values(resources)[0];

    // Public zones don't have VPCs property
    expect(zone.Properties.VPCs).toBeUndefined();
  });

  test('creates private zone when VPC is provided', () => {
    new Route53HostedZoneStandard(stack, 'HostedZone', {
      zoneName: 'internal.example.com',
      vpcs: [{ vpcId: 'vpc-12345', region: 'eu-central-1' }]
    });

    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::Route53::HostedZone', {
      VPCs: Match.arrayWith([
        { VPCId: 'vpc-12345', VPCRegion: 'eu-central-1' }
      ])
    });
  });
});
