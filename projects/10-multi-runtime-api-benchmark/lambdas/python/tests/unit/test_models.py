import pytest
from decimal import Decimal
from pydantic import ValidationError

from src.models.item import (
    ItemCreate,
    ItemUpdate,
    Item,
    ItemResponse,
    ItemListResponse,
)


class TestItemCreate:
    """Test ItemCreate model"""

    def test_valid_item_create(self):
        """Test creating a valid item"""
        item = ItemCreate(
            name="Test Item",
            description="Test Description",
            price=Decimal("19.99"),
        )
        assert item.name == "Test Item"
        assert item.description == "Test Description"
        assert item.price == Decimal("19.99")

    def test_item_create_without_description(self):
        """Test creating item without description"""
        item = ItemCreate(name="Test Item", price=Decimal("19.99"))
        assert item.name == "Test Item"
        assert item.description is None
        assert item.price == Decimal("19.99")

    def test_item_create_missing_name(self):
        """Test that name is required"""
        with pytest.raises(ValidationError) as exc:
            ItemCreate(price=Decimal("19.99"))
        assert "name" in str(exc.value)

    def test_item_create_missing_price(self):
        """Test that price is required"""
        with pytest.raises(ValidationError) as exc:
            ItemCreate(name="Test Item")
        assert "price" in str(exc.value)

    def test_item_create_invalid_price(self):
        """Test that price must be positive"""
        with pytest.raises(ValidationError) as exc:
            ItemCreate(name="Test Item", price=Decimal("-10.00"))
        assert "greater than 0" in str(exc.value).lower()

    def test_item_create_zero_price(self):
        """Test that price cannot be zero"""
        with pytest.raises(ValidationError) as exc:
            ItemCreate(name="Test Item", price=Decimal("0"))
        assert "greater than 0" in str(exc.value).lower()

    def test_item_create_name_too_long(self):
        """Test name length validation"""
        with pytest.raises(ValidationError) as exc:
            ItemCreate(name="x" * 101, price=Decimal("10.00"))
        assert "at most 100" in str(exc.value).lower()

    def test_item_create_description_too_long(self):
        """Test description length validation"""
        with pytest.raises(ValidationError) as exc:
            ItemCreate(
                name="Test",
                description="x" * 501,
                price=Decimal("10.00"),
            )
        assert "at most 500" in str(exc.value).lower()


class TestItemUpdate:
    """Test ItemUpdate model"""

    def test_valid_full_update(self):
        """Test updating all fields"""
        update = ItemUpdate(
            name="Updated Name",
            description="Updated Description",
            price=Decimal("29.99"),
        )
        assert update.name == "Updated Name"
        assert update.description == "Updated Description"
        assert update.price == Decimal("29.99")

    def test_partial_update_name_only(self):
        """Test updating only name"""
        update = ItemUpdate(name="Updated Name")
        assert update.name == "Updated Name"
        assert update.description is None
        assert update.price is None

    def test_partial_update_price_only(self):
        """Test updating only price"""
        update = ItemUpdate(price=Decimal("29.99"))
        assert update.name is None
        assert update.description is None
        assert update.price == Decimal("29.99")

    def test_empty_update(self):
        """Test creating empty update object"""
        update = ItemUpdate()
        assert update.name is None
        assert update.description is None
        assert update.price is None

    def test_update_invalid_price(self):
        """Test that price validation works in updates"""
        with pytest.raises(ValidationError) as exc:
            ItemUpdate(price=Decimal("-5.00"))
        assert "greater than 0" in str(exc.value).lower()


class TestItem:
    """Test Item model"""

    def test_valid_item(self):
        """Test creating a valid complete item"""
        item = Item(
            id="test-id",
            name="Test Item",
            description="Test Description",
            price=Decimal("19.99"),
            created_at=1704067200000,
            updated_at=1704067200000,
        )
        assert item.id == "test-id"
        assert item.name == "Test Item"
        assert item.description == "Test Description"
        assert item.price == Decimal("19.99")
        assert item.created_at == 1704067200000
        assert item.updated_at == 1704067200000

    def test_item_missing_id(self):
        """Test that id is required"""
        with pytest.raises(ValidationError) as exc:
            Item(
                name="Test",
                price=Decimal("10.00"),
                created_at=1704067200000,
                updated_at=1704067200000,
            )
        assert "id" in str(exc.value)

    def test_item_missing_timestamps(self):
        """Test that timestamps are required"""
        with pytest.raises(ValidationError) as exc:
            Item(id="test-id", name="Test", price=Decimal("10.00"))
        assert "created_at" in str(exc.value) or "updated_at" in str(exc.value)


class TestItemResponse:
    """Test ItemResponse model"""

    def test_success_response_with_data(self):
        """Test successful response with item data"""
        item = Item(
            id="test-id",
            name="Test",
            price=Decimal("10.00"),
            created_at=1704067200000,
            updated_at=1704067200000,
        )
        response = ItemResponse(
            success=True, data=item, message="Item created successfully"
        )
        assert response.success is True
        assert response.data == item
        assert response.message == "Item created successfully"

    def test_error_response_without_data(self):
        """Test error response without data"""
        response = ItemResponse(success=False, message="Item not found")
        assert response.success is False
        assert response.data is None
        assert response.message == "Item not found"


class TestItemListResponse:
    """Test ItemListResponse model"""

    def test_list_response_with_items(self):
        """Test list response with multiple items"""
        items = [
            Item(
                id=f"id-{i}",
                name=f"Item {i}",
                price=Decimal("10.00"),
                created_at=1704067200000,
                updated_at=1704067200000,
            )
            for i in range(3)
        ]
        response = ItemListResponse(
            success=True, data=items, count=3, message="Items retrieved"
        )
        assert response.success is True
        assert len(response.data) == 3
        assert response.count == 3
        assert response.message == "Items retrieved"

    def test_empty_list_response(self):
        """Test list response with no items"""
        response = ItemListResponse(
            success=True, data=[], count=0, message="No items found"
        )
        assert response.success is True
        assert len(response.data) == 0
        assert response.count == 0
