import { Item, ItemCreate, ItemUpdate } from '../models/item';

describe('Item Models', () => {
  describe('ItemCreate', () => {
    test('creates valid item with all fields', () => {
      const item: ItemCreate = {
        name: 'Test Item',
        description: 'Test Description',
        price: 19.99,
      };

      expect(item.name).toBe('Test Item');
      expect(item.description).toBe('Test Description');
      expect(item.price).toBe(19.99);
    });

    test('creates valid item without description', () => {
      const item: ItemCreate = {
        name: 'Test Item',
        price: 19.99,
      };

      expect(item.name).toBe('Test Item');
      expect(item.description).toBeUndefined();
      expect(item.price).toBe(19.99);
    });
  });

  describe('ItemUpdate', () => {
    test('creates update with all fields', () => {
      const update: ItemUpdate = {
        name: 'Updated Name',
        description: 'Updated Description',
        price: 29.99,
      };

      expect(update.name).toBe('Updated Name');
      expect(update.description).toBe('Updated Description');
      expect(update.price).toBe(29.99);
    });

    test('creates partial update', () => {
      const update: ItemUpdate = {
        price: 29.99,
      };

      expect(update.name).toBeUndefined();
      expect(update.description).toBeUndefined();
      expect(update.price).toBe(29.99);
    });

    test('creates empty update', () => {
      const update: ItemUpdate = {};

      expect(update.name).toBeUndefined();
      expect(update.description).toBeUndefined();
      expect(update.price).toBeUndefined();
    });
  });

  describe('Item', () => {
    test('creates complete item', () => {
      const item: Item = {
        id: 'test-id-123',
        name: 'Test Item',
        description: 'Test Description',
        price: 19.99,
        created_at: 1704067200000,
        updated_at: 1704067200000,
      };

      expect(item.id).toBe('test-id-123');
      expect(item.name).toBe('Test Item');
      expect(item.description).toBe('Test Description');
      expect(item.price).toBe(19.99);
      expect(item.created_at).toBe(1704067200000);
      expect(item.updated_at).toBe(1704067200000);
    });

    test('timestamps are numbers', () => {
      const item: Item = {
        id: 'test-id',
        name: 'Test',
        price: 10.0,
        created_at: Date.now(),
        updated_at: Date.now(),
      };

      expect(typeof item.created_at).toBe('number');
      expect(typeof item.updated_at).toBe('number');
    });
  });
});
