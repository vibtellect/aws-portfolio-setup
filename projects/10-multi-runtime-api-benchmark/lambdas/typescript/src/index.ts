import express, { Request, Response, NextFunction } from 'express';
import serverless from 'serverless-http';
import { DynamoDBService } from './utils/dynamodb';
import { MetricsCollector } from './utils/metrics';
import { ItemCreate, ItemUpdate, ErrorResponse } from './models/item';

// Initialize Express app
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Runtime');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Initialize services
const dbService = new DynamoDBService();
const metricsCollector = new MetricsCollector();

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    runtime: 'typescript',
    version: '20.x',
    framework: 'Express + serverless-http',
  });
});

app.get('/typescript/health', (req, res) => {
  res.json({
    status: 'healthy',
    runtime: 'typescript',
    version: '20.x',
    framework: 'Express + serverless-http',
  });
});

// Metrics endpoint
app.get('/metrics', (req, res) => {
  try {
    const metrics = metricsCollector.getMetrics();
    res.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    console.error('Error collecting metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Error collecting metrics',
      error: error instanceof Error ? error.message : String(error),
    } as ErrorResponse);
  }
});

app.get('/typescript/metrics', (req, res) => {
  try {
    const metrics = metricsCollector.getMetrics();
    res.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    console.error('Error collecting metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Error collecting metrics',
      error: error instanceof Error ? error.message : String(error),
    } as ErrorResponse);
  }
});

// Create item
app.post('/items', async (req, res) => {
  try {
    const itemData: ItemCreate = req.body;

    // Validation
    if (!itemData.name || !itemData.price) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name and price',
      } as ErrorResponse);
    }

    if (itemData.price <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Price must be greater than 0',
      } as ErrorResponse);
    }

    const item = await dbService.createItem(itemData);
    res.status(201).json({
      success: true,
      data: item,
      message: 'Item created successfully',
    });
  } catch (error) {
    console.error('Error creating item:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating item',
      error: error instanceof Error ? error.message : String(error),
    } as ErrorResponse);
  }
});

app.post('/typescript/items', async (req, res) => {
  try {
    const itemData: ItemCreate = req.body;

    // Validation
    if (!itemData.name || !itemData.price) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name and price',
      } as ErrorResponse);
    }

    if (itemData.price <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Price must be greater than 0',
      } as ErrorResponse);
    }

    const item = await dbService.createItem(itemData);
    res.status(201).json({
      success: true,
      data: item,
      message: 'Item created successfully',
    });
  } catch (error) {
    console.error('Error creating item:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating item',
      error: error instanceof Error ? error.message : String(error),
    } as ErrorResponse);
  }
});

// Get item by ID
app.get('/items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const item = await dbService.getItem(id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: `Item not found: ${id}`,
      } as ErrorResponse);
    }

    res.json({
      success: true,
      data: item,
      message: 'Item retrieved successfully',
    });
  } catch (error) {
    console.error('Error getting item:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting item',
      error: error instanceof Error ? error.message : String(error),
    } as ErrorResponse);
  }
});

app.get('/typescript/items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const item = await dbService.getItem(id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: `Item not found: ${id}`,
      } as ErrorResponse);
    }

    res.json({
      success: true,
      data: item,
      message: 'Item retrieved successfully',
    });
  } catch (error) {
    console.error('Error getting item:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting item',
      error: error instanceof Error ? error.message : String(error),
    } as ErrorResponse);
  }
});

// Update item
app.put('/items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const itemData: ItemUpdate = req.body;

    // Validation
    if (itemData.price !== undefined && itemData.price <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Price must be greater than 0',
      } as ErrorResponse);
    }

    const item = await dbService.updateItem(id, itemData);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: `Item not found: ${id}`,
      } as ErrorResponse);
    }

    res.json({
      success: true,
      data: item,
      message: 'Item updated successfully',
    });
  } catch (error) {
    console.error('Error updating item:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating item',
      error: error instanceof Error ? error.message : String(error),
    } as ErrorResponse);
  }
});

app.put('/typescript/items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const itemData: ItemUpdate = req.body;

    // Validation
    if (itemData.price !== undefined && itemData.price <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Price must be greater than 0',
      } as ErrorResponse);
    }

    const item = await dbService.updateItem(id, itemData);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: `Item not found: ${id}`,
      } as ErrorResponse);
    }

    res.json({
      success: true,
      data: item,
      message: 'Item updated successfully',
    });
  } catch (error) {
    console.error('Error updating item:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating item',
      error: error instanceof Error ? error.message : String(error),
    } as ErrorResponse);
  }
});

// Delete item
app.delete('/items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await dbService.deleteItem(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: `Item not found: ${id}`,
      } as ErrorResponse);
    }

    res.json({
      success: true,
      message: `Item ${id} deleted successfully`,
    });
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting item',
      error: error instanceof Error ? error.message : String(error),
    } as ErrorResponse);
  }
});

app.delete('/typescript/items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await dbService.deleteItem(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: `Item not found: ${id}`,
      } as ErrorResponse);
    }

    res.json({
      success: true,
      message: `Item ${id} deleted successfully`,
    });
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting item',
      error: error instanceof Error ? error.message : String(error),
    } as ErrorResponse);
  }
});

// List all items
app.get('/items', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const items = await dbService.listItems(limit);

    res.json({
      success: true,
      data: items,
      count: items.length,
      message: 'Items retrieved successfully',
    });
  } catch (error) {
    console.error('Error listing items:', error);
    res.status(500).json({
      success: false,
      message: 'Error listing items',
      error: error instanceof Error ? error.message : String(error),
    } as ErrorResponse);
  }
});

app.get('/typescript/items', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const items = await dbService.listItems(limit);

    res.json({
      success: true,
      data: items,
      count: items.length,
      message: 'Items retrieved successfully',
    });
  } catch (error) {
    console.error('Error listing items:', error);
    res.status(500).json({
      success: false,
      message: 'Error listing items',
      error: error instanceof Error ? error.message : String(error),
    } as ErrorResponse);
  }
});

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.ENVIRONMENT !== 'prod' ? err.message : undefined,
  } as ErrorResponse);
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  } as ErrorResponse);
});

// Export handler for Lambda
export const handler = serverless(app);
