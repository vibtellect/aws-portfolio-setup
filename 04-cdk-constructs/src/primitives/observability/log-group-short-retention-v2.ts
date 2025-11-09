import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';

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
export class LogGroupShortRetention extends Construct implements logs.ILogGroup {
  /**
   * Die innere Log Group (privat für Delegation)
   */
  private readonly _logGroup: logs.LogGroup;

  // ========================================
  // ILogGroup INTERFACE IMPLEMENTATION
  // ========================================

  /**
   * The ARN of this log group, with ':*' appended
   * @attribute
   */
  public readonly logGroupArn: string;

  /**
   * The name of this log group
   * @attribute
   */
  public readonly logGroupName: string;

  /**
   * The environment this resource belongs to.
   */
  public readonly env: cdk.ResourceEnvironment;

  /**
   * The stack in which this resource is defined.
   */
  public readonly stack: cdk.Stack;

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

    this._logGroup = new logs.LogGroup(this, 'LogGroup', {
      logGroupName: props.logGroupName,
      retention: retentionDays,
      // encryptionKey requires IKey, not ARN; KMS is set via CFN override below if needed
      removalPolicy: removalPolicy,
    });

    // KMS Encryption separat setzen falls ARN bereitgestellt
    if (props.kmsKeyArn) {
      // Für Tests: Setze KMS Key direkt über CFN Override
      const cfnLogGroup = this._logGroup.node.defaultChild as logs.CfnLogGroup;
      cfnLogGroup.kmsKeyId = props.kmsKeyArn;
    }

    // ========================================
    // 4. TAGS HINZUFÜGEN
    // ========================================

    cdk.Tags.of(this._logGroup).add('ManagedBy', 'CDK');
    cdk.Tags.of(this._logGroup).add('Construct', 'LogGroupShortRetention');
    cdk.Tags.of(this._logGroup).add('CostOptimized', 'true');

    // ========================================
    // 5. DELEGIERE ILogGroup PROPERTIES
    // ========================================

    this.logGroupArn = this._logGroup.logGroupArn;
    this.logGroupName = this._logGroup.logGroupName;
    this.env = this._logGroup.env;
    this.stack = this._logGroup.stack;
  }

  // ========================================
  // ILogGroup INTERFACE METHODS
  // ========================================

  /**
   * Create a new Log Stream for this Log Group
   */
  public addStream(id: string, props?: logs.StreamOptions): logs.LogStream {
    return this._logGroup.addStream(id, props);
  }

  /**
   * Create a new Subscription Filter on this Log Group
   */
  public addSubscriptionFilter(id: string, props: logs.SubscriptionFilterOptions): logs.SubscriptionFilter {
    return this._logGroup.addSubscriptionFilter(id, props);
  }

  /**
   * Create a new Metric Filter on this Log Group
   */
  public addMetricFilter(id: string, props: logs.MetricFilterOptions): logs.MetricFilter {
    return this._logGroup.addMetricFilter(id, props);
  }

  /**
   * Create a new Transformer on this Log Group
   */
  public addTransformer(id: string, props: logs.TransformerOptions): logs.Transformer {
    return this._logGroup.addTransformer(id, props);
  }

  /**
   * Extract a metric from structured log events in the LogGroup
   */
  public extractMetric(jsonField: string, metricNamespace: string, metricName: string): cloudwatch.Metric {
    return this._logGroup.extractMetric(jsonField, metricNamespace, metricName);
  }

  /**
   * Give permissions to write to create and write to streams in this log group
   */
  public grantWrite(grantee: iam.IGrantable): iam.Grant {
    return this._logGroup.grantWrite(grantee);
  }

  /**
   * Give permissions to read from this log group and streams
   */
  public grantRead(grantee: iam.IGrantable): iam.Grant {
    return this._logGroup.grantRead(grantee);
  }

  /**
   * Give the indicated permissions on this log group and all streams
   */
  public grant(grantee: iam.IGrantable, ...actions: string[]): iam.Grant {
    return this._logGroup.grant(grantee, ...actions);
  }

  /**
   * Public method to get the physical name of this log group
   */
  public logGroupPhysicalName(): string {
    return this._logGroup.logGroupPhysicalName();
  }

  /**
   * Return the given named metric for this Log Group
   */
  public metric(metricName: string, props?: cloudwatch.MetricOptions): cloudwatch.Metric {
    return this._logGroup.metric(metricName, props);
  }

  /**
   * The number of log events uploaded to CloudWatch Logs.
   */
  public metricIncomingLogEvents(props?: cloudwatch.MetricOptions): cloudwatch.Metric {
    return this._logGroup.metricIncomingLogEvents(props);
  }

  /**
   * The volume of log events in uncompressed bytes uploaded to CloudWatch Logs.
   */
  public metricIncomingBytes(props?: cloudwatch.MetricOptions): cloudwatch.Metric {
    return this._logGroup.metricIncomingBytes(props);
  }

  // ========================================
  // IResourceWithPolicy INTERFACE METHODS
  // ========================================

  /**
   * Add a statement to the resource's resource policy
   */
  public addToResourcePolicy(statement: iam.PolicyStatement): iam.AddToResourcePolicyResult {
    return this._logGroup.addToResourcePolicy(statement);
  }

  // ========================================
  // IResource INTERFACE METHODS
  // ========================================

  /**
   * Apply the given removal policy to this resource
   */
  public applyRemovalPolicy(policy: cdk.RemovalPolicy): void {
    this._logGroup.applyRemovalPolicy(policy);
  }

  // ========================================
  // PRIVATE METHODS
  // ========================================

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
