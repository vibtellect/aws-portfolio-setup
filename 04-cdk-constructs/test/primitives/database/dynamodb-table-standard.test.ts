import { describe, test, beforeEach, expect } from '@jest/globals';
import { App, Stack, RemovalPolicy } from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as kms from 'aws-cdk-lib/aws-kms';
import { DynamoDbTableStandard } from '../../../src/primitives/database/dynamodb-table-standard';

describe('DynamoDbTableStandard', () => {
  let app: App;
  let stack: Stack;

  beforeEach(() => {
    app = new App();
    stack = new Stack(app, 'TestStack');
  });

  // ========================================
  // Test 1: Grundlegende Funktionalität
  // ========================================
  test('creates DynamoDB table with partition key only', () => {
    // Arrange & Act
    new DynamoDbTableStandard(stack, 'TestTable', {
      partitionKey: {
        name: 'userId',
        type: dynamodb.AttributeType.STRING,
      },
    });

    // Assert
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::DynamoDB::Table', {
      KeySchema: [
        {
          AttributeName: 'userId',
          KeyType: 'HASH',
        },
      ],
      AttributeDefinitions: [
        {
          AttributeName: 'userId',
          AttributeType: 'S',
        },
      ],
    });
  });

  // ========================================
  // Test 2: Partition + Sort Key
  // ========================================
  test('creates DynamoDB table with partition and sort key', () => {
    // Arrange & Act
    new DynamoDbTableStandard(stack, 'TestTable', {
      partitionKey: {
        name: 'userId',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'todoId',
        type: dynamodb.AttributeType.STRING,
      },
    });

    // Assert
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::DynamoDB::Table', {
      KeySchema: [
        {
          AttributeName: 'userId',
          KeyType: 'HASH',
        },
        {
          AttributeName: 'todoId',
          KeyType: 'RANGE',
        },
      ],
    });
  });

  // ========================================
  // Test 3: Billing Mode (Default PAY_PER_REQUEST)
  // ========================================
  test('uses PAY_PER_REQUEST billing mode by default', () => {
    // Arrange & Act
    new DynamoDbTableStandard(stack, 'TestTable', {
      partitionKey: {
        name: 'id',
        type: dynamodb.AttributeType.STRING,
      },
    });

    // Assert
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::DynamoDB::Table', {
      BillingMode: 'PAY_PER_REQUEST',
    });
  });

  // ========================================
  // Test 4: Custom Billing Mode (PROVISIONED)
  // ========================================
  test('allows custom billing mode', () => {
    // Arrange & Act
    new DynamoDbTableStandard(stack, 'TestTable', {
      partitionKey: {
        name: 'id',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PROVISIONED,
      readCapacity: 5,
      writeCapacity: 5,
    });

    // Assert
    const template = Template.fromStack(stack);
    // CloudFormation doesn't set BillingMode when ProvisionedThroughput is set (default is PROVISIONED)
    template.hasResourceProperties('AWS::DynamoDB::Table', {
      ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5,
      },
    });
  });

  // ========================================
  // Test 5: Encryption (AWS Managed by default)
  // ========================================
  test('uses AWS managed encryption by default', () => {
    // Arrange & Act
    new DynamoDbTableStandard(stack, 'TestTable', {
      partitionKey: {
        name: 'id',
        type: dynamodb.AttributeType.STRING,
      },
    });

    // Assert
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::DynamoDB::Table', {
      SSESpecification: {
        SSEEnabled: true,
      },
    });
  });

  // ========================================
  // Test 6: Customer Managed Encryption
  // ========================================
  test('allows customer managed encryption key', () => {
    // Arrange
    const encryptionKey = new kms.Key(stack, 'Key', {
      enableKeyRotation: true,
    });

    // Act
    new DynamoDbTableStandard(stack, 'TestTable', {
      partitionKey: {
        name: 'id',
        type: dynamodb.AttributeType.STRING,
      },
      encryptionKey: encryptionKey,
    });

    // Assert
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::DynamoDB::Table', {
      SSESpecification: {
        SSEEnabled: true,
        SSEType: 'KMS',
      },
    });
  });

  // ========================================
  // Test 7: Point-in-Time Recovery
  // ========================================
  test('disables point-in-time recovery by default', () => {
    // Arrange & Act
    new DynamoDbTableStandard(stack, 'TestTable', {
      partitionKey: {
        name: 'id',
        type: dynamodb.AttributeType.STRING,
      },
    });

    // Assert
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::DynamoDB::Table', {
      PointInTimeRecoverySpecification: {
        PointInTimeRecoveryEnabled: false,
      },
    });
  });

  // ========================================
  // Test 8: Enable Point-in-Time Recovery
  // ========================================
  test('allows enabling point-in-time recovery', () => {
    // Arrange & Act
    new DynamoDbTableStandard(stack, 'TestTable', {
      partitionKey: {
        name: 'id',
        type: dynamodb.AttributeType.STRING,
      },
      pointInTimeRecovery: true,
    });

    // Assert
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::DynamoDB::Table', {
      PointInTimeRecoverySpecification: {
        PointInTimeRecoveryEnabled: true,
      },
    });
  });

  // ========================================
  // Test 9: Stream Configuration
  // ========================================
  test('allows enabling streams', () => {
    // Arrange & Act
    new DynamoDbTableStandard(stack, 'TestTable', {
      partitionKey: {
        name: 'id',
        type: dynamodb.AttributeType.STRING,
      },
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
    });

    // Assert
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::DynamoDB::Table', {
      StreamSpecification: {
        StreamViewType: 'NEW_AND_OLD_IMAGES',
      },
    });
  });

  // ========================================
  // Test 10: RemovalPolicy (Dev = DESTROY)
  // ========================================
  test('uses DESTROY removal policy for dev stacks', () => {
    // Arrange
    const devStack = new Stack(app, 'DevStack', {
      stackName: 'dev-stack',
    });

    // Act
    new DynamoDbTableStandard(devStack, 'TestTable', {
      partitionKey: {
        name: 'id',
        type: dynamodb.AttributeType.STRING,
      },
    });

    // Assert
    const template = Template.fromStack(devStack);
    template.hasResource('AWS::DynamoDB::Table', {
      DeletionPolicy: 'Delete',
      UpdateReplacePolicy: 'Delete',
    });
  });

  // ========================================
  // Test 11: RemovalPolicy (Prod = RETAIN)
  // ========================================
  test('uses RETAIN removal policy for production stacks', () => {
    // Arrange
    const prodStack = new Stack(app, 'ProdStack', {
      stackName: 'production-stack',
    });

    // Act
    new DynamoDbTableStandard(prodStack, 'TestTable', {
      partitionKey: {
        name: 'id',
        type: dynamodb.AttributeType.STRING,
      },
    });

    // Assert
    const template = Template.fromStack(prodStack);
    template.hasResource('AWS::DynamoDB::Table', {
      DeletionPolicy: 'Retain',
      UpdateReplacePolicy: 'Retain',
    });
  });

  // ========================================
  // Test 12: Custom RemovalPolicy
  // ========================================
  test('allows custom removal policy', () => {
    // Arrange & Act
    new DynamoDbTableStandard(stack, 'TestTable', {
      partitionKey: {
        name: 'id',
        type: dynamodb.AttributeType.STRING,
      },
      removalPolicy: RemovalPolicy.SNAPSHOT,
    });

    // Assert
    const template = Template.fromStack(stack);
    template.hasResource('AWS::DynamoDB::Table', {
      DeletionPolicy: 'Snapshot',
    });
  });

  // ========================================
  // Test 13: Custom Table Name
  // ========================================
  test('uses custom table name when provided', () => {
    // Arrange & Act
    new DynamoDbTableStandard(stack, 'TestTable', {
      tableName: 'my-custom-table',
      partitionKey: {
        name: 'id',
        type: dynamodb.AttributeType.STRING,
      },
    });

    // Assert
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::DynamoDB::Table', {
      TableName: 'my-custom-table',
    });
  });

  // ========================================
  // Test 14: Outputs (table, tableArn, tableName)
  // ========================================
  test('provides table, tableArn, and tableName outputs', () => {
    // Arrange & Act
    const construct = new DynamoDbTableStandard(stack, 'TestTable', {
      partitionKey: {
        name: 'id',
        type: dynamodb.AttributeType.STRING,
      },
    });

    // Assert
    expect(construct.table).toBeDefined();
    expect(construct.tableArn).toBeDefined();
    expect(construct.tableName).toBeDefined();
  });

  // ========================================
  // Test 15: Tags
  // ========================================
  test('applies managed-by and construct tags', () => {
    // Arrange & Act
    const construct = new DynamoDbTableStandard(stack, 'TestTable', {
      partitionKey: {
        name: 'id',
        type: dynamodb.AttributeType.STRING,
      },
    });

    // Assert
    const template = Template.fromStack(stack);
    const resources = template.findResources('AWS::DynamoDB::Table');
    const tableResource = Object.values(resources)[0];

    expect(tableResource.Properties.Tags).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ Key: 'ManagedBy', Value: 'CDK' }),
        expect.objectContaining({ Key: 'Construct', Value: 'DynamoDbTableStandard' }),
      ])
    );
  });

  // ========================================
  // Test 16: Validation - Table name length
  // ========================================
  test('throws error when table name exceeds 255 characters', () => {
    // Arrange
    const longName = 'a'.repeat(256);

    // Act & Assert
    expect(() => {
      new DynamoDbTableStandard(stack, 'TestTable', {
        tableName: longName,
        partitionKey: {
          name: 'id',
          type: dynamodb.AttributeType.STRING,
        },
      });
    }).toThrow('Table name must be <= 255 characters');
  });

  // ========================================
  // Test 17: Validation - Partition key required
  // ========================================
  test('throws error when partition key is not provided', () => {
    // Act & Assert
    expect(() => {
      new DynamoDbTableStandard(stack, 'TestTable', {
        partitionKey: undefined as any,
      });
    }).toThrow('Partition key is required');
  });
});
