/**
 * Basic Example: {ConstructName}
 * 
 * Dieses Beispiel zeigt die minimale Konfiguration für {ConstructName}.
 * 
 * Erstellt:
 * - {Ressource 1 Beschreibung}
 * - {Ressource 2 Beschreibung}
 * 
 * Use-Case:
 * - Entwicklungsumgebung
 * - Proof of Concept
 * - Lokales Testen
 */

import { App, Stack, StackProps, CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { {ConstructName} } from '../src';

/**
 * Basic Example Stack
 */
export class BasicExampleStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // ========================================
    // Minimale Konfiguration
    // ========================================

    const construct = new {ConstructName}(this, 'BasicExample', {
      requiredProp: 'basic-example-value',
      // Alle anderen Props verwenden Defaults
    });

    // ========================================
    // Outputs
    // ========================================

    new CfnOutput(this, 'Output1', {
      value: construct.{outputProperty1},
      description: '{Beschreibung des Outputs}',
      exportName: `${this.stackName}-Output1`,
    });

    // Optional: Weitere Outputs
    // if (construct.{outputProperty2}) {
    //   new CfnOutput(this, 'Output2', {
    //     value: construct.{outputProperty2},
    //     description: '{Beschreibung}',
    //   });
    // }
  }
}

/**
 * CDK App Setup
 */
const app = new App();

new BasicExampleStack(app, 'BasicExampleStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'eu-central-1',
  },
  description: 'Basic example for {ConstructName}',
  tags: {
    Environment: 'dev',
    Example: 'basic',
    ManagedBy: 'CDK',
  },
});

app.synth();
