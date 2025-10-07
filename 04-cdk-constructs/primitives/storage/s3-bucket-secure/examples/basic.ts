/**
 * Minimal S3 Bucket mit sicheren Defaults
 * 
 * Erstellt einen S3 Bucket mit:
 * - Block Public Access
 * - SSE-S3 Verschlüsselung
 * - HTTPS-Enforcement
 */

import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
// import { S3BucketSecure } from '../src';

export class BasicExampleStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Minimale Konfiguration - alle Defaults
    // const bucket = new S3BucketSecure(this, 'DataBucket');

    // Mit Versionierung (empfohlen für Prod)
    // const versionedBucket = new S3BucketSecure(this, 'VersionedBucket', {
    //   versioned: true,
    // });

    // Output: Bucket-Name
    // new cdk.CfnOutput(this, 'BucketName', {
    //   value: bucket.bucketName,
    //   description: 'S3 Bucket Name',
    // });
  }
}
