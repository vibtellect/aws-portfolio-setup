import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib';
// Import benötigter AWS Services
// Beispiele:
// import * as s3 from 'aws-cdk-lib/aws-s3';
// import * as lambda from 'aws-cdk-lib/aws-lambda';
// import * as iam from 'aws-cdk-lib/aws-iam';
// import * as logs from 'aws-cdk-lib/aws-logs';

/**
 * Properties für {ConstructName}
 * 
 * @example
 * ```ts
 * const props: {ConstructName}Props = {
 *   requiredProp: "value",
 *   optionalProp: true,
 * };
 * ```
 */
export interface {ConstructName}Props {
  /**
   * {Beschreibung der Property}
   * 
   * @example "my-value"
   */
  readonly requiredProp: string;

  /**
   * {Beschreibung der optionalen Property}
   * 
   * @default false
   */
  readonly optionalProp?: boolean;

  /**
   * Removal Policy für die Ressourcen
   * 
   * @default RemovalPolicy.RETAIN für Production, DESTROY für Development
   */
  readonly removalPolicy?: cdk.RemovalPolicy;

  /**
   * Tags die auf alle Ressourcen angewendet werden
   * 
   * @default {}
   */
  readonly tags?: Record<string, string>;
}

/**
 * {ConstructName} - {Kurze Beschreibung}
 * 
 * Dieser Construct erstellt:
 * - {Ressource 1}
 * - {Ressource 2}
 * - {Ressource 3}
 * 
 * @example
 * ```ts
 * // Minimale Konfiguration
 * const construct = new {ConstructName}(this, 'MyConstruct', {
 *   requiredProp: "value",
 * });
 * 
 * // Zugriff auf Outputs
 * console.log(construct.{outputProperty});
 * ```
 * 
 * @example
 * ```ts
 * // Production-Konfiguration
 * const construct = new {ConstructName}(this, 'MyConstruct', {
 *   requiredProp: "production-value",
 *   optionalProp: true,
 *   removalPolicy: cdk.RemovalPolicy.RETAIN,
 * });
 * ```
 */
export class {ConstructName} extends Construct {
  /**
   * {Beschreibung des Output 1}
   * @example "arn:aws:service:region:account:resource/name"
   */
  public readonly {outputProperty1}: string;

  /**
   * {Beschreibung des Output 2}
   * @example "https://example.amazonaws.com"
   */
  public readonly {outputProperty2}?: string;

  /**
   * CDK-Referenz zur Hauptressource für erweiterte Nutzung
   */
  public readonly {resourceReference}: {ResourceType};

  constructor(scope: Construct, id: string, props: {ConstructName}Props) {
    super(scope, id);

    // Validierung der Props
    this.validateProps(props);

    // Defaults setzen
    const removalPolicy = props.removalPolicy ?? this.getDefaultRemovalPolicy();

    // ========================================
    // Hauptressourcen erstellen
    // ========================================

    // Beispiel: S3 Bucket
    // const bucket = new s3.Bucket(this, 'Bucket', {
    //   bucketName: props.requiredProp,
    //   encryption: s3.BucketEncryption.S3_MANAGED,
    //   blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    //   removalPolicy: removalPolicy,
    //   autoDeleteObjects: removalPolicy === cdk.RemovalPolicy.DESTROY,
    // });

    // Beispiel: Lambda Function
    // const fn = new lambda.Function(this, 'Function', {
    //   runtime: lambda.Runtime.NODEJS_18_X,
    //   handler: 'index.handler',
    //   code: lambda.Code.fromInline('exports.handler = async () => ({ statusCode: 200 });'),
    //   environment: {
    //     CONFIG: props.requiredProp,
    //   },
    // });

    // TODO: Implementiere deine Ressourcen hier

    // ========================================
    // Optionale Features
    // ========================================

    if (props.optionalProp) {
      // Zusätzliche Konfiguration wenn optionalProp aktiviert
      // Beispiel: Logging, Monitoring, etc.
    }

    // ========================================
    // Tags anwenden
    // ========================================

    if (props.tags) {
      Object.entries(props.tags).forEach(([key, value]) => {
        cdk.Tags.of(this).add(key, value);
      });
    }

    // Metadata für besseres Tracking
    cdk.Tags.of(this).add('ManagedBy', 'CDK');
    cdk.Tags.of(this).add('Construct', '{ConstructName}');

    // ========================================
    // Outputs setzen
    // ========================================

    // this.{outputProperty1} = bucket.bucketArn;
    // this.{outputProperty2} = bucket.bucketWebsiteUrl;
    // this.{resourceReference} = bucket;

    // TODO: Setze deine Outputs

    // ========================================
    // CloudFormation Outputs (optional)
    // ========================================

    // new cdk.CfnOutput(this, 'Output1', {
    //   value: this.{outputProperty1},
    //   description: '{Beschreibung}',
    //   exportName: `${cdk.Stack.of(this).stackName}-{OutputName}`,
    // });
  }

  /**
   * Validiert die übergebenen Properties
   * 
   * @param props - Die zu validierenden Properties
   * @throws Error wenn Validierung fehlschlägt
   */
  private validateProps(props: {ConstructName}Props): void {
    // Beispiel-Validierungen
    if (!props.requiredProp || props.requiredProp.trim() === '') {
      throw new Error('requiredProp darf nicht leer sein');
    }

    // Weitere Validierungen nach Bedarf
    // if (props.someNumber && (props.someNumber < 1 || props.someNumber > 100)) {
    //   throw new Error('someNumber muss zwischen 1 und 100 liegen');
    // }
  }

  /**
   * Ermittelt die Standard-RemovalPolicy basierend auf dem Stack
   * 
   * @returns RemovalPolicy.DESTROY für Dev/Test, RETAIN für Production
   */
  private getDefaultRemovalPolicy(): cdk.RemovalPolicy {
    const stack = cdk.Stack.of(this);
    const stackName = stack.stackName.toLowerCase();
    
    // Heuristik: dev/test/sandbox Stacks → DESTROY, sonst RETAIN
    const devPatterns = ['dev', 'test', 'sandbox', 'local'];
    const isDev = devPatterns.some(pattern => stackName.includes(pattern));
    
    return isDev ? cdk.RemovalPolicy.DESTROY : cdk.RemovalPolicy.RETAIN;
  }
}

/**
 * Helper-Funktionen (Optional)
 */

/**
 * Generiert einen eindeutigen Namen basierend auf Stack und Construct
 * 
 * @param scope - CDK Construct Scope
 * @param suffix - Optionaler Suffix
 * @returns Eindeutiger Name
 */
export function generateUniqueName(scope: Construct, suffix?: string): string {
  const stack = cdk.Stack.of(scope);
  const parts = [
    stack.stackName.toLowerCase(),
    scope.node.id.toLowerCase(),
  ];
  
  if (suffix) {
    parts.push(suffix);
  }
  
  return parts.join('-');
}

/**
 * Beispiel für Custom Type/Interface (falls benötigt)
 */
export interface CustomConfiguration {
  readonly setting1: string;
  readonly setting2: number;
  readonly setting3?: boolean;
}
