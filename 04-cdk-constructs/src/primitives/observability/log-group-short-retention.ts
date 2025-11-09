import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib';
import * as logs from 'aws-cdk-lib/aws-logs';

/**
 * Properties for LogGroupShortRetention
 *
 * @example
 * ```ts
 * const props: LogGroupShortRetentionProps = {
 *   retentionDays: logs.RetentionDays.ONE_WEEK,
 * };
 * ```
 */
export interface LogGroupShortRetentionProps {
  /**
   * Name der Log-Gruppe
   *
   * WARUM optional? CDK generiert automatisch einen eindeutigen Namen
   * WANN angeben? Wenn du einen spezifischen Namen brauchst (z.B. für CloudWatch Insights)
   *
   * @default - Automatisch generiert von CDK
   */
  readonly logGroupName?: string;

  /**
   * Wie lange sollen Logs aufbewahrt werden?
   *
   * WARUM 14 Tage?
   * - Kurz genug für niedrige Kosten
   * - Lang genug für Debugging
   * - AWS Best Practice für Dev-Umgebungen
   *
   * @default logs.RetentionDays.TWO_WEEKS
   */
  readonly retentionDays?: logs.RetentionDays;

  /**
   * KMS Key ARN für Verschlüsselung
   *
   * WARUM optional?
   * - CloudWatch Logs sind standardmäßig verschlüsselt (AWS-managed)
   * - KMS kostet extra
   * - Nur nötig für Compliance-Anforderungen
   *
   * @default - AWS-managed encryption
   */
  readonly kmsKeyArn?: string;

  /**
   * Was passiert beim Stack-Delete?
   *
   * WARUM intelligent?
   * - Dev/Test: DESTROY (spart Kosten)
   * - Production: RETAIN (Logs bleiben erhalten)
   *
   * @default - Auto-detect based on stack name
   */
  readonly removalPolicy?: cdk.RemovalPolicy;
}

/**
 * CloudWatch Log Group mit kurzer Retention
 *
 * WARUM ein eigener Construct?
 * 1. Standardisierung - Überall gleiche Defaults
 * 2. Kostenkontrolle - Verhindert lange Retention
 * 3. Wiederverwendbarkeit - Write once, use everywhere
 *
 * @example
 * ```ts
 * // Minimal
 * const logs = new LogGroupShortRetention(this, 'Logs');
 *
 * // Mit Custom Retention
 * const logs = new LogGroupShortRetention(this, 'Logs', {
 *   retentionDays: logs.RetentionDays.ONE_WEEK,
 * });
 * ```
 */
export class LogGroupShortRetention extends Construct {
  /**
   * Der erstellte CloudWatch Log Group
   *
   * WARUM public? Andere können darauf zugreifen
   * WARUM readonly? Nach Erstellung unveränderbar
   */
  public readonly logGroup: logs.LogGroup;

  /**
   * ARN der Log-Gruppe
   *
   * WARUM extra Property?
   * - Häufig benötigt für IAM Policies
   * - Bequemer als logGroup.logGroupArn
   */
  public readonly logGroupArn: string;

  /**
   * Name der Log-Gruppe
   *
   * WARUM extra Property?
   * - Häufig benötigt für CloudWatch Insights
   * - Bequemer als logGroup.logGroupName
   */
  public readonly logGroupName: string;

  constructor(scope: Construct, id: string, props: LogGroupShortRetentionProps = {}) {
    super(scope, id);

    // ========================================
    // 1. VALIDIERUNG
    // ========================================

    if (props.logGroupName && props.logGroupName.length > 512) {
      throw new Error('Log group name must be <= 512 characters');
    }

    // ========================================
    // 2. DEFAULTS SETZEN
    // ========================================

    const retentionDays = props.retentionDays ?? logs.RetentionDays.TWO_WEEKS;
    const removalPolicy = props.removalPolicy ?? this.getDefaultRemovalPolicy();

    // ========================================
    // 3. RESSOURCEN ERSTELLEN
    // ========================================

    this.logGroup = new logs.LogGroup(this, 'LogGroup', {
      logGroupName: props.logGroupName,
      retention: retentionDays,
      // encryptionKey requires IKey, not ARN; KMS is set via CFN override below if needed
      removalPolicy: removalPolicy,
    });

    // KMS Encryption separat setzen falls ARN bereitgestellt
    if (props.kmsKeyArn) {
      // Für Tests: Setze KMS Key direkt über CFN Override
      const cfnLogGroup = this.logGroup.node.defaultChild as logs.CfnLogGroup;
      cfnLogGroup.kmsKeyId = props.kmsKeyArn;
    }

    // ========================================
    // 4. TAGS HINZUFÜGEN
    // ========================================

    cdk.Tags.of(this.logGroup).add('ManagedBy', 'CDK');
    cdk.Tags.of(this.logGroup).add('Construct', 'LogGroupShortRetention');
    cdk.Tags.of(this.logGroup).add('CostOptimized', 'true');

    // ========================================
    // 5. OUTPUTS SETZEN
    // ========================================

    this.logGroupArn = this.logGroup.logGroupArn;
    this.logGroupName = this.logGroup.logGroupName;
  }

  /**
   * Ermittelt die Standard-RemovalPolicy basierend auf dem Stack
   *
   * WARUM diese Logik?
   * - Dev-Stacks: Logs löschen = Kosten sparen
   * - Prod-Stacks: Logs behalten = Compliance
   *
   * WIE erkennen?
   * - Schaue auf Stack-Name
   * - dev/test/sandbox → DESTROY
   * - Alles andere → RETAIN
   *
   * ACHTUNG: Diese Auto-Erkennung kann zu Datenverlust führen wenn
   * Stack-Namen nicht den Konventionen folgen. Für kritische Logs
   * immer explizit removalPolicy setzen!
   */
  private getDefaultRemovalPolicy(): cdk.RemovalPolicy {
    const stack = cdk.Stack.of(this);
    const stackName = stack.stackName.toLowerCase();

    const devPatterns = ['dev', 'test', 'sandbox', 'local', 'demo'];
    const isDev = devPatterns.some(pattern => stackName.includes(pattern));

    return isDev ? cdk.RemovalPolicy.DESTROY : cdk.RemovalPolicy.RETAIN;
  }
}
