import pytest
import os
from decimal import Decimal
from unittest.mock import Mock, patch, MagicMock
from moto import mock_dynamodb
import boto3

from src.utils.dynamodb import DynamoDBClient
from src.models.item import ItemCreate, ItemUpdate


@pytest.fixture
def mock_table_name():
    """Provide a test table name"""
    return "test-benchmark-items"


@pytest.fixture
def dynamodb_client(mock_table_name):
    """Create DynamoDB client with mocked table"""
    with patch.dict(os.environ, {"TABLE_NAME": mock_table_name}):
        client = DynamoDBClient()
        return client


@pytest.fixture
def mock_dynamodb_table():
    """Create a real mock DynamoDB table using moto"""
    with mock_dynamodb():
        # Create DynamoDB resource
        dynamodb = boto3.resource("dynamodb", region_name="us-east-1")

        # Create table
        table = dynamodb.create_table(
            TableName="test-benchmark-items",
            KeySchema=[{"AttributeName": "id", "KeyType": "HASH"}],
            AttributeDefinitions=[{"AttributeName": "id", "AttributeType": "S"}],
            BillingMode="PAY_PER_REQUEST",
        )

        yield table


class TestDynamoDBClient:
    """Test DynamoDB client"""

    def test_init(self, dynamodb_client, mock_table_name):
        """Test client initialization"""
        assert dynamodb_client.table_name == mock_table_name
        assert dynamodb_client.dynamodb is not None
        assert dynamodb_client.table is not None

    def test_current_timestamp(self, dynamodb_client):
        """Test timestamp generation"""
        timestamp1 = dynamodb_client._current_timestamp()
        timestamp2 = dynamodb_client._current_timestamp()

        assert isinstance(timestamp1, int)
        assert isinstance(timestamp2, int)
        assert timestamp2 >= timestamp1

    @mock_dynamodb
    def test_create_item(self, mock_dynamodb_table):
        """Test creating an item"""
        with patch.dict(os.environ, {"TABLE_NAME": "test-benchmark-items"}):
            client = DynamoDBClient()
            item_data = ItemCreate(
                name="Test Item", description="Test Description", price=Decimal("19.99")
            )

            item = client.create_item(item_data)

            assert item.id is not None
            assert item.name == "Test Item"
            assert item.description == "Test Description"
            assert item.price == Decimal("19.99")
            assert item.created_at > 0
            assert item.updated_at > 0
            assert item.created_at == item.updated_at

    @mock_dynamodb
    def test_create_item_without_description(self, mock_dynamodb_table):
        """Test creating item without description"""
        with patch.dict(os.environ, {"TABLE_NAME": "test-benchmark-items"}):
            client = DynamoDBClient()
            item_data = ItemCreate(name="Test Item", price=Decimal("19.99"))

            item = client.create_item(item_data)

            assert item.description == ""

    @mock_dynamodb
    def test_get_item_exists(self, mock_dynamodb_table):
        """Test getting an existing item"""
        with patch.dict(os.environ, {"TABLE_NAME": "test-benchmark-items"}):
            client = DynamoDBClient()

            # Create item first
            item_data = ItemCreate(name="Test Item", price=Decimal("19.99"))
            created_item = client.create_item(item_data)

            # Get the item
            retrieved_item = client.get_item(created_item.id)

            assert retrieved_item is not None
            assert retrieved_item.id == created_item.id
            assert retrieved_item.name == created_item.name
            assert retrieved_item.price == created_item.price

    @mock_dynamodb
    def test_get_item_not_exists(self, mock_dynamodb_table):
        """Test getting a non-existent item"""
        with patch.dict(os.environ, {"TABLE_NAME": "test-benchmark-items"}):
            client = DynamoDBClient()

            result = client.get_item("non-existent-id")

            assert result is None

    @mock_dynamodb
    def test_update_item_all_fields(self, mock_dynamodb_table):
        """Test updating all fields of an item"""
        with patch.dict(os.environ, {"TABLE_NAME": "test-benchmark-items"}):
            client = DynamoDBClient()

            # Create item
            item_data = ItemCreate(
                name="Original Name",
                description="Original Description",
                price=Decimal("10.00"),
            )
            created_item = client.create_item(item_data)
            original_updated_at = created_item.updated_at

            # Update item
            update_data = ItemUpdate(
                name="Updated Name",
                description="Updated Description",
                price=Decimal("20.00"),
            )
            updated_item = client.update_item(created_item.id, update_data)

            assert updated_item is not None
            assert updated_item.id == created_item.id
            assert updated_item.name == "Updated Name"
            assert updated_item.description == "Updated Description"
            assert updated_item.price == Decimal("20.00")
            assert updated_item.updated_at > original_updated_at

    @mock_dynamodb
    def test_update_item_partial(self, mock_dynamodb_table):
        """Test updating only some fields"""
        with patch.dict(os.environ, {"TABLE_NAME": "test-benchmark-items"}):
            client = DynamoDBClient()

            # Create item
            item_data = ItemCreate(
                name="Original Name",
                description="Original Description",
                price=Decimal("10.00"),
            )
            created_item = client.create_item(item_data)

            # Update only price
            update_data = ItemUpdate(price=Decimal("20.00"))
            updated_item = client.update_item(created_item.id, update_data)

            assert updated_item is not None
            assert updated_item.name == "Original Name"  # Unchanged
            assert updated_item.description == "Original Description"  # Unchanged
            assert updated_item.price == Decimal("20.00")  # Changed

    @mock_dynamodb
    def test_update_item_not_exists(self, mock_dynamodb_table):
        """Test updating a non-existent item"""
        with patch.dict(os.environ, {"TABLE_NAME": "test-benchmark-items"}):
            client = DynamoDBClient()

            update_data = ItemUpdate(name="Updated Name")
            result = client.update_item("non-existent-id", update_data)

            assert result is None

    @mock_dynamodb
    def test_delete_item_exists(self, mock_dynamodb_table):
        """Test deleting an existing item"""
        with patch.dict(os.environ, {"TABLE_NAME": "test-benchmark-items"}):
            client = DynamoDBClient()

            # Create item
            item_data = ItemCreate(name="Test Item", price=Decimal("19.99"))
            created_item = client.create_item(item_data)

            # Delete item
            result = client.delete_item(created_item.id)

            assert result is True

            # Verify item is deleted
            retrieved_item = client.get_item(created_item.id)
            assert retrieved_item is None

    @mock_dynamodb
    def test_delete_item_not_exists(self, mock_dynamodb_table):
        """Test deleting a non-existent item"""
        with patch.dict(os.environ, {"TABLE_NAME": "test-benchmark-items"}):
            client = DynamoDBClient()

            result = client.delete_item("non-existent-id")

            assert result is False

    @mock_dynamodb
    def test_list_items_empty(self, mock_dynamodb_table):
        """Test listing items when table is empty"""
        with patch.dict(os.environ, {"TABLE_NAME": "test-benchmark-items"}):
            client = DynamoDBClient()

            items = client.list_items()

            assert isinstance(items, list)
            assert len(items) == 0

    @mock_dynamodb
    def test_list_items_with_data(self, mock_dynamodb_table):
        """Test listing items when table has data"""
        with patch.dict(os.environ, {"TABLE_NAME": "test-benchmark-items"}):
            client = DynamoDBClient()

            # Create multiple items
            for i in range(3):
                item_data = ItemCreate(name=f"Item {i}", price=Decimal("10.00"))
                client.create_item(item_data)

            # List items
            items = client.list_items()

            assert isinstance(items, list)
            assert len(items) == 3

    @mock_dynamodb
    def test_list_items_with_limit(self, mock_dynamodb_table):
        """Test listing items with limit"""
        with patch.dict(os.environ, {"TABLE_NAME": "test-benchmark-items"}):
            client = DynamoDBClient()

            # Create multiple items
            for i in range(5):
                item_data = ItemCreate(name=f"Item {i}", price=Decimal("10.00"))
                client.create_item(item_data)

            # List items with limit
            items = client.list_items(limit=3)

            assert isinstance(items, list)
            assert len(items) <= 3
