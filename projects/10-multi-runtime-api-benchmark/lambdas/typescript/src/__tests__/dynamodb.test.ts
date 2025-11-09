import { DynamoDBService } from '../utils/dynamodb';
import { ItemCreate, ItemUpdate } from '../models/item';
import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBClient, GetItemCommand, PutItemCommand, UpdateItemCommand, DeleteItemCommand, ScanCommand } from '@aws-sdk/client-dynamodb';

// Create mock for DynamoDB client
const dynamoMock = mockClient(DynamoDBClient);

describe('DynamoDBService', () => {
  let service: DynamoDBService;

  beforeEach(() => {
    // Reset mocks before each test
    dynamoMock.reset();
    process.env.TABLE_NAME = 'test-table';
    service = new DynamoDBService();
  });

  afterEach(() => {
    delete process.env.TABLE_NAME;
  });

  describe('initialization', () => {
    test('initializes with table name from environment', () => {
      expect(service).toBeDefined();
    });

    test('uses default table name if not provided', () => {
      delete process.env.TABLE_NAME;
      const defaultService = new DynamoDBService();
      expect(defaultService).toBeDefined();
    });
  });

  describe('createItem', () => {
    test('creates item successfully', async () => {
      const itemData: ItemCreate = {
        name: 'Test Item',
        description: 'Test Description',
        price: 19.99,
      };

      dynamoMock.on(PutItemCommand).resolves({});

      const result = await service.createItem(itemData);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.name).toBe('Test Item');
      expect(result.description).toBe('Test Description');
      expect(result.price).toBe(19.99);
      expect(result.created_at).toBeGreaterThan(0);
      expect(result.updated_at).toBeGreaterThan(0);
      expect(result.created_at).toBe(result.updated_at);
    });

    test('creates item without description', async () => {
      const itemData: ItemCreate = {
        name: 'Test Item',
        price: 19.99,
      };

      dynamoMock.on(PutItemCommand).resolves({});

      const result = await service.createItem(itemData);

      expect(result.description).toBe('');
    });

    test('generates unique IDs', async () => {
      const itemData: ItemCreate = {
        name: 'Test Item',
        price: 19.99,
      };

      dynamoMock.on(PutItemCommand).resolves({});

      const item1 = await service.createItem(itemData);
      const item2 = await service.createItem(itemData);

      expect(item1.id).not.toBe(item2.id);
    });

    test('handles DynamoDB errors', async () => {
      const itemData: ItemCreate = {
        name: 'Test Item',
        price: 19.99,
      };

      dynamoMock.on(PutItemCommand).rejects(new Error('DynamoDB error'));

      await expect(service.createItem(itemData)).rejects.toThrow('DynamoDB error');
    });
  });

  describe('getItem', () => {
    test('retrieves existing item', async () => {
      const mockItem = {
        id: { S: 'test-id-123' },
        name: { S: 'Test Item' },
        description: { S: 'Test Description' },
        price: { N: '19.99' },
        created_at: { N: '1704067200000' },
        updated_at: { N: '1704067200000' },
      };

      dynamoMock.on(GetItemCommand).resolves({ Item: mockItem });

      const result = await service.getItem('test-id-123');

      expect(result).toBeDefined();
      expect(result?.id).toBe('test-id-123');
      expect(result?.name).toBe('Test Item');
      expect(result?.price).toBe(19.99);
    });

    test('returns null for non-existent item', async () => {
      dynamoMock.on(GetItemCommand).resolves({});

      const result = await service.getItem('non-existent-id');

      expect(result).toBeNull();
    });

    test('handles DynamoDB errors', async () => {
      dynamoMock.on(GetItemCommand).rejects(new Error('DynamoDB error'));

      await expect(service.getItem('test-id')).rejects.toThrow('DynamoDB error');
    });
  });

  describe('updateItem', () => {
    test('updates all fields', async () => {
      const mockExistingItem = {
        Item: {
          id: { S: 'test-id-123' },
          name: { S: 'Old Name' },
          description: { S: 'Old Description' },
          price: { N: '10' },
          created_at: { N: '1704067200000' },
          updated_at: { N: '1704067200000' },
        },
      };

      const mockUpdatedItem = {
        Attributes: {
          id: { S: 'test-id-123' },
          name: { S: 'New Name' },
          description: { S: 'New Description' },
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

      const updateData: ItemUpdate = {
        name: 'New Name',
        description: 'New Description',
        price: 20,
      };

      const result = await service.updateItem('test-id-123', updateData);

      expect(result).toBeDefined();
      expect(result?.name).toBe('New Name');
      expect(result?.description).toBe('New Description');
      expect(result?.price).toBe(20);
    });

    test('updates partial fields', async () => {
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
          name: { S: 'Old Name' },
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

      const updateData: ItemUpdate = {
        price: 20,
      };

      const result = await service.updateItem('test-id-123', updateData);

      expect(result).toBeDefined();
      expect(result?.price).toBe(20);
    });

    test('returns null for non-existent item', async () => {
      dynamoMock.on(GetItemCommand).resolves({});

      const updateData: ItemUpdate = {
        name: 'New Name',
      };

      const result = await service.updateItem('non-existent-id', updateData);

      expect(result).toBeNull();
    });

    test('updates timestamp', async () => {
      const originalTimestamp = 1704067200000;
      const mockExistingItem = {
        Item: {
          id: { S: 'test-id-123' },
          name: { S: 'Test' },
          price: { N: '10' },
          created_at: { N: String(originalTimestamp) },
          updated_at: { N: String(originalTimestamp) },
        },
      };

      const newTimestamp = originalTimestamp + 100000;
      const mockUpdatedItem = {
        Attributes: {
          id: { S: 'test-id-123' },
          name: { S: 'Updated' },
          price: { N: '10' },
          created_at: { N: String(originalTimestamp) },
          updated_at: { N: String(newTimestamp) },
        },
      };

      dynamoMock
        .on(GetItemCommand)
        .resolves(mockExistingItem)
        .on(UpdateItemCommand)
        .resolves(mockUpdatedItem);

      const result = await service.updateItem('test-id-123', { name: 'Updated' });

      expect(result).toBeDefined();
      expect(result?.updated_at).toBeGreaterThan(originalTimestamp);
    });
  });

  describe('deleteItem', () => {
    test('deletes existing item', async () => {
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

      const result = await service.deleteItem('test-id-123');

      expect(result).toBe(true);
    });

    test('returns false for non-existent item', async () => {
      dynamoMock.on(GetItemCommand).resolves({});

      const result = await service.deleteItem('non-existent-id');

      expect(result).toBe(false);
    });

    test('handles DynamoDB errors', async () => {
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
        .rejects(new Error('DynamoDB error'));

      await expect(service.deleteItem('test-id-123')).rejects.toThrow('DynamoDB error');
    });
  });

  describe('listItems', () => {
    test('lists all items', async () => {
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

      const result = await service.listItems();

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Item 1');
      expect(result[1].name).toBe('Item 2');
    });

    test('returns empty array when no items', async () => {
      dynamoMock.on(ScanCommand).resolves({ Items: [] });

      const result = await service.listItems();

      expect(result).toEqual([]);
    });

    test('respects limit parameter', async () => {
      dynamoMock.on(ScanCommand).resolves({ Items: [] });

      await service.listItems(50);

      const calls = dynamoMock.commandCalls(ScanCommand);
      expect(calls[0].args[0].input.Limit).toBe(50);
    });

    test('handles DynamoDB errors', async () => {
      dynamoMock.on(ScanCommand).rejects(new Error('DynamoDB error'));

      await expect(service.listItems()).rejects.toThrow('DynamoDB error');
    });
  });
});
