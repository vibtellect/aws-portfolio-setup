import os
from typing import Optional
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from mangum import Mangum
from aws_lambda_powertools import Logger

from .models.item import ItemCreate, ItemUpdate, Item, ItemResponse, ItemListResponse
from .utils.dynamodb import DynamoDBClient
from .utils.metrics import MetricsCollector

# Initialize logger
logger = Logger()

# Initialize FastAPI app
app = FastAPI(
    title="Multi-Runtime API Benchmark - Python",
    description="Python Lambda implementation using FastAPI and Mangum",
    version="1.0.0",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize DynamoDB client and metrics collector
db_client = DynamoDBClient()
metrics_collector = MetricsCollector()


# Health check endpoint
@app.get("/health")
@app.get("/python/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "runtime": "python",
        "version": "3.11",
        "framework": "FastAPI + Mangum",
    }


# Metrics endpoint
@app.get("/metrics")
@app.get("/python/metrics")
async def get_metrics():
    """Get runtime performance metrics"""
    try:
        metrics = metrics_collector.get_metrics()
        return {
            "success": True,
            "data": metrics,
        }
    except Exception as e:
        logger.error(f"Error collecting metrics: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error collecting metrics: {str(e)}"
        )


# Create item
@app.post("/items", response_model=ItemResponse, status_code=status.HTTP_201_CREATED)
@app.post("/python/items", response_model=ItemResponse, status_code=status.HTTP_201_CREATED)
async def create_item(item_data: ItemCreate):
    """Create a new item"""
    try:
        item = db_client.create_item(item_data)
        return ItemResponse(
            success=True,
            data=item,
            message="Item created successfully"
        )
    except Exception as e:
        logger.error(f"Error creating item: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating item: {str(e)}"
        )


# Get item by ID
@app.get("/items/{item_id}", response_model=ItemResponse)
@app.get("/python/items/{item_id}", response_model=ItemResponse)
async def get_item(item_id: str):
    """Get an item by ID"""
    try:
        item = db_client.get_item(item_id)
        if not item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Item not found: {item_id}"
            )
        return ItemResponse(
            success=True,
            data=item,
            message="Item retrieved successfully"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting item {item_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting item: {str(e)}"
        )


# Update item
@app.put("/items/{item_id}", response_model=ItemResponse)
@app.put("/python/items/{item_id}", response_model=ItemResponse)
async def update_item(item_id: str, item_data: ItemUpdate):
    """Update an existing item"""
    try:
        item = db_client.update_item(item_id, item_data)
        if not item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Item not found: {item_id}"
            )
        return ItemResponse(
            success=True,
            data=item,
            message="Item updated successfully"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating item {item_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating item: {str(e)}"
        )


# Delete item
@app.delete("/items/{item_id}")
@app.delete("/python/items/{item_id}")
async def delete_item(item_id: str):
    """Delete an item"""
    try:
        deleted = db_client.delete_item(item_id)
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Item not found: {item_id}"
            )
        return {
            "success": True,
            "message": f"Item {item_id} deleted successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting item {item_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting item: {str(e)}"
        )


# List all items
@app.get("/items", response_model=ItemListResponse)
@app.get("/python/items", response_model=ItemListResponse)
async def list_items(limit: int = 100):
    """List all items with optional limit"""
    try:
        # TODO: Add pagination support with query parameter for exclusive_start_key
        items, _ = db_client.list_items(limit=limit, exclusive_start_key=None)
        return ItemListResponse(
            success=True,
            data=items,
            count=len(items),
            message="Items retrieved successfully"
        )
    except Exception as e:
        logger.error(f"Error listing items: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error listing items: {str(e)}"
        )


# Exception handler for better error responses
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "message": "Internal server error",
            "detail": str(exc) if os.environ.get('ENVIRONMENT') != 'prod' else None
        }
    )


# Lambda handler using Mangum
handler = Mangum(app, lifespan="off")
