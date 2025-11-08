# Getting Started: Deine ersten 5 CDK Constructs (mit TDD)

> **Für:** Menschen, nicht LLMs 😊
> **Ziel:** Die 5 wichtigsten Basis-Constructs verstehen und mit TDD implementieren
> **Methode:** Test-Driven Development (RED → GREEN → REFACTOR)
> **Zeit:** ~2-3 Stunden pro Construct
> **Vorwissen:** Grundkenntnisse in TypeScript und AWS

---

## 🚨 **NEU: Test-Driven Development (TDD)**

**Ab sofort entwickeln wir alle Constructs mit TDD!**

### Was bedeutet das?

1. **Tests ZUERST schreiben** (bevor der Code existiert)
2. **RED → GREEN → REFACTOR** Zyklus einhalten
3. **Watch Mode** verwenden für sofortiges Feedback

### Quick Start mit TDD

```bash
# 1. Neues Construct erstellen (automatisch mit TDD-Setup)
cd 04-cdk-constructs
npm run scaffold primitives observability log-group-short-retention

# 2. TDD Watch Mode starten
cd primitives/observability/log-group-short-retention
npm run test:tdd

# 3. In anderem Terminal: Editor öffnen
vim test/unit.test.ts  # Test schreiben (RED)
vim src/index.ts       # Code implementieren (GREEN)
# Repeat: RED → GREEN → REFACTOR
```

### Detaillierter TDD Guide

📖 **[Vollständiger TDD Guide](./TDD_GUIDE.md)** - Schritt-für-Schritt Anleitung mit Beispielen

---

## 🎯 Warum diese 5 Constructs zuerst?

Diese 5 Constructs sind die **Grundbausteine** für fast jede AWS-Anwendung:

1. **log-group-short-retention** - Jede Anwendung braucht Logs
2. **iam-role-lambda-basic** - Jede Lambda-Funktion braucht Berechtigungen
3. **s3-bucket-secure** - Speicher ist fundamental
4. **sqs-queue-encrypted** - Warteschlangen für asynchrone Verarbeitung
5. **sns-topic-encrypted** - Notifications und Event-Routing

**Warum diese Reihenfolge?**
- Von einfach zu komplex
- Jedes baut Wissen für das nächste auf
- Keine Abhängigkeiten untereinander (können parallel entwickelt werden)

---

## 📚 Grundkonzepte verstehen

### Was ist ein CDK Construct?

Ein CDK Construct ist wie ein **Lego-Stein** für AWS-Infrastruktur:

```typescript
// Du schreibst:
new S3BucketSecure(this, 'MyBucket');

// CDK generiert daraus:
- S3 Bucket
- Bucket Policy (HTTPS-only)
- Block Public Access Settings
- Encryption Configuration
- Tags
```

### Anatomy eines Constructs

```typescript
export interface MyConstructProps {  // 1. Props: Was kann konfiguriert werden?
  readonly myProperty: string;
}

export class MyConstruct extends Construct {  // 2. Class: Die Logik
  public readonly output: string;  // 3. Outputs: Was kann weiterverwendet werden?

  constructor(scope: Construct, id: string, props: MyConstructProps) {
    super(scope, id);
    
    // 4. Validierung: Prüfe Eingaben
    // 5. Ressourcen: Erstelle AWS-Ressourcen
    // 6. Outputs: Setze öffentliche Properties
  }
}
```

---

## 🚀 Construct #1: log-group-short-retention

### Warum zuerst?

- **Einfachster Construct** - Nur 1 AWS-Ressource
- **Überall benötigt** - Jede Anwendung braucht Logs
- **Kostenkontrolle** - Logs können teuer werden
- **Lerneffekt** - Perfekt zum Verstehen der Struktur

### Was du lernst

- ✅ Wie man Props definiert
- ✅ Wie man Validierung macht
- ✅ Wie man AWS-Ressourcen erstellt
- ✅ Wie man Defaults intelligent setzt
- ✅ Wie man Outputs bereitstellt

### Schritt 1: Verstehe das Problem

**Problem:** CloudWatch Logs kosten Geld. Standard-Retention ist oft zu lang.

**Lösung:** Ein Construct der standardmäßig kurze Retention (14 Tage) setzt.

**Use-Case:**
```typescript
// Vorher: Jedes Mal manuell konfigurieren
const logGroup = new logs.LogGroup(this, 'Logs', {
  retention: logs.RetentionDays.TWO_WEEKS,
  removalPolicy: RemovalPolicy.DESTROY,
});

// Nachher: Intelligent defaults
const logGroup = new LogGroupShortRetention(this, 'Logs');
```

### Schritt 2: Erstelle die Struktur

```bash
cd ~/projects/aws-portfolio-setup/04-cdk-constructs
cd primitives/observability/log-group-short-retention

# Kopiere Template
cp -r ../../../.construct-template/* .
mv README.template.md README.md
mv src/index.template.ts src/index.ts
mv test/unit.test.template.ts test/unit.test.ts
# ... (alle anderen auch)
```

### Schritt 3: Implementiere die Props

**Datei:** `src/index.ts`

```typescript
import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib';
import * as logs from 'aws-cdk-lib/aws-logs';

/**
 * Properties für LogGroupShortRetention
 * 
 * WARUM readonly? TypeScript best practice - Props sollten nicht verändert werden
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
   * KMS Key für Verschlüsselung
   * 
   * WARUM optional?
   * - CloudWatch Logs sind standardmäßig verschlüsselt (AWS-managed)
   * - KMS kostet extra
   * - Nur nötig für Compliance-Anforderungen
   * 
   * @default - AWS-managed encryption
   */
  readonly kmsKey?: cdk.aws_kms.IKey;

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
```

**💡 Was du hier lernst:**
- `readonly` = Props können nicht verändert werden (Immutability)
- `?` = Optional property
- JSDoc Kommentare = Dokumentation für IDE Auto-Complete
- `@default` = Zeigt was passiert wenn nicht angegeben

### Schritt 4: Implementiere die Class

```typescript
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
    // 1. DEFAULTS SETZEN
    // ========================================
    
    // WARUM hier? Zentrale Stelle für alle Defaults
    const retentionDays = props.retentionDays ?? logs.RetentionDays.TWO_WEEKS;
    const removalPolicy = props.removalPolicy ?? this.getDefaultRemovalPolicy();

    // ========================================
    // 2. VALIDIERUNG
    // ========================================
    
    // WARUM validieren?
    // - Frühzeitig Fehler erkennen
    // - Bessere Fehlermeldungen als AWS
    // - Verhindert teure Fehlkonfigurationen
    
    if (props.logGroupName && props.logGroupName.length > 512) {
      throw new Error('Log group name must be <= 512 characters');
    }

    // ========================================
    // 3. RESSOURCEN ERSTELLEN
    // ========================================
    
    this.logGroup = new logs.LogGroup(this, 'LogGroup', {
      // Name: Optional, CDK generiert automatisch einen wenn nicht angegeben
      logGroupName: props.logGroupName,
      
      // Retention: WICHTIG für Kostenersparnis!
      retention: retentionDays,
      
      // Encryption: Optional, nur wenn KMS Key übergeben wurde
      encryptionKey: props.kmsKey,
      
      // Removal Policy: Was passiert beim Stack-Delete?
      removalPolicy: removalPolicy,
    });

    // ========================================
    // 4. TAGS HINZUFÜGEN
    // ========================================
    
    // WARUM Tags?
    // - Cost Allocation (wer zahlt?)
    // - Resource Management (was gehört zusammen?)
    // - Compliance (welche Standards?)
    
    cdk.Tags.of(this.logGroup).add('ManagedBy', 'CDK');
    cdk.Tags.of(this.logGroup).add('Construct', 'LogGroupShortRetention');
    cdk.Tags.of(this.logGroup).add('CostOptimized', 'true');

    // ========================================
    // 5. OUTPUTS SETZEN
    // ========================================
    
    // WARUM? Andere Constructs brauchen diese Informationen
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
   */
  private getDefaultRemovalPolicy(): cdk.RemovalPolicy {
    const stack = cdk.Stack.of(this);
    const stackName = stack.stackName.toLowerCase();
    
    // Liste von Keywords die auf Dev-Umgebungen hinweisen
    const devPatterns = ['dev', 'test', 'sandbox', 'local', 'demo'];
    const isDev = devPatterns.some(pattern => stackName.includes(pattern));
    
    return isDev ? cdk.RemovalPolicy.DESTROY : cdk.RemovalPolicy.RETAIN;
  }
}
```

**💡 Was du hier lernst:**
- Wie man AWS-Ressourcen erstellt
- Wie man intelligente Defaults setzt
- Wie man Environment-Detection macht
- Wie man Tags für Cost-Management nutzt
- Wie man Outputs bereitstellt

### Schritt 5: Schreibe Tests

**Datei:** `test/unit.test.ts`

```typescript
import { App, Stack } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import * as logs from 'aws-cdk-lib/aws-logs';
import { LogGroupShortRetention } from '../src';

describe('LogGroupShortRetention', () => {
  let app: App;
  let stack: Stack;

  beforeEach(() => {
    app = new App();
    stack = new Stack(app, 'TestStack');
  });

  /**
   * Test 1: Grundlegende Funktionalität
   * 
   * WARUM dieser Test?
   * - Stellt sicher dass der Construct überhaupt funktioniert
   * - Prüft dass eine Log-Gruppe erstellt wird
   */
  test('creates log group with default settings', () => {
    // Arrange & Act
    new LogGroupShortRetention(stack, 'TestLogs');

    // Assert
    const template = Template.fromStack(stack);
    
    // WARUM resourceCountIs?
    // - Stellt sicher dass genau 1 Log-Gruppe erstellt wird
    // - Verhindert versehentliche Duplikate
    template.resourceCountIs('AWS::Logs::LogGroup', 1);
  });

  /**
   * Test 2: Retention wird korrekt gesetzt
   * 
   * WARUM dieser Test?
   * - Retention ist kritisch für Kostenersparnis
   * - Muss korrekt ins CloudFormation Template übersetzt werden
   */
  test('sets correct retention days', () => {
    // Arrange & Act
    new LogGroupShortRetention(stack, 'TestLogs', {
      retentionDays: logs.RetentionDays.TWO_WEEKS,
    });

    const template = Template.fromStack(stack);

    // Assert
    // WARUM hasResourceProperties?
    // - Prüft dass die Retention korrekt gesetzt wurde
    // - 14 = TWO_WEEKS in CloudFormation
    template.hasResourceProperties('AWS::Logs::LogGroup', {
      RetentionInDays: 14,
    });
  });

  /**
   * Test 3: Custom Name funktioniert
   * 
   * WARUM dieser Test?
   * - Manche Use-Cases brauchen spezifische Namen
   * - z.B. für CloudWatch Insights Queries
   */
  test('uses custom log group name when provided', () => {
    // Arrange & Act
    const customName = '/aws/lambda/my-function';
    new LogGroupShortRetention(stack, 'TestLogs', {
      logGroupName: customName,
    });

    const template = Template.fromStack(stack);

    // Assert
    template.hasResourceProperties('AWS::Logs::LogGroup', {
      LogGroupName: customName,
    });
  });

  /**
   * Test 4: Outputs sind korrekt
   * 
   * WARUM dieser Test?
   * - Andere Constructs verlassen sich auf diese Outputs
   * - Müssen immer verfügbar sein
   */
  test('provides correct outputs', () => {
    // Arrange & Act
    const construct = new LogGroupShortRetention(stack, 'TestLogs');

    // Assert
    // WARUM toBeDefined?
    // - Stellt sicher dass die Outputs existieren
    // - Würde fehlschlagen wenn wir vergessen sie zu setzen
    expect(construct.logGroupArn).toBeDefined();
    expect(construct.logGroupName).toBeDefined();
    expect(construct.logGroup).toBeDefined();
  });

  /**
   * Test 5: Environment Detection
   * 
   * WARUM dieser Test?
   * - Stellt sicher dass Dev-Stacks DESTROY verwenden
   * - Kritisch für Kostenkontrolle
   */
  test('uses DESTROY removal policy for dev stacks', () => {
    // Arrange
    const devStack = new Stack(app, 'DevTestStack');

    // Act
    new LogGroupShortRetention(devStack, 'TestLogs');

    // Assert
    const template = Template.fromStack(devStack);
    template.hasResource('AWS::Logs::LogGroup', {
      DeletionPolicy: 'Delete',
    });
  });
});
```

**💡 Was du hier lernst:**
- Wie man CDK Template Assertions verwendet
- Warum jeder Test wichtig ist
- Wie man verschiedene Szenarien testet
- Wie man Outputs validiert

### Schritt 6: Erstelle Beispiele

**Datei:** `examples/basic.ts`

```typescript
/**
 * Basic Example: LogGroupShortRetention
 * 
 * WANN verwenden?
 * - Schnelles Prototyping
 * - Development/Test Umgebungen
 * - Wenn Standard-Retention (14 Tage) ausreicht
 */

import { App, Stack, StackProps, CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { LogGroupShortRetention } from '../src';

export class BasicExampleStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // ========================================
    // Beispiel 1: Minimal - Alle Defaults
    // ========================================
    
    // WARUM so einfach?
    // - CDK generiert automatisch einen Namen
    // - Retention ist 14 Tage
    // - RemovalPolicy wird automatisch erkannt
    
    const logs1 = new LogGroupShortRetention(this, 'MinimalLogs');

    // ========================================
    // Beispiel 2: Mit Custom Name
    // ========================================
    
    // WANN Custom Name?
    // - Lambda Log-Gruppen: /aws/lambda/function-name
    // - CloudWatch Insights Queries
    // - Organisatorische Standards
    
    const logs2 = new LogGroupShortRetention(this, 'CustomNameLogs', {
      logGroupName: '/my-app/api/logs',
    });

    // ========================================
    // Beispiel 3: Kürzere Retention für Tests
    // ========================================
    
    // WARUM kürzer?
    // - Test-Logs braucht man nicht lange
    // - Spart noch mehr Kosten
    // - z.B. für E2E-Tests
    
    const logs3 = new LogGroupShortRetention(this, 'TestLogs', {
      retentionDays: 7, // 1 Woche statt 2
    });

    // ========================================
    // Outputs: Für andere Stacks oder Scripts
    // ========================================
    
    new CfnOutput(this, 'LogGroupArn', {
      value: logs1.logGroupArn,
      description: 'ARN der Log-Gruppe (für IAM Policies)',
    });

    new CfnOutput(this, 'LogGroupName', {
      value: logs1.logGroupName,
      description: 'Name der Log-Gruppe (für CloudWatch Insights)',
    });
  }
}

// CDK App Setup
const app = new App();
new BasicExampleStack(app, 'LogGroupBasicExample', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'eu-central-1',
  },
});
```

### Schritt 7: Test & Deploy

```bash
# 1. Dependencies installieren
cd ~/projects/aws-portfolio-setup/04-cdk-constructs/primitives/observability/log-group-short-retention
npm install

# 2. TypeScript kompilieren
npm run build

# 3. Tests ausführen
npm test

# Erwartete Ausgabe:
# PASS  test/unit.test.ts
#   LogGroupShortRetention
#     ✓ creates log group with default settings (XXms)
#     ✓ sets correct retention days (XXms)
#     ✓ uses custom log group name when provided (XXms)
#     ✓ provides correct outputs (XXms)
#     ✓ uses DESTROY removal policy for dev stacks (XXms)
# 
# Test Suites: 1 passed, 1 total
# Tests:       5 passed, 5 total

# 4. Beispiel synthesizen
cd examples
npx cdk synth -a "npx ts-node basic.ts"

# 5. OPTIONAL: Wirklich deployen
# npx cdk deploy -a "npx ts-node basic.ts"
```

### 📝 Zusammenfassung Construct #1

**Was du gelernt hast:**
- ✅ Props-Interface definieren mit `readonly` und `?`
- ✅ JSDoc Kommentare für Dokumentation
- ✅ AWS-Ressourcen erstellen (CloudWatch Logs)
- ✅ Intelligente Defaults setzen
- ✅ Environment-Detection (Dev vs Prod)
- ✅ Tags für Cost-Management
- ✅ Outputs bereitstellen
- ✅ Tests schreiben mit CDK Assertions
- ✅ Beispiele erstellen

**Nächster Schritt:** Construct #2 baut auf diesem Wissen auf!

---

## 🔐 Construct #2: iam-role-lambda-basic

### Warum als zweites?

- **Häufig benötigt** - Jede Lambda-Funktion braucht eine Rolle
- **Sicherheit** - Zeigt Least-Privilege Prinzip
- **Erweiterbar** - Basis für komplexere IAM-Rollen
- **Praxisnah** - Wird in fast jedem Projekt gebraucht

### Was du neu lernst

- ✅ IAM Policies erstellen
- ✅ AssumeRole konfigurieren
- ✅ Conditionals in Props (optional features)
- ✅ Array-Properties verwenden
- ✅ Sicherheits-Best-Practices

### Das Problem verstehen

**Problem:** Jede Lambda-Funktion braucht:
1. Eine IAM-Rolle zum Ausführen
2. Berechtigungen für CloudWatch Logs
3. Optional: X-Ray Tracing
4. Optional: Zusätzliche Policies

**Ohne Construct:**
```typescript
// 15-20 Zeilen Code jedes Mal...
const role = new iam.Role(this, 'Role', {
  assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
  managedPolicies: [
    iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
  ],
});
```

**Mit Construct:**
```typescript
// 1 Zeile, sichere Defaults
const role = new IamRoleLambdaBasic(this, 'Role');
```

### Implementierung

**Datei:** `src/index.ts`

```typescript
import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';

/**
 * Properties für IamRoleLambdaBasic
 */
export interface IamRoleLambdaBasicProps {
  /**
   * Beschreibung der Rolle
   * 
   * WARUM wichtig?
   * - Dokumentation in AWS Console
   * - Hilft beim Debugging
   * - Compliance/Auditing
   * 
   * @default 'Lambda execution role created by CDK'
   */
  readonly description?: string;

  /**
   * X-Ray Tracing aktivieren?
   * 
   * WARUM optional?
   * - X-Ray kostet Geld
   * - Nicht für alle Lambdas nötig
   * - Dev: meist nicht nötig, Prod: empfohlen
   * 
   * @default false
   */
  readonly enableXray?: boolean;

  /**
   * Zusätzliche IAM-Policies
   * 
   * WARUM Array?
   * - Eine Lambda braucht oft mehrere Berechtigungen
   * - z.B. DynamoDB + S3 + SQS
   * - Flexibel erweiterbar
   * 
   * BEISPIEL:
   * ```ts
   * extraPolicies: [
   *   new iam.PolicyStatement({
   *     actions: ['dynamodb:GetItem'],
   *     resources: [table.tableArn],
   *   }),
   * ]
   * ```
   * 
   * @default []
   */
  readonly extraPolicies?: iam.PolicyStatement[];

  /**
   * Name der Rolle
   * 
   * WARUM optional?
   * - CDK generiert automatisch eindeutigen Namen
   * - Nur setzen wenn Organisation spezifische Namenskonvention hat
   * 
   * @default - Auto-generated by CDK
   */
  readonly roleName?: string;
}

/**
 * IAM-Rolle für Lambda mit Least-Privilege Prinzip
 * 
 * WARUM dieser Construct?
 * 1. Sicherheit: Minimal nötige Berechtigungen
 * 2. Standardisierung: Überall gleiche Basis-Permissions
 * 3. Wartbarkeit: Zentrale Stelle für Updates
 * 
 * WAS macht er?
 * - Erstellt IAM-Rolle für Lambda
 * - Fügt CloudWatch Logs Berechtigungen hinzu
 * - Optional: X-Ray Tracing
 * - Optional: Zusätzliche Policies
 * 
 * @example
 * ```ts
 * // Minimal
 * const role = new IamRoleLambdaBasic(this, 'Role');
 * 
 * // Mit X-Ray
 * const role = new IamRoleLambdaBasic(this, 'Role', {
 *   enableXray: true,
 * });
 * 
 * // Mit zusätzlichen Permissions
 * const role = new IamRoleLambdaBasic(this, 'Role', {
 *   extraPolicies: [
 *     new iam.PolicyStatement({
 *       actions: ['s3:GetObject'],
 *       resources: ['arn:aws:s3:::my-bucket/*'],
 *     }),
 *   ],
 * });
 * ```
 */
export class IamRoleLambdaBasic extends Construct {
  /**
   * Die erstellte IAM-Rolle
   * 
   * WARUM public?
   * - Lambda-Function braucht diese Rolle
   * - Andere Constructs müssen darauf zugreifen können
   */
  public readonly role: iam.Role;

  /**
   * ARN der Rolle
   * 
   * WARUM extra Property?
   * - Häufig benötigt für Cross-Account Zugriff
   * - Für CloudFormation Outputs
   */
  public readonly roleArn: string;

  /**
   * Name der Rolle
   * 
   * WARUM extra Property?
   * - Für CLI-Scripts
   * - Für Debugging in AWS Console
   */
  public readonly roleName: string;

  constructor(scope: Construct, id: string, props: IamRoleLambdaBasicProps = {}) {
    super(scope, id);

    // ========================================
    // 1. VALIDIERUNG
    // ========================================
    
    this.validateProps(props);

    // ========================================
    // 2. IAM-ROLLE ERSTELLEN
    // ========================================
    
    this.role = new iam.Role(this, 'Role', {
      // WARUM lambda.amazonaws.com?
      // - Lambda-Service muss diese Rolle "assume" können
      // - Standard für alle Lambda-Funktionen
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      
      // Beschreibung: Wichtig für Dokumentation
      description: props.description ?? 'Lambda execution role created by CDK',
      
      // Name: Optional, CDK generiert automatisch einen wenn nicht angegeben
      roleName: props.roleName,
    });

    // ========================================
    // 3. CLOUDWATCH LOGS BERECHTIGUNGEN
    // ========================================
    
    // WARUM diese Permissions?
    // - CreateLogGroup: Erstelle Log-Gruppe (falls nicht vorhanden)
    // - CreateLogStream: Erstelle Log-Stream für Lambda-Invocation
    // - PutLogEvents: Schreibe Log-Einträge
    
    this.role.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'logs:CreateLogGroup',
        'logs:CreateLogStream',
        'logs:PutLogEvents',
      ],
      // WICHTIG: Resource auf spezifische Log-Gruppe einschränken!
      // Nicht '*' verwenden (wäre unsicher)
      resources: [
        `arn:aws:logs:${cdk.Stack.of(this).region}:${cdk.Stack.of(this).account}:log-group:/aws/lambda/*`,
      ],
    }));

    // ========================================
    // 4. OPTIONAL: X-RAY TRACING
    // ========================================
    
    // WARUM conditional?
    // - X-Ray kostet Geld
    // - Nicht für alle Lambdas nötig
    // - Nur hinzufügen wenn explizit gewünscht
    
    if (props.enableXray) {
      this.role.addToPolicy(new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'xray:PutTraceSegments',      // Sende Trace-Daten
          'xray:PutTelemetryRecords',   // Sende Telemetrie
        ],
        resources: ['*'],  // X-Ray erlaubt keine Resource-Einschränkung
      }));
    }

    // ========================================
    // 5. OPTIONAL: ZUSÄTZLICHE POLICIES
    // ========================================
    
    // WARUM Array durchgehen?
    // - User kann mehrere Policies hinzufügen
    // - z.B. DynamoDB + S3 + SQS
    
    if (props.extraPolicies && props.extraPolicies.length > 0) {
      props.extraPolicies.forEach((policy, index) => {
        this.role.addToPolicy(policy);
      });
    }

    // ========================================
    // 6. TAGS
    // ========================================
    
    cdk.Tags.of(this.role).add('ManagedBy', 'CDK');
    cdk.Tags.of(this.role).add('Construct', 'IamRoleLambdaBasic');
    cdk.Tags.of(this.role).add('Purpose', 'LambdaExecution');

    // ========================================
    // 7. OUTPUTS
    // ========================================
    
    this.roleArn = this.role.roleArn;
    this.roleName = this.role.roleName;
  }

  /**
   * Validiert die Props
   * 
   * WARUM validieren?
   * - Frühzeitiges Feedback
   * - Bessere Fehlermeldungen
   * - Verhindert AWS API Errors
   */
  private validateProps(props: IamRoleLambdaBasicProps): void {
    // Prüfe Role-Name (AWS Limits)
    if (props.roleName) {
      if (props.roleName.length > 64) {
        throw new Error('Role name must be <= 64 characters');
      }
      
      // AWS erlaubt nur bestimmte Zeichen
      const validPattern = /^[\w+=,.@-]+$/;
      if (!validPattern.test(props.roleName)) {
        throw new Error('Role name must match pattern: [\\w+=,.@-]+');
      }
    }

    // Prüfe Extra-Policies (sinnvolles Limit)
    if (props.extraPolicies && props.extraPolicies.length > 10) {
      throw new Error('Maximum 10 extra policies allowed (AWS limit)');
    }
  }
}
```

**💡 Was du neu lernst:**
- IAM Policies mit Actions + Resources
- AssumeRole-Prinzip für Services
- Conditional Logic (if/else für Features)
- Array-Properties verwenden
- Resource ARNs dynamisch konstruieren

### Tests

```typescript
import { App, Stack } from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import * as iam from 'aws-cdk-lib/aws-iam';
import { IamRoleLambdaBasic } from '../src';

describe('IamRoleLambdaBasic', () => {
  let app: App;
  let stack: Stack;

  beforeEach(() => {
    app = new App();
    stack = new Stack(app, 'TestStack');
  });

  test('creates IAM role with correct assume role policy', () => {
    new IamRoleLambdaBasic(stack, 'TestRole');

    const template = Template.fromStack(stack);
    
    // Prüfe dass Rolle existiert
    template.resourceCountIs('AWS::IAM::Role', 1);
    
    // Prüfe AssumeRole Policy
    template.hasResourceProperties('AWS::IAM::Role', {
      AssumeRolePolicyDocument: {
        Statement: Match.arrayWith([
          Match.objectLike({
            Effect: 'Allow',
            Principal: {
              Service: 'lambda.amazonaws.com',
            },
            Action: 'sts:AssumeRole',
          }),
        ]),
      },
    });
  });

  test('includes CloudWatch Logs permissions', () => {
    new IamRoleLambdaBasic(stack, 'TestRole');

    const template = Template.fromStack(stack);
    
    // Prüfe Logs-Permissions
    template.hasResourceProperties('AWS::IAM::Role', {
      Policies: Match.arrayWith([
        Match.objectLike({
          PolicyDocument: {
            Statement: Match.arrayWith([
              Match.objectLike({
                Effect: 'Allow',
                Action: Match.arrayWith([
                  'logs:CreateLogGroup',
                  'logs:CreateLogStream',
                  'logs:PutLogEvents',
                ]),
              }),
            ]),
          },
        }),
      ]),
    });
  });

  test('adds X-Ray permissions when enabled', () => {
    new IamRoleLambdaBasic(stack, 'TestRole', {
      enableXray: true,
    });

    const template = Template.fromStack(stack);
    
    // Prüfe X-Ray Permissions
    template.hasResourceProperties('AWS::IAM::Role', {
      Policies: Match.arrayWith([
        Match.objectLike({
          PolicyDocument: {
            Statement: Match.arrayWith([
              Match.objectLike({
                Effect: 'Allow',
                Action: Match.arrayWith([
                  'xray:PutTraceSegments',
                  'xray:PutTelemetryRecords',
                ]),
              }),
            ]),
          },
        }),
      ]),
    });
  });

  test('adds extra policies when provided', () => {
    const extraPolicy = new iam.PolicyStatement({
      actions: ['s3:GetObject'],
      resources: ['arn:aws:s3:::my-bucket/*'],
    });

    new IamRoleLambdaBasic(stack, 'TestRole', {
      extraPolicies: [extraPolicy],
    });

    const template = Template.fromStack(stack);
    
    // Prüfe Extra Policy
    template.hasResourceProperties('AWS::IAM::Role', {
      Policies: Match.arrayWith([
        Match.objectLike({
          PolicyDocument: {
            Statement: Match.arrayWith([
              Match.objectLike({
                Effect: 'Allow',
                Action: ['s3:GetObject'],
              }),
            ]),
          },
        }),
      ]),
    });
  });

  test('throws error for invalid role name', () => {
    expect(() => {
      new IamRoleLambdaBasic(stack, 'TestRole', {
        roleName: 'a'.repeat(65), // Zu lang!
      });
    }).toThrow('Role name must be <= 64 characters');
  });

  test('provides correct outputs', () => {
    const construct = new IamRoleLambdaBasic(stack, 'TestRole');

    expect(construct.role).toBeDefined();
    expect(construct.roleArn).toBeDefined();
    expect(construct.roleName).toBeDefined();
  });
});
```

### 📝 Zusammenfassung Construct #2

**Was du NEU gelernt hast:**
- ✅ IAM Roles + AssumeRole Policies
- ✅ Conditional Features (if/else)
- ✅ Array-Properties verwenden
- ✅ Resource ARNs dynamisch konstruieren
- ✅ Sicherheits-Best-Practices (Least Privilege)
- ✅ Match.arrayWith() für komplexe Assertions

---

## 💾 Construct #3-5: Schnellübersicht

Da du jetzt die Grundlagen verstanden hast, gebe ich dir für die nächsten 3 Constructs eine schnellere Übersicht mit den wichtigsten Punkten:

### Construct #3: s3-bucket-secure

**Schwierigkeitsgrad:** Mittel  
**Neue Konzepte:** Bucket Policies, Block Public Access, Bucket Encryption

**Kernlogik:**
```typescript
// Block Public Access (ALLE 4 Optionen!)
blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,

// Encryption
encryption: s3.BucketEncryption.S3_MANAGED,

// HTTPS-Only Policy
bucket.addToResourcePolicy(new iam.PolicyStatement({
  effect: iam.Effect.DENY,
  principals: [new iam.AnyPrincipal()],
  actions: ['s3:*'],
  resources: [bucket.arnForObjects('*')],
  conditions: {
    Bool: { 'aws:SecureTransport': 'false' },
  },
}));
```

**Besonderheit:** Bucket Policy für HTTPS-Enforcement

### Construct #4: sqs-queue-encrypted

**Schwierigkeitsgrad:** Mittel  
**Neue Konzepte:** DLQ (Dead Letter Queue), Message Retention

**Kernlogik:**
```typescript
// Optional: DLQ für Failed Messages
let dlq: sqs.Queue | undefined;
if (props.withDlq) {
  dlq = new sqs.Queue(this, 'DLQ', {
    retentionPeriod: cdk.Duration.days(14),
  });
}

// Haupt-Queue
const queue = new sqs.Queue(this, 'Queue', {
  visibilityTimeout: cdk.Duration.seconds(props.visibilityTimeout),
  deadLetterQueue: dlq ? {
    queue: dlq,
    maxReceiveCount: 3,  // Nach 3 Versuchen → DLQ
  } : undefined,
});
```

**Besonderheit:** DLQ ist optional (Kostenkontrolle)

### Construct #5: sns-topic-encrypted

**Schwierigkeitsgrad:** Einfach  
**Neue Konzepte:** Pub/Sub Pattern, Topic Subscriptions

**Kernlogik:**
```typescript
const topic = new sns.Topic(this, 'Topic', {
  displayName: props.displayName,
  // KMS Encryption (optional)
  masterKey: props.kmsKey,
});

// Helper-Methode zum Hinzufügen von Subscriptions
public addEmailSubscription(email: string): void {
  this.topic.addSubscription(new subscriptions.EmailSubscription(email));
}
```

**Besonderheit:** Sehr einfach, aber wichtig für Event-Driven Architecture

---

## 🎯 Deine Roadmap

### Woche 1: Basis-Constructs
- [ ] Tag 1-2: log-group-short-retention (einfach)
- [ ] Tag 3-4: iam-role-lambda-basic (mittel)
- [ ] Tag 5: s3-bucket-secure (mittel)

### Woche 2: Messaging
- [ ] Tag 1-2: sqs-queue-encrypted
- [ ] Tag 3: sns-topic-encrypted

### Woche 3: Integration
- [ ] Tag 1-2: Alle Tests nochmal durchgehen
- [ ] Tag 3: Beispiele für Kombinationen erstellen
- [ ] Tag 4-5: Dokumentation vervollständigen

---

## 📚 Ressourcen & Hilfe

### Wenn du stecken bleibst

1. **CDK Docs:** https://docs.aws.amazon.com/cdk/api/v2/
2. **Existing Code:** Schau in `.construct-template/` nach Beispielen
3. **Tests laufen lassen:** `npm test` gibt oft hilfreiche Fehler
4. **CDK synth:** Schau dir das generierte CloudFormation an

### Debugging-Tipps

```bash
# CloudFormation Template anschauen
cdk synth -a "npx ts-node examples/basic.ts"

# Mit mehr Details
cdk synth --verbose

# Nur validieren (kein Deploy)
cdk diff
```

### Häufige Fehler

**1. "Cannot find module"**
```bash
# Lösung: Dependencies installieren
npm install
```

**2. TypeScript Compilation Error**
```bash
# Lösung: Build ausführen
npm run build
```

**3. Test schlägt fehl**
```bash
# Lösung: Genaue Fehlermeldung lesen
npm test -- --verbose
```

---

## ✅ Checkliste pro Construct

- [ ] Props-Interface definiert mit JSDoc
- [ ] Constructor implementiert mit Validierung
- [ ] AWS-Ressourcen erstellt
- [ ] Tags hinzugefügt
- [ ] Outputs gesetzt
- [ ] Mindestens 5 Tests geschrieben
- [ ] Tests laufen durch (`npm test`)
- [ ] Basic Example erstellt
- [ ] CDK synth funktioniert
- [ ] README aktualisiert (Props/Outputs stimmen)
- [ ] CHANGELOG.md erstellt

---

## 🎉 Abschluss

Nach diesen 5 Constructs hast du:

1. ✅ Die CDK Construct-Struktur verstanden
2. ✅ AWS-Ressourcen mit Best Practices erstellt
3. ✅ Tests geschrieben und verstanden warum
4. ✅ Intelligente Defaults implementiert
5. ✅ Die Basis für alle weiteren Constructs gelegt

**Die nächsten 8 Constructs werden viel einfacher sein, weil du jetzt die Patterns kennst!**

---

**Viel Erfolg! 🚀**

Wenn etwas unklar ist, schau in die Template-Dateien oder frag nach!
