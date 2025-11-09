import { handler } from '../index';
import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBClient, GetItemCommand, PutItemCommand, ScanCommand, UpdateItemCommand, DeleteItemCommand } from '@aws-sdk/client-dynamodb';

// Create mock for DynamoDB client
const dynamoMock = mockClient(DynamoDBClient);

// Helper to create mock API Gateway event
const createMockEvent = (
  httpMethod: string,
  path: string,
  body: any = null,
  pathParameters: any = null
): APIGatewayProxyEvent => {
  return {
    httpMethod,
    path,
    body: body ? JSON.stringify(body) : null,
    pathParameters,
    headers: {},
    multiValueHeaders: {},
    isBase64Encoded: false,
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    requestContext: {} as any,
    resource: '',
    stageVariables: null,
  };
};

// Mock context
const mockContext: Context = {
  callbackWaitsForEmptyEventLoop: false,
  functionName: 'test-function',
  functionVersion: '$LATEST',
  invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:test-function',
  memoryLimitInMB: '512',
  awsRequestId: 'test-request-id',
  logGroupName: '/aws/lambda/test-function',
  logStreamName: '2024/01/01/[$LATEST]abc123',
  getRemainingTimeInMillis: () => 30000,
  done: () => {},
  fail: () => {},
  succeed: () => {},
};

describe('Lambda Handler', () => {
  beforeEach(() => {
    dynamoMock.reset();
    process.env.TABLE_NAME = 'test-table';
  });

  afterEach(() => {
    delete process.env.TABLE_NAME;
  });

  describe('Health endpoint', () => {
    test('GET /health returns healthy status', async () => {
      const event = createMockEvent('GET', '/health');
      const result: any = await handler(event, mockContext);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.status).toBe('healthy');
      expect(body.runtime).toBe('typescript');
    });

    test('GET /typescript/health returns healthy status', async () => {
      const event = createMockEvent('GET', '/typescript/health');
      const result: any = await handler(event, mockContext);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.status).toBe('healthy');
    });
  });

  describe('Metrics endpoint', () => {
    test('GET /metrics returns metrics', async () => {
      const event = createMockEvent('GET', '/metrics');
      const result: any = await handler(event, mockContext);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(true);
      expect(body.data).toBeDefined();
      expect(body.data.runtime).toBe('typescript');
    });
  });

  describe('Create item', () => {
    test('POST /items creates item successfully', async () => {
      dynamoMock.on(PutItemCommand).resolves({});

      const event = createMockEvent('POST', '/items', {
        name: 'Test Item',
        description: 'Test Description',
        price: 19.99,
      });

      const result: any = await handler(event, mockContext);

      expect(result.statusCode).toBe(201);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(true);
      expect(body.data.name).toBe('Test Item');
      expect(body.message).toBe('Item created successfully');
    });

    test('POST /items validates required fields', async () => {
      const event = createMockEvent('POST', '/items', {
        description: 'Test Description',
      });

      const result: any = await handler(event, mockContext);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
    });

    test('POST /items validates price is positive', async () => {
      const event = createMockEvent('POST', '/items', {
        name: 'Test Item',
        price: -10,
      });

      const result: any = await handler(event, mockContext);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
    });
  });

  describe('Get item', () => {
    test('GET /items/:id returns item', async () => {
      const mockItem = {
        Item: {
          id: { S: 'test-id-123' },
          name: { S: 'Test Item' },
          description: { S: 'Test Description' },
          price: { N: '19.99' },
          created_at: { N: '1704067200000' },
          updated_at: { N: '1704067200000' },
        },
      };

      dynamoMock.on(GetItemCommand).resolves(mockItem);

      const event = createMockEvent('GET', '/items/test-id-123', null, {
        id: 'test-id-123',
      });

      const result: any = await handler(event, mockContext);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(true);
      expect(body.data.id).toBe('test-id-123');
      expect(body.data.name).toBe('Test Item');
    });

    test('GET /items/:id returns 404 for non-existent item', async () => {
      dynamoMock.on(GetItemCommand).resolves({});

      const event = createMockEvent('GET', '/items/non-existent', null, {
        id: 'non-existent',
      });

      const result: any = await handler(event, mockContext);

      expect(result.statusCode).toBe(404);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
    });
  });

  describe('Update item', () => {
    test('PUT /items/:id updates item', async () => {
      const mockExistingItem = {
        Item: {
          id: { S: 'test-id-123' },
          name: { S: 'Old Name' },
          price: { N: '10' },
          created_at: { N: '1704067200000' },
          updated_at: { N: '1704067200000' },
        },
      };

      const mockUpdatedItem = {
        Attributes: {
          id: { S: 'test-id-123' },
          name: { S: 'New Name' },
          price: { N: '20' },
          created_at: { N: '1704067200000' },
          updated_at: { N: '1704067300000' },
        },
      };

      dynamoMock
        .on(GetItemCommand)
        .resolves(mockExistingItem)
        .on(UpdateItemCommand)
        .resolves(mockUpdatedItem);

      const event = createMockEvent(
        'PUT',
        '/items/test-id-123',
        {
          name: 'New Name',
          price: 20,
        },
        { id: 'test-id-123' }
      );

      const result: any = await handler(event, mockContext);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(true);
      expect(body.data.name).toBe('New Name');
    });

    test('PUT /items/:id returns 404 for non-existent item', async () => {
      dynamoMock.on(GetItemCommand).resolves({});

      const event = createMockEvent(
        'PUT',
        '/items/non-existent',
        { name: 'New Name' },
        { id: 'non-existent' }
      );

      const result: any = await handler(event, mockContext);

      expect(result.statusCode).toBe(404);
    });

    test('PUT /items/:id validates price', async () => {
      const event = createMockEvent(
        'PUT',
        '/items/test-id-123',
        { price: -10 },
        { id: 'test-id-123' }
      );

      const result: any = await handler(event, mockContext);

      expect(result.statusCode).toBe(400);
    });
  });

  describe('Delete item', () => {
    test('DELETE /items/:id deletes item', async () => {
      const mockExistingItem = {
        Item: {
          id: { S: 'test-id-123' },
          name: { S: 'Test' },
          price: { N: '10' },
          created_at: { N: '1704067200000' },
          updated_at: { N: '1704067200000' },
        },
      };

      dynamoMock
        .on(GetItemCommand)
        .resolves(mockExistingItem)
        .on(DeleteItemCommand)
        .resolves({});

      const event = createMockEvent('DELETE', '/items/test-id-123', null, {
        id: 'test-id-123',
      });

      const result: any = await handler(event, mockContext);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(true);
    });

    test('DELETE /items/:id returns 404 for non-existent item', async () => {
      dynamoMock.on(GetItemCommand).resolves({});

      const event = createMockEvent('DELETE', '/items/non-existent', null, {
        id: 'non-existent',
      });

      const result: any = await handler(event, mockContext);

      expect(result.statusCode).toBe(404);
    });
  });

  describe('List items', () => {
    test('GET /items lists all items', async () => {
      const mockItems = {
        Items: [
          {
            id: { S: 'id-1' },
            name: { S: 'Item 1' },
            price: { N: '10' },
            created_at: { N: '1704067200000' },
            updated_at: { N: '1704067200000' },
          },
          {
            id: { S: 'id-2' },
            name: { S: 'Item 2' },
            price: { N: '20' },
            created_at: { N: '1704067200000' },
            updated_at: { N: '1704067200000' },
          },
        ],
      };

      dynamoMock.on(ScanCommand).resolves(mockItems);

      const event = createMockEvent('GET', '/items');

      const result: any = await handler(event, mockContext);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(true);
      expect(body.data).toHaveLength(2);
      expect(body.count).toBe(2);
    });

    test('GET /items returns empty array when no items', async () => {
      dynamoMock.on(ScanCommand).resolves({ Items: [] });

      const event = createMockEvent('GET', '/items');

      const result: any = await handler(event, mockContext);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(true);
      expect(body.data).toEqual([]);
      expect(body.count).toBe(0);
    });
  });

  describe('CORS', () => {
    test('responses include CORS headers', async () => {
      const event = createMockEvent('GET', '/health');
      const result: any = await handler(event, mockContext);

      expect(result.headers).toBeDefined();
      expect(result.headers['Access-Control-Allow-Origin']).toBe('*');
    });
  });

  describe('Error handling', () => {
    test('handles DynamoDB errors gracefully', async () => {
      dynamoMock.on(PutItemCommand).rejects(new Error('DynamoDB error'));

      const event = createMockEvent('POST', '/items', {
        name: 'Test Item',
        price: 19.99,
      });

      const result: any = await handler(event, mockContext);

      expect(result.statusCode).toBe(500);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
    });
  });
});
