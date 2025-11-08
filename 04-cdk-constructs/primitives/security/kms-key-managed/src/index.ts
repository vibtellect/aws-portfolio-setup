import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as iam from 'aws-cdk-lib/aws-iam';

/**
 * Properties for KmsKeyManaged
 *
 * @example
 * ```ts
 * const props: KmsKeyManagedProps = {
 *   description: 'Encryption key for sensitive data',
 *   enableKeyRotation: true,
 *   enableLambdaAccess: true,
 *   enableSqsAccess: true,
 * };
 * ```
 */
export interface KmsKeyManagedProps {
  /**
   * Beschreibung des KMS-Keys
   *
   * WARUM wichtig?
   * - Dokumentation in AWS Console
   * - Hilft beim Debugging
   * - Compliance/Auditing
   *
   * @default 'Managed KMS key created by CDK'
   */
  readonly description?: string;

  /**
   * Alias für den KMS-Key
   *
   * WARUM Alias?
   * - Lesbarerer Name statt UUID
   * - Einfacher in Policies zu referenzieren
   * - Bessere Übersicht in Console
   *
   * WICHTIG:
   * - Muss mit 'alias/' beginnen
   * - Darf NICHT mit 'alias/aws/' beginnen (reserved)
   *
   * @default - Auto-generated from construct ID
   */
  readonly alias?: string;

  /**
   * Automatische Key-Rotation aktivieren?
   *
   * WARUM aktivieren?
   * - Security Best Practice
   * - Compliance-Anforderungen (PCI-DSS, HIPAA)
   * - Minimiert Schaden bei Key-Kompromittierung
   *
   * WICHTIG:
   * - Rotation alle 365 Tage
   * - Alte Keys bleiben verfügbar für Entschlüsselung
   *
   * @default true
   */
  readonly enableKeyRotation?: boolean;

  /**
   * Lambda-Zugriff erlauben?
   *
   * WARUM separate Flag?
   * - Least-Privilege Prinzip
   * - Nur wenn Lambda Environment-Variablen verschlüsselt werden
   *
   * @default false
   */
  readonly enableLambdaAccess?: boolean;

  /**
   * SQS-Zugriff erlauben?
   *
   * WARUM wichtig?
   * - SQS braucht Decrypt für SSE-KMS
   * - Ohne Permission schlägt Queue fehl
   *
   * @default false
   */
  readonly enableSqsAccess?: boolean;

  /**
   * SNS-Zugriff erlauben?
   *
   * WARUM wichtig?
   * - SNS braucht Decrypt für SSE-KMS
   * - Ohne Permission schlägt Topic fehl
   *
   * @default false
   */
  readonly enableSnsAccess?: boolean;

  /**
   * S3-Zugriff erlauben?
   *
   * WARUM wichtig?
   * - S3 braucht Decrypt für SSE-KMS
   * - Ohne Permission schlägt Bucket fehl
   *
   * @default false
   */
  readonly enableS3Access?: boolean;

  /**
   * RemovalPolicy für den Key
   *
   * WARUM wichtig?
   * - Dev: DESTROY (automatisch löschen)
   * - Prod: RETAIN (Keys behalten für Compliance)
   *
   * @default - Auto-detect based on stack name
   */
  readonly removalPolicy?: cdk.RemovalPolicy;
}

/**
 * KMS Key mit Security Best Practices
 *
 * WARUM dieser Construct?
 * 1. Sicherheit: Automatische Rotation standardmäßig aktiviert
 * 2. Standardisierung: Konsistente Key-Policies
 * 3. Wartbarkeit: Zentrale Stelle für Security-Updates
 *
 * WAS macht er?
 * - Erstellt KMS Customer Managed Key (CMK)
 * - Aktiviert automatische Key-Rotation
 * - Erstellt Alias für einfacheren Zugriff
 * - Fügt Service-Permissions hinzu (Lambda, SQS, SNS, S3)
 * - Environment-aware RemovalPolicy
 *
 * @example
 * ```ts
 * // Minimal
 * const key = new KmsKeyManaged(this, 'Key');
 *
 * // Mit Service-Zugriff
 * const key = new KmsKeyManaged(this, 'Key', {
 *   enableLambdaAccess: true,
 *   enableSqsAccess: true,
 * });
 *
 * // Production-ready
 * const key = new KmsKeyManaged(this, 'Key', {
 *   description: 'Encryption key for user data',
 *   alias: 'alias/user-data-encryption',
 *   enableKeyRotation: true,
 *   enableLambdaAccess: true,
 *   enableSqsAccess: true,
 *   enableSnsAccess: true,
 * });
 * ```
 */
export class KmsKeyManaged extends Construct {
  /**
   * Der erstellte KMS-Key
   *
   * WARUM public?
   * - Andere Constructs müssen darauf zugreifen können
   * - z.B. SQS Queue braucht Key für Encryption
   */
  public readonly key: kms.Key;

  /**
   * ARN des Keys
   *
   * WARUM extra Property?
   * - Häufig benötigt für IAM Policies
   * - Für CloudFormation Outputs
   */
  public readonly keyArn: string;

  /**
   * ID des Keys (UUID)
   *
   * WARUM extra Property?
   * - Für CLI-Scripts
   * - Für Debugging in AWS Console
   */
  public readonly keyId: string;

  constructor(scope: Construct, id: string, props: KmsKeyManagedProps = {}) {
    super(scope, id);

    // ========================================
    // 1. VALIDIERUNG
    // ========================================

    this.validateProps(props);

    // ========================================
    // 2. DEFAULT VALUES
    // ========================================

    const enableKeyRotation = props.enableKeyRotation ?? true;
    const removalPolicy = props.removalPolicy ?? this.getDefaultRemovalPolicy();
    const description = props.description ?? 'Managed KMS key created by CDK';

    // ========================================
    // 3. KEY-POLICY ERSTELLEN
    // ========================================

    // WICHTIG: KMS braucht eine Key-Policy
    // - Root Account hat standardmäßig Zugriff
    // - Service Principals brauchen explizite Permissions

    const keyPolicy = new iam.PolicyDocument({
      statements: [
        // Statement 1: Root Account hat vollen Zugriff
        new iam.PolicyStatement({
          sid: 'Enable IAM User Permissions',
          effect: iam.Effect.ALLOW,
          principals: [
            new iam.AccountRootPrincipal(),
          ],
          actions: ['kms:*'],
          resources: ['*'],
        }),
      ],
    });

    // ========================================
    // 4. KMS-KEY ERSTELLEN
    // ========================================

    this.key = new kms.Key(this, 'Key', {
      description,
      enableKeyRotation,
      policy: keyPolicy,
      removalPolicy,
    });

    // ========================================
    // 5. ALIAS ERSTELLEN
    // ========================================

    // WARUM Alias?
    // - Lesbarerer Name statt UUID
    // - Einfacher in Policies zu referenzieren

    const aliasName = props.alias ?? `alias/${id.toLowerCase()}`;

    this.key.addAlias(aliasName);

    // ========================================
    // 6. SERVICE-ZUGRIFF HINZUFÜGEN
    // ========================================

    // WICHTIG: Nur Services hinzufügen die explizit enabled sind
    // - Least-Privilege Prinzip

    if (props.enableLambdaAccess) {
      this.addServiceAccess('lambda.amazonaws.com');
    }

    if (props.enableSqsAccess) {
      this.addServiceAccess('sqs.amazonaws.com');
    }

    if (props.enableSnsAccess) {
      this.addServiceAccess('sns.amazonaws.com');
    }

    if (props.enableS3Access) {
      this.addServiceAccess('s3.amazonaws.com');
    }

    // ========================================
    // 7. TAGS
    // ========================================

    cdk.Tags.of(this.key).add('ManagedBy', 'CDK');
    cdk.Tags.of(this.key).add('Construct', 'KmsKeyManaged');
    cdk.Tags.of(this.key).add('Purpose', 'Encryption');

    // ========================================
    // 8. OUTPUTS
    // ========================================

    this.keyArn = this.key.keyArn;
    this.keyId = this.key.keyId;
  }

  /**
   * Fügt einem AWS-Service Zugriff auf den Key hinzu
   *
   * WARUM eigene Methode?
   * - DRY (Don't Repeat Yourself)
   * - Konsistente Permissions für alle Services
   *
   * @param servicePrincipal - z.B. 'lambda.amazonaws.com'
   */
  private addServiceAccess(servicePrincipal: string): void {
    this.key.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: `Allow ${servicePrincipal} to use key`,
        effect: iam.Effect.ALLOW,
        principals: [new iam.ServicePrincipal(servicePrincipal)],
        actions: [
          'kms:Decrypt',
          'kms:Encrypt',
          'kms:ReEncrypt*',
          'kms:GenerateDataKey*',
          'kms:DescribeKey',
        ],
        resources: ['*'], // Resource ist der Key selbst
      })
    );
  }

  /**
   * Ermittelt die Standard-RemovalPolicy basierend auf Stack-Name
   *
   * WARUM wichtig?
   * - Dev: DESTROY (automatisch löschen, spart Kosten)
   * - Prod: RETAIN (Keys behalten für Compliance)
   *
   * @returns RemovalPolicy.DESTROY für Dev, RETAIN für Prod
   */
  private getDefaultRemovalPolicy(): cdk.RemovalPolicy {
    const stackName = cdk.Stack.of(this).stackName.toLowerCase();

    // WARUM diese Patterns?
    // - Typische Namenskonventionen für Dev-Stacks
    // - Sicher: Prod-Stacks behalten Keys standardmäßig
    const devPatterns = ['dev', 'test', 'sandbox', 'local', 'demo'];
    const isDev = devPatterns.some((pattern) => stackName.includes(pattern));

    return isDev ? cdk.RemovalPolicy.DESTROY : cdk.RemovalPolicy.RETAIN;
  }

  /**
   * Validiert die Props
   *
   * WARUM validieren?
   * - Frühzeitiges Feedback
   * - Bessere Fehlermeldungen
   * - Verhindert AWS API Errors
   */
  private validateProps(props: KmsKeyManagedProps): void {
    // Prüfe Description (AWS Limit: 8192 Zeichen)
    if (props.description && props.description.length > 8192) {
      throw new Error('Description must be <= 8192 characters');
    }

    // Prüfe Alias
    if (props.alias) {
      // Muss mit 'alias/' beginnen
      if (!props.alias.startsWith('alias/')) {
        throw new Error('Alias must start with "alias/"');
      }

      // Darf nicht mit 'alias/aws/' beginnen (reserved)
      if (props.alias.startsWith('alias/aws/')) {
        throw new Error('Alias cannot start with "alias/aws/" (reserved for AWS managed keys)');
      }
    }
  }
}
