/**
 * Production Example: {ConstructName}
 * 
 * Dieses Beispiel zeigt die empfohlene Production-Konfiguration für {ConstructName}.
 * 
 * Erstellt:
 * - {Ressource 1 mit Production-Features}
 * - {Ressource 2 mit Monitoring}
 * - {Ressource 3 mit Logging}
 * 
 * Features:
 * - ✅ Encryption aktiviert
 * - ✅ Logging & Monitoring
 * - ✅ High Availability
 * - ✅ Disaster Recovery (RETAIN Policy)
 * - ✅ Tagging-Strategie
 * 
 * Use-Case:
 * - Produktionsumgebung
 * - Kritische Workloads
 * - Compliance-Anforderungen
 */

import { App, Stack, StackProps, CfnOutput, RemovalPolicy, Tags } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { {ConstructName} } from '../src';
// Import anderer benötigter Constructs
// import { OtherConstruct } from '../../other/src';

/**
 * Production Example Stack
 */
export class ProductionExampleStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // ========================================
    // Environment-spezifische Konfiguration
    // ========================================

    const environment = process.env.ENVIRONMENT || 'production';
    const isProduction = environment === 'production';

    // ========================================
    // Dependencies (falls benötigt)
    // ========================================

    // Beispiel: Erstelle abhängige Ressourcen
    // const dependency = new OtherConstruct(this, 'Dependency', {
    //   config: 'value',
    // });

    // ========================================
    // Hauptressource mit Production-Konfiguration
    // ========================================

    const construct = new {ConstructName}(this, 'ProductionExample', {
      // Erforderliche Properties
      requiredProp: `${environment}-value`,

      // Optionale Features aktivieren
      optionalProp: true,

      // Production-spezifische Settings
      removalPolicy: isProduction 
        ? RemovalPolicy.RETAIN 
        : RemovalPolicy.DESTROY,

      // Tags für Governance
      tags: {
        Environment: environment,
        CostCenter: 'platform',
        Owner: 'platform-team',
        Compliance: 'required',
        BackupPolicy: 'daily',
      },
    });

    // ========================================
    // Monitoring & Alarme (falls benötigt)
    // ========================================

    // Beispiel: CloudWatch Alarms
    // import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
    // import * as actions from 'aws-cdk-lib/aws-cloudwatch-actions';
    // import * as sns from 'aws-cdk-lib/aws-sns';

    // const alarmTopic = new sns.Topic(this, 'AlarmTopic', {
    //   displayName: `${environment} Alarms`,
    // });

    // const errorAlarm = new cloudwatch.Alarm(this, 'ErrorAlarm', {
    //   metric: construct.{resourceReference}.metricErrors(),
    //   threshold: 5,
    //   evaluationPeriods: 2,
    //   datapointsToAlarm: 2,
    //   treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    // });

    // errorAlarm.addAlarmAction(new actions.SnsAction(alarmTopic));

    // ========================================
    // Backup-Strategie (falls relevant)
    // ========================================

    // Beispiel: Backup-Konfiguration
    // import * as backup from 'aws-cdk-lib/aws-backup';
    
    // if (isProduction) {
    //   const backupPlan = new backup.BackupPlan(this, 'BackupPlan', {
    //     backupPlanRules: [
    //       new backup.BackupPlanRule({
    //         ruleName: 'DailyBackup',
    //         scheduleExpression: backup.ScheduleExpression.cron({
    //           hour: '3',
    //           minute: '0',
    //         }),
    //         deleteAfter: cdk.Duration.days(30),
    //       }),
    //     ],
    //   });
    //   
    //   // Add resources to backup
    //   // backupPlan.addSelection('Selection', {
    //   //   resources: [backup.BackupResource.fromArn(construct.{outputProperty1})],
    //   // });
    // }

    // ========================================
    // Cross-Region Replication (optional)
    // ========================================

    // Beispiel: Multi-Region Setup
    // if (isProduction) {
    //   // Repliziere kritische Daten in andere Region
    //   // Implementation je nach Service
    // }

    // ========================================
    // Outputs mit Naming Convention
    // ========================================

    new CfnOutput(this, 'ConstructArn', {
      value: construct.{outputProperty1},
      description: 'ARN der Hauptressource',
      exportName: `${this.stackName}-ConstructArn`,
    });

    if (construct.{outputProperty2}) {
      new CfnOutput(this, 'ConstructUrl', {
        value: construct.{outputProperty2}!,
        description: 'URL der Ressource',
        exportName: `${this.stackName}-ConstructUrl`,
      });
    }

    // Zusätzliche Metadata-Outputs
    new CfnOutput(this, 'Environment', {
      value: environment,
      description: 'Deployment Environment',
    });

    new CfnOutput(this, 'DeploymentTime', {
      value: new Date().toISOString(),
      description: 'Zeitpunkt des Deployments',
    });
  }
}

/**
 * CDK App Setup mit Production-Best-Practices
 */
const app = new App();

// Environment aus Context oder ENV
const environment = app.node.tryGetContext('environment') || process.env.ENVIRONMENT || 'production';
const account = app.node.tryGetContext('account') || process.env.CDK_DEFAULT_ACCOUNT;
const region = app.node.tryGetContext('region') || process.env.CDK_DEFAULT_REGION || 'eu-central-1';

const stack = new ProductionExampleStack(app, `ProductionExampleStack-${environment}`, {
  env: {
    account: account,
    region: region,
  },
  description: `Production example for {ConstructName} (${environment})`,
  
  // Stack-Level Tags
  tags: {
    Application: '{ConstructName}',
    Environment: environment,
    ManagedBy: 'CDK',
    DeployedBy: process.env.USER || 'cicd',
    Version: '1.0.0',
  },

  // Termination Protection für Production
  terminationProtection: environment === 'production',
});

// Zusätzliche Stack-Level Tags
Tags.of(stack).add('CostAllocation', 'platform');
Tags.of(stack).add('Compliance', 'required');

app.synth();
