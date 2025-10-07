import { App, Stack, RemovalPolicy } from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { {ConstructName} } from '../src';

/**
 * Test Suite für {ConstructName}
 */
describe('{ConstructName}', () => {
  let app: App;
  let stack: Stack;

  /**
   * Setup: Wird vor jedem Test ausgeführt
   */
  beforeEach(() => {
    app = new App();
    stack = new Stack(app, 'TestStack', {
      env: {
        account: '123456789012',
        region: 'eu-central-1',
      },
    });
  });

  /**
   * Cleanup: Wird nach jedem Test ausgeführt
   */
  afterEach(() => {
    // Optional: Cleanup falls benötigt
  });

  // ========================================
  // Basic Tests
  // ========================================

  describe('Basic Functionality', () => {
    test('creates construct with minimal configuration', () => {
      // Arrange & Act
      new {ConstructName}(stack, 'TestConstruct', {
        requiredProp: 'test-value',
      });

      // Assert
      const template = Template.fromStack(stack);
      
      // Beispiel: Prüfe dass Ressource erstellt wurde
      // template.resourceCountIs('AWS::S3::Bucket', 1);
      
      // TODO: Füge deine Assertions hinzu
    });

    test('creates expected resources', () => {
      // Arrange & Act
      new {ConstructName}(stack, 'TestConstruct', {
        requiredProp: 'test-value',
      });

      const template = Template.fromStack(stack);

      // Assert: Prüfe spezifische Resource Properties
      // Beispiel für S3 Bucket:
      // template.hasResourceProperties('AWS::S3::Bucket', {
      //   BucketEncryption: {
      //     ServerSideEncryptionConfiguration: [{
      //       ServerSideEncryptionByDefault: {
      //         SSEAlgorithm: 'AES256',
      //       },
      //     }],
      //   },
      //   PublicAccessBlockConfiguration: {
      //     BlockPublicAcls: true,
      //     BlockPublicPolicy: true,
      //     IgnorePublicAcls: true,
      //     RestrictPublicBuckets: true,
      //   },
      // });

      // TODO: Füge deine spezifischen Assertions hinzu
    });

    test('sets correct outputs', () => {
      // Arrange & Act
      const construct = new {ConstructName}(stack, 'TestConstruct', {
        requiredProp: 'test-value',
      });

      // Assert
      expect(construct.{outputProperty1}).toBeDefined();
      // expect(construct.{outputProperty1}).toMatch(/^arn:aws:/);
      
      // TODO: Prüfe deine Outputs
    });
  });

  // ========================================
  // Configuration Tests
  // ========================================

  describe('Configuration Options', () => {
    test('respects optional prop when enabled', () => {
      // Arrange & Act
      new {ConstructName}(stack, 'TestConstruct', {
        requiredProp: 'test-value',
        optionalProp: true,
      });

      const template = Template.fromStack(stack);

      // Assert: Prüfe zusätzliche Ressourcen/Konfiguration
      // TODO: Implementiere Test für optionale Features
    });

    test('uses custom removal policy', () => {
      // Arrange & Act
      new {ConstructName}(stack, 'TestConstruct', {
        requiredProp: 'test-value',
        removalPolicy: RemovalPolicy.DESTROY,
      });

      const template = Template.fromStack(stack);

      // Assert
      template.hasResource('AWS::{Service}::{Resource}', {
        DeletionPolicy: 'Delete',
      });
    });

    test('applies custom tags', () => {
      // Arrange
      const customTags = {
        Environment: 'test',
        Team: 'platform',
      };

      // Act
      new {ConstructName}(stack, 'TestConstruct', {
        requiredProp: 'test-value',
        tags: customTags,
      });

      const template = Template.fromStack(stack);

      // Assert: Prüfe dass Tags angewendet wurden
      // Note: Tags werden im synthesized template sichtbar
      const json = template.toJSON();
      expect(json).toBeDefined();
    });
  });

  // ========================================
  // Security Tests
  // ========================================

  describe('Security Features', () => {
    test('enables encryption by default', () => {
      // Arrange & Act
      new {ConstructName}(stack, 'TestConstruct', {
        requiredProp: 'test-value',
      });

      const template = Template.fromStack(stack);

      // Assert: Beispiel für Verschlüsselung
      // template.hasResourceProperties('AWS::S3::Bucket', {
      //   BucketEncryption: Match.objectLike({
      //     ServerSideEncryptionConfiguration: Match.arrayWith([
      //       Match.objectLike({
      //         ServerSideEncryptionByDefault: Match.objectLike({
      //           SSEAlgorithm: Match.anyValue(),
      //         }),
      //       }),
      //     ]),
      //   }),
      // });

      // TODO: Implementiere Security-Tests
    });

    test('follows least privilege principle for IAM', () => {
      // Arrange & Act
      new {ConstructName}(stack, 'TestConstruct', {
        requiredProp: 'test-value',
      });

      const template = Template.fromStack(stack);

      // Assert: Prüfe IAM Policies
      // Beispiel:
      // template.hasResourceProperties('AWS::IAM::Role', {
      //   Policies: Match.arrayWith([
      //     Match.objectLike({
      //       PolicyDocument: {
      //         Statement: Match.arrayWith([
      //           Match.objectLike({
      //             Effect: 'Allow',
      //             Action: Match.not(['*']), // Keine Wildcard-Permissions
      //           }),
      //         ]),
      //       },
      //     }),
      //   ]),
      // });

      // TODO: Implementiere IAM-Tests
    });
  });

  // ========================================
  // Validation Tests
  // ========================================

  describe('Input Validation', () => {
    test('throws error for empty requiredProp', () => {
      // Arrange & Act & Assert
      expect(() => {
        new {ConstructName}(stack, 'TestConstruct', {
          requiredProp: '',
        });
      }).toThrow('requiredProp darf nicht leer sein');
    });

    test('throws error for invalid configuration', () => {
      // TODO: Implementiere weitere Validierungs-Tests
      // Beispiel:
      // expect(() => {
      //   new {ConstructName}(stack, 'TestConstruct', {
      //     requiredProp: 'test',
      //     someNumber: 999, // Ungültiger Wert
      //   });
      // }).toThrow('someNumber muss zwischen 1 und 100 liegen');
    });
  });

  // ========================================
  // Integration Tests (mit anderen Constructs)
  // ========================================

  describe('Integration', () => {
    test('integrates with other constructs', () => {
      // Arrange: Erstelle abhängige Constructs
      // const dependency = new OtherConstruct(stack, 'Dependency', { ... });

      // Act
      // new {ConstructName}(stack, 'TestConstruct', {
      //   requiredProp: 'test-value',
      //   dependencyRef: dependency.output,
      // });

      // Assert
      const template = Template.fromStack(stack);
      
      // Prüfe dass Ressourcen korrekt verknüpft sind
      // TODO: Implementiere Integration-Tests
    });
  });

  // ========================================
  // Snapshot Tests
  // ========================================

  describe('Snapshot Tests', () => {
    test('matches snapshot for minimal config', () => {
      // Arrange & Act
      new {ConstructName}(stack, 'TestConstruct', {
        requiredProp: 'test-value',
      });

      // Assert
      const template = Template.fromStack(stack);
      expect(template.toJSON()).toMatchSnapshot();
    });

    test('matches snapshot for full config', () => {
      // Arrange & Act
      new {ConstructName}(stack, 'TestConstruct', {
        requiredProp: 'test-value',
        optionalProp: true,
        removalPolicy: RemovalPolicy.DESTROY,
        tags: {
          Environment: 'test',
        },
      });

      // Assert
      const template = Template.fromStack(stack);
      expect(template.toJSON()).toMatchSnapshot();
    });
  });

  // ========================================
  // Edge Cases
  // ========================================

  describe('Edge Cases', () => {
    test('handles multiple instances in same stack', () => {
      // Arrange & Act
      new {ConstructName}(stack, 'TestConstruct1', {
        requiredProp: 'value-1',
      });

      new {ConstructName}(stack, 'TestConstruct2', {
        requiredProp: 'value-2',
      });

      // Assert
      const template = Template.fromStack(stack);
      // template.resourceCountIs('AWS::S3::Bucket', 2);
      
      // TODO: Prüfe dass beide Instanzen korrekt erstellt wurden
    });

    test('works in cross-stack scenario', () => {
      // Arrange
      const stack2 = new Stack(app, 'TestStack2');

      // Act
      const construct = new {ConstructName}(stack, 'TestConstruct', {
        requiredProp: 'test-value',
      });

      // Verwende Output in anderem Stack
      // new OtherConstruct(stack2, 'Other', {
      //   input: construct.{outputProperty1},
      // });

      // Assert
      // TODO: Prüfe Cross-Stack Referenzen
    });
  });
});

/**
 * Helper-Funktionen für Tests
 */

/**
 * Erstellt eine Test-Konfiguration
 */
function createTestConfig(overrides?: Partial<{ConstructName}Props>): {ConstructName}Props {
  return {
    requiredProp: 'test-value',
    ...overrides,
  };
}

/**
 * Prüft ob eine Ressource im Template existiert
 */
function assertResourceExists(
  template: Template,
  resourceType: string,
  count: number = 1
): void {
  template.resourceCountIs(resourceType, count);
}

/**
 * Beispiel für komplexe Assertion mit Match Patterns
 */
function assertResourceHasProperty(
  template: Template,
  resourceType: string,
  propertyPath: string,
  expectedValue: any
): void {
  const resources = template.findResources(resourceType);
  const resourceKeys = Object.keys(resources);
  
  expect(resourceKeys.length).toBeGreaterThan(0);
  
  // Weitere Custom-Logik nach Bedarf
}
