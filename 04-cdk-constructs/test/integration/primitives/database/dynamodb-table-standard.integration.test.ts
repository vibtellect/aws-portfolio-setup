/**
 * Integration tests for DynamoDbTableStandard construct with LocalStack
 */

import { describe, test, beforeAll, afterAll, expect } from '@jest/globals';
import {
  DynamoDBClient,
  DescribeTableCommand,
  PutItemCommand,
  GetItemCommand,
  ScanCommand,
} from '@aws-sdk/client-dynamodb';
import { AttributeType } from 'aws-cdk-lib/aws-dynamodb';
import { DynamoDbTableStandard } from '../../../../src/primitives/database/dynamodb-table-standard';
import {
  createTestApp,
  createTestStack,
  deployStack,
  destroyStack,
  addOutput,
} from '../../helpers/cdk-deploy-helper';
import {
  localstackConfig,
  waitForLocalStack,
  generateTestResourceName,
  isServiceAvailable,
} from '../../helpers/localstack-config';

describe('DynamoDbTableStandard - LocalStack Integration', () => {
  const stackName = generateTestResourceName('DynamoDbTableTest');
  const tableName = generateTestResourceName('test-table');
  let dynamoClient: DynamoDBClient;
  let deployedTableName: string;

  beforeAll(async () => {
    await waitForLocalStack();

    const dynamoAvailable = await isServiceAvailable('dynamodb');
    if (!dynamoAvailable) {
      throw new Error('DynamoDB service is not available in LocalStack');
    }

    dynamoClient = new DynamoDBClient(localstackConfig);

    const app = createTestApp();
    const stack = createTestStack(app, stackName);

    const table = new DynamoDbTableStandard(stack, 'TestTable', {
      tableName,
      partitionKey: {
        name: 'id',
        type: AttributeType.STRING,
      },
      sortKey: {
        name: 'timestamp',
        type: AttributeType.NUMBER,
      },
    });

    addOutput(stack, 'TableName', table.tableName, 'The name of the DynamoDB table');
    addOutput(stack, 'TableArn', table.tableArn, 'The ARN of the DynamoDB table');

    const result = await deployStack(stack, stackName);
    deployedTableName = result.outputs.TableName || tableName;

    console.log(`Deployed table: ${deployedTableName}`);
  }, 120000);

  afterAll(async () => {
    await destroyStack(stackName);
    dynamoClient.destroy();
  }, 60000);

  test('table should exist with correct configuration', async () => {
    const command = new DescribeTableCommand({
      TableName: deployedTableName,
    });

    const response = await dynamoClient.send(command);
    expect(response.Table).toBeDefined();
    expect(response.Table?.TableName).toBe(deployedTableName);
    expect(response.Table?.TableStatus).toBe('ACTIVE');
  });

  test('table should have correct key schema', async () => {
    const command = new DescribeTableCommand({
      TableName: deployedTableName,
    });

    const response = await dynamoClient.send(command);
    const keySchema = response.Table?.KeySchema;

    expect(keySchema).toBeDefined();
    expect(keySchema).toHaveLength(2);

    const partitionKey = keySchema?.find((k) => k.KeyType === 'HASH');
    const sortKey = keySchema?.find((k) => k.KeyType === 'RANGE');

    expect(partitionKey?.AttributeName).toBe('id');
    expect(sortKey?.AttributeName).toBe('timestamp');
  });

  test('should be able to put and get items', async () => {
    const testItem = {
      id: { S: 'test-id-123' },
      timestamp: { N: '1234567890' },
      data: { S: 'Test data from integration test' },
    };

    // Put item
    await dynamoClient.send(
      new PutItemCommand({
        TableName: deployedTableName,
        Item: testItem,
      })
    );

    // Get item
    const getResponse = await dynamoClient.send(
      new GetItemCommand({
        TableName: deployedTableName,
        Key: {
          id: testItem.id,
          timestamp: testItem.timestamp,
        },
      })
    );

    expect(getResponse.Item).toBeDefined();
    expect(getResponse.Item?.id.S).toBe(testItem.id.S);
    expect(getResponse.Item?.timestamp.N).toBe(testItem.timestamp.N);
    expect(getResponse.Item?.data.S).toBe(testItem.data.S);
  });

  test('should support scan operations', async () => {
    const scanResponse = await dynamoClient.send(
      new ScanCommand({
        TableName: deployedTableName,
      })
    );

    expect(scanResponse.Items).toBeDefined();
    expect(Array.isArray(scanResponse.Items)).toBe(true);
  });
});
