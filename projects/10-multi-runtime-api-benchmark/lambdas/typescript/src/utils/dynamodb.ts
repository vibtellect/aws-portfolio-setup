import {
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
  UpdateItemCommand,
  DeleteItemCommand,
  ScanCommand,
} from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { Item, ItemCreate, ItemUpdate } from '../models/item';

export class DynamoDBService {
  private client: DynamoDBClient;
  private tableName: string;

  constructor() {
    this.client = new DynamoDBClient({});
    this.tableName = process.env.TABLE_NAME || 'dev-benchmark-items';
    console.log(`DynamoDB service initialized for table: ${this.tableName}`);
  }

  private currentTimestamp(): number {
    return Date.now();
  }

  async createItem(itemData: ItemCreate): Promise<Item> {
    const item: Item = {
      id: uuidv4(),
      name: itemData.name,
      description: itemData.description || '',
      price: itemData.price,
      created_at: this.currentTimestamp(),
      updated_at: this.currentTimestamp(),
    };

    try {
      await this.client.send(
        new PutItemCommand({
          TableName: this.tableName,
          Item: marshall(item),
        })
      );
      console.log(`Created item: ${item.id}`);
      return item;
    } catch (error) {
      console.error(`Error creating item:`, error);
      throw error;
    }
  }

  async getItem(itemId: string): Promise<Item | null> {
    try {
      const response = await this.client.send(
        new GetItemCommand({
          TableName: this.tableName,
          Key: marshall({ id: itemId }),
        })
      );

      if (!response.Item) {
        console.warn(`Item not found: ${itemId}`);
        return null;
      }

      const item = unmarshall(response.Item) as Item;
      console.log(`Retrieved item: ${itemId}`);
      return item;
    } catch (error) {
      console.error(`Error getting item ${itemId}:`, error);
      throw error;
    }
  }

  async updateItem(itemId: string, itemData: ItemUpdate): Promise<Item | null> {
    // First check if item exists
    const existingItem = await this.getItem(itemId);
    if (!existingItem) {
      return null;
    }

    // Build update expression
    const updateParts: string[] = [];
    const expressionValues: Record<string, any> = {};
    const expressionNames: Record<string, string> = {};

    if (itemData.name !== undefined) {
      updateParts.push('#n = :name');
      expressionValues[':name'] = itemData.name;
      expressionNames['#n'] = 'name';
    }

    if (itemData.description !== undefined) {
      updateParts.push('description = :description');
      expressionValues[':description'] = itemData.description;
    }

    if (itemData.price !== undefined) {
      updateParts.push('price = :price');
      expressionValues[':price'] = itemData.price;
    }

    // Always update timestamp
    updateParts.push('updated_at = :updated_at');
    expressionValues[':updated_at'] = this.currentTimestamp();

    const updateExpression = 'SET ' + updateParts.join(', ');

    try {
      const response = await this.client.send(
        new UpdateItemCommand({
          TableName: this.tableName,
          Key: marshall({ id: itemId }),
          UpdateExpression: updateExpression,
          ExpressionAttributeValues: marshall(expressionValues),
          ExpressionAttributeNames: Object.keys(expressionNames).length > 0 ? expressionNames : undefined,
          ReturnValues: 'ALL_NEW',
        })
      );

      if (!response.Attributes) {
        return null;
      }

      const item = unmarshall(response.Attributes) as Item;
      console.log(`Updated item: ${itemId}`);
      return item;
    } catch (error) {
      console.error(`Error updating item ${itemId}:`, error);
      throw error;
    }
  }

  async deleteItem(itemId: string): Promise<boolean> {
    try {
      // Check if item exists first
      const existingItem = await this.getItem(itemId);
      if (!existingItem) {
        return false;
      }

      await this.client.send(
        new DeleteItemCommand({
          TableName: this.tableName,
          Key: marshall({ id: itemId }),
        })
      );

      console.log(`Deleted item: ${itemId}`);
      return true;
    } catch (error) {
      console.error(`Error deleting item ${itemId}:`, error);
      throw error;
    }
  }

  async listItems(limit: number = 100): Promise<Item[]> {
    try {
      const response = await this.client.send(
        new ScanCommand({
          TableName: this.tableName,
          Limit: limit,
        })
      );

      const items = (response.Items || []).map((item) => unmarshall(item) as Item);
      console.log(`Listed ${items.length} items`);
      return items;
    } catch (error) {
      console.error(`Error listing items:`, error);
      throw error;
    }
  }
}
