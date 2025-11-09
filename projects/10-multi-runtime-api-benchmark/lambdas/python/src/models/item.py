from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict
from decimal import Decimal


class ItemBase(BaseModel):
    """Base item model with common fields"""
    name: str = Field(..., min_length=1, max_length=100, description="Item name")
    description: Optional[str] = Field(None, max_length=500, description="Item description")
    price: Decimal = Field(..., gt=0, description="Item price")


class ItemCreate(ItemBase):
    """Model for creating a new item"""
    pass


class ItemUpdate(BaseModel):
    """Model for updating an existing item (all fields optional)"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    price: Optional[Decimal] = Field(None, gt=0)


class Item(ItemBase):
    """Complete item model with metadata"""
    id: str = Field(..., description="Unique item identifier")
    created_at: int = Field(..., description="Creation timestamp (epoch milliseconds)")
    updated_at: int = Field(..., description="Last update timestamp (epoch milliseconds)")

    model_config = ConfigDict(from_attributes=True)


class ItemResponse(BaseModel):
    """API response wrapper for item operations"""
    success: bool
    data: Optional[Item] = None
    message: Optional[str] = None


class ItemListResponse(BaseModel):
    """API response for listing items"""
    success: bool
    data: list[Item]
    count: int
    message: Optional[str] = None
