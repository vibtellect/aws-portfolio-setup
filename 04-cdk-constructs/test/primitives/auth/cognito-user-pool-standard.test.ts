import { describe, test, beforeEach, expect } from '@jest/globals';
import { App, Stack, Duration } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { CognitoUserPoolStandard } from '../../../src/primitives/auth/cognito-user-pool-standard';

describe('CognitoUserPoolStandard', () => {
  let app: App;
  let stack: Stack;

  beforeEach(() => {
    app = new App();
    stack = new Stack(app, 'TestStack');
  });

  // ========================================
  // Test 1: Grundlegende Funktionalität
  // ========================================
  test('creates User Pool with secure defaults', () => {
    // Arrange & Act
    new CognitoUserPoolStandard(stack, 'TestUserPool');

    // Assert
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::Cognito::UserPool', {
      AutoVerifiedAttributes: ['email'],
      UsernameAttributes: ['email'],
    });
  });

  // ========================================
  // Test 2: Custom User Pool Name
  // ========================================
  test('uses custom user pool name when provided', () => {
    // Arrange & Act
    new CognitoUserPoolStandard(stack, 'TestUserPool', {
      userPoolName: 'my-custom-pool',
    });

    // Assert
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::Cognito::UserPool', {
      UserPoolName: 'my-custom-pool',
    });
  });

  // ========================================
  // Test 3: Sign-in Aliases
  // ========================================
  test('uses email as sign-in by default', () => {
    // Arrange & Act
    new CognitoUserPoolStandard(stack, 'TestUserPool');

    // Assert
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::Cognito::UserPool', {
      UsernameAttributes: ['email'],
    });
  });

  // ========================================
  // Test 4: Self Sign-up
  // ========================================
  test('enables self sign-up when specified', () => {
    // Arrange & Act
    new CognitoUserPoolStandard(stack, 'TestUserPool', {
      selfSignUpEnabled: true,
    });

    // Assert
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::Cognito::UserPool', {
      AdminCreateUserConfig: {
        AllowAdminCreateUserOnly: false,
      },
    });
  });

  // ========================================
  // Test 5: Disable Self Sign-up
  // ========================================
  test('disables self sign-up by default', () => {
    // Arrange & Act
    new CognitoUserPoolStandard(stack, 'TestUserPool');

    // Assert
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::Cognito::UserPool', {
      AdminCreateUserConfig: {
        AllowAdminCreateUserOnly: true,
      },
    });
  });

  // ========================================
  // Test 6: Auto-verify Email
  // ========================================
  test('auto-verifies email by default', () => {
    // Arrange & Act
    new CognitoUserPoolStandard(stack, 'TestUserPool');

    // Assert
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::Cognito::UserPool', {
      AutoVerifiedAttributes: ['email'],
    });
  });

  // ========================================
  // Test 7: Password Policy
  // ========================================
  test('uses secure password policy by default', () => {
    // Arrange & Act
    new CognitoUserPoolStandard(stack, 'TestUserPool');

    // Assert
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::Cognito::UserPool', {
      Policies: {
        PasswordPolicy: {
          MinimumLength: 8,
          RequireLowercase: true,
          RequireUppercase: true,
          RequireNumbers: true,
          RequireSymbols: true,
        },
      },
    });
  });

  // ========================================
  // Test 8: Custom Password Policy
  // ========================================
  test('allows custom password policy', () => {
    // Arrange & Act
    new CognitoUserPoolStandard(stack, 'TestUserPool', {
      passwordPolicy: {
        minLength: 12,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: false,
      },
    });

    // Assert
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::Cognito::UserPool', {
      Policies: {
        PasswordPolicy: {
          MinimumLength: 12,
          RequireLowercase: true,
          RequireUppercase: true,
          RequireNumbers: true,
          RequireSymbols: false,
        },
      },
    });
  });

  // ========================================
  // Test 9: MFA Configuration
  // ========================================
  test('disables MFA by default', () => {
    // Arrange & Act
    new CognitoUserPoolStandard(stack, 'TestUserPool');

    // Assert
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::Cognito::UserPool', {
      MfaConfiguration: 'OFF',
    });
  });

  // ========================================
  // Test 10: Enable Optional MFA
  // ========================================
  test('enables optional MFA when specified', () => {
    // Arrange & Act
    new CognitoUserPoolStandard(stack, 'TestUserPool', {
      mfa: cognito.Mfa.OPTIONAL,
    });

    // Assert
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::Cognito::UserPool', {
      MfaConfiguration: 'OPTIONAL',
    });
  });

  // ========================================
  // Test 11: User Pool Client Creation
  // ========================================
  test('creates User Pool Client by default', () => {
    // Arrange & Act
    new CognitoUserPoolStandard(stack, 'TestUserPool');

    // Assert
    const template = Template.fromStack(stack);
    template.resourceCountIs('AWS::Cognito::UserPoolClient', 1);
  });

  // ========================================
  // Test 12: Custom Client Name
  // ========================================
  test('uses custom client name when provided', () => {
    // Arrange & Act
    new CognitoUserPoolStandard(stack, 'TestUserPool', {
      clientName: 'my-app-client',
    });

    // Assert
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::Cognito::UserPoolClient', {
      ClientName: 'my-app-client',
    });
  });

  // ========================================
  // Test 13: Auth Flows
  // ========================================
  test('enables standard auth flows by default', () => {
    // Arrange & Act
    new CognitoUserPoolStandard(stack, 'TestUserPool');

    // Assert
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::Cognito::UserPoolClient', {
      ExplicitAuthFlows: [
        'ALLOW_USER_SRP_AUTH',
        'ALLOW_REFRESH_TOKEN_AUTH',
      ],
    });
  });

  // ========================================
  // Test 14: Token Validity
  // ========================================
  test('uses default token validity periods', () => {
    // Arrange & Act
    new CognitoUserPoolStandard(stack, 'TestUserPool');

    // Assert
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::Cognito::UserPoolClient', {
      AccessTokenValidity: 60,
      IdTokenValidity: 60,
      RefreshTokenValidity: 43200, // 30 days = 43200 minutes
      TokenValidityUnits: {
        AccessToken: 'minutes',
        IdToken: 'minutes',
        RefreshToken: 'minutes',
      },
    });
  });

  // ========================================
  // Test 15: Outputs
  // ========================================
  test('provides userPool, userPoolId, userPoolArn, and userPoolClient outputs', () => {
    // Arrange & Act
    const construct = new CognitoUserPoolStandard(stack, 'TestUserPool');

    // Assert
    expect(construct.userPool).toBeDefined();
    expect(construct.userPoolId).toBeDefined();
    expect(construct.userPoolArn).toBeDefined();
    expect(construct.userPoolClient).toBeDefined();
    expect(construct.userPoolClientId).toBeDefined();
  });

  // ========================================
  // Test 16: Tags
  // ========================================
  test('applies managed-by and construct tags', () => {
    // Arrange & Act
    new CognitoUserPoolStandard(stack, 'TestUserPool');

    // Assert
    const template = Template.fromStack(stack);
    const resources = template.findResources('AWS::Cognito::UserPool');
    const userPool = Object.values(resources)[0];

    expect(userPool.Properties.UserPoolTags).toEqual(
      expect.objectContaining({
        ManagedBy: 'CDK',
        Construct: 'CognitoUserPoolStandard',
      })
    );
  });

  // ========================================
  // Test 17: Removal Policy for Dev Stacks
  // ========================================
  test('uses DELETE removal policy for dev stacks', () => {
    // Arrange
    const devStack = new Stack(app, 'DevStack', {
      stackName: 'dev-stack',
    });

    // Act
    new CognitoUserPoolStandard(devStack, 'TestUserPool');

    // Assert
    const template = Template.fromStack(devStack);
    template.hasResource('AWS::Cognito::UserPool', {
      DeletionPolicy: 'Delete',
      UpdateReplacePolicy: 'Delete',
    });
  });

  // ========================================
  // Test 18: Removal Policy for Production Stacks
  // ========================================
  test('uses RETAIN removal policy for production stacks', () => {
    // Arrange
    const prodStack = new Stack(app, 'ProdStack', {
      stackName: 'production-stack',
    });

    // Act
    new CognitoUserPoolStandard(prodStack, 'TestUserPool');

    // Assert
    const template = Template.fromStack(prodStack);
    template.hasResource('AWS::Cognito::UserPool', {
      DeletionPolicy: 'Retain',
      UpdateReplacePolicy: 'Retain',
    });
  });
});
