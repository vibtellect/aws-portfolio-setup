import pytest
from fastapi.testclient import TestClient
from decimal import Decimal
from unittest.mock import patch, Mock, MagicMock
from moto import mock_dynamodb
import boto3
import os

from src.app import app
from src.models.item import Item


@pytest.fixture
def client():
    """Create a test client"""
    return TestClient(app)


@pytest.fixture
def mock_db_client():
    """Mock DynamoDB client"""
    with patch("src.app.db_client") as mock:
        yield mock


@pytest.fixture
def mock_metrics_collector():
    """Mock metrics collector"""
    with patch("src.app.metrics_collector") as mock:
        yield mock


@pytest.fixture
def sample_item():
    """Create a sample item"""
    return Item(
        id="test-id-123",
        name="Test Item",
        description="Test Description",
        price=Decimal("19.99"),
        created_at=1704067200000,
        updated_at=1704067200000,
    )


class TestHealthEndpoint:
    """Test health check endpoint"""

    def test_health_check(self, client):
        """Test basic health check"""
        response = client.get("/health")

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["runtime"] == "python"
        assert "version" in data
        assert "framework" in data

    def test_health_check_python_route(self, client):
        """Test health check with /python prefix"""
        response = client.get("/python/health")

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["runtime"] == "python"


class TestMetricsEndpoint:
    """Test metrics endpoint"""

    def test_get_metrics(self, client, mock_metrics_collector):
        """Test metrics endpoint"""
        mock_metrics_collector.get_metrics.return_value = {
            "runtime": "python",
            "cold_start": False,
            "memory": {"rss_mb": 85.2},
        }

        response = client.get("/metrics")

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "data" in data
        assert data["data"]["runtime"] == "python"

    def test_get_metrics_python_route(self, client, mock_metrics_collector):
        """Test metrics with /python prefix"""
        mock_metrics_collector.get_metrics.return_value = {
            "runtime": "python",
            "cold_start": False,
        }

        response = client.get("/python/metrics")

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True

    def test_get_metrics_error(self, client, mock_metrics_collector):
        """Test metrics endpoint error handling"""
        mock_metrics_collector.get_metrics.side_effect = Exception("Metrics error")

        response = client.get("/metrics")

        assert response.status_code == 500
        data = response.json()
        assert "Error collecting metrics" in data["detail"]


class TestCreateItem:
    """Test item creation endpoint"""

    def test_create_item_success(self, client, mock_db_client, sample_item):
        """Test successful item creation"""
        mock_db_client.create_item.return_value = sample_item

        response = client.post(
            "/items",
            json={"name": "Test Item", "description": "Test Description", "price": 19.99},
        )

        assert response.status_code == 201
        data = response.json()
        assert data["success"] is True
        assert data["data"]["name"] == "Test Item"
        assert data["message"] == "Item created successfully"

    def test_create_item_python_route(self, client, mock_db_client, sample_item):
        """Test item creation with /python prefix"""
        mock_db_client.create_item.return_value = sample_item

        response = client.post(
            "/python/items",
            json={"name": "Test Item", "price": 19.99},
        )

        assert response.status_code == 201
        data = response.json()
        assert data["success"] is True

    def test_create_item_without_description(self, client, mock_db_client, sample_item):
        """Test creating item without description"""
        mock_db_client.create_item.return_value = sample_item

        response = client.post(
            "/items",
            json={"name": "Test Item", "price": 19.99},
        )

        assert response.status_code == 201
        data = response.json()
        assert data["success"] is True

    def test_create_item_missing_name(self, client):
        """Test creating item without name"""
        response = client.post(
            "/items",
            json={"price": 19.99},
        )

        assert response.status_code == 422  # Validation error

    def test_create_item_missing_price(self, client):
        """Test creating item without price"""
        response = client.post(
            "/items",
            json={"name": "Test Item"},
        )

        assert response.status_code == 422  # Validation error

    def test_create_item_invalid_price(self, client):
        """Test creating item with invalid price"""
        response = client.post(
            "/items",
            json={"name": "Test Item", "price": -10.00},
        )

        assert response.status_code == 422  # Validation error

    def test_create_item_db_error(self, client, mock_db_client):
        """Test item creation with database error"""
        mock_db_client.create_item.side_effect = Exception("Database error")

        response = client.post(
            "/items",
            json={"name": "Test Item", "price": 19.99},
        )

        assert response.status_code == 500


class TestGetItem:
    """Test get item endpoint"""

    def test_get_item_success(self, client, mock_db_client, sample_item):
        """Test successful item retrieval"""
        mock_db_client.get_item.return_value = sample_item

        response = client.get("/items/test-id-123")

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["data"]["id"] == "test-id-123"
        assert data["data"]["name"] == "Test Item"

    def test_get_item_not_found(self, client, mock_db_client):
        """Test getting non-existent item"""
        mock_db_client.get_item.return_value = None

        response = client.get("/items/non-existent-id")

        assert response.status_code == 404
        data = response.json()
        assert "not found" in data["detail"].lower()

    def test_get_item_db_error(self, client, mock_db_client):
        """Test get item with database error"""
        mock_db_client.get_item.side_effect = Exception("Database error")

        response = client.get("/items/test-id-123")

        assert response.status_code == 500


class TestUpdateItem:
    """Test update item endpoint"""

    def test_update_item_success(self, client, mock_db_client, sample_item):
        """Test successful item update"""
        updated_item = sample_item.model_copy(
            update={"name": "Updated Name", "price": Decimal("29.99")}
        )
        mock_db_client.update_item.return_value = updated_item

        response = client.put(
            "/items/test-id-123",
            json={"name": "Updated Name", "price": 29.99},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["data"]["name"] == "Updated Name"

    def test_update_item_partial(self, client, mock_db_client, sample_item):
        """Test partial item update"""
        updated_item = sample_item.model_copy(update={"price": Decimal("29.99")})
        mock_db_client.update_item.return_value = updated_item

        response = client.put(
            "/items/test-id-123",
            json={"price": 29.99},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True

    def test_update_item_not_found(self, client, mock_db_client):
        """Test updating non-existent item"""
        mock_db_client.update_item.return_value = None

        response = client.put(
            "/items/non-existent-id",
            json={"name": "Updated Name"},
        )

        assert response.status_code == 404

    def test_update_item_invalid_price(self, client):
        """Test update with invalid price"""
        response = client.put(
            "/items/test-id-123",
            json={"price": -10.00},
        )

        assert response.status_code == 422


class TestDeleteItem:
    """Test delete item endpoint"""

    def test_delete_item_success(self, client, mock_db_client):
        """Test successful item deletion"""
        mock_db_client.delete_item.return_value = True

        response = client.delete("/items/test-id-123")

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "deleted successfully" in data["message"]

    def test_delete_item_not_found(self, client, mock_db_client):
        """Test deleting non-existent item"""
        mock_db_client.delete_item.return_value = False

        response = client.delete("/items/non-existent-id")

        assert response.status_code == 404

    def test_delete_item_db_error(self, client, mock_db_client):
        """Test delete with database error"""
        mock_db_client.delete_item.side_effect = Exception("Database error")

        response = client.delete("/items/test-id-123")

        assert response.status_code == 500


class TestListItems:
    """Test list items endpoint"""

    def test_list_items_success(self, client, mock_db_client):
        """Test successful items listing"""
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
        mock_db_client.list_items.return_value = items

        response = client.get("/items")

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert len(data["data"]) == 3
        assert data["count"] == 3

    def test_list_items_empty(self, client, mock_db_client):
        """Test listing when no items exist"""
        mock_db_client.list_items.return_value = []

        response = client.get("/items")

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert len(data["data"]) == 0
        assert data["count"] == 0

    def test_list_items_with_limit(self, client, mock_db_client):
        """Test listing items with limit parameter"""
        items = [
            Item(
                id=f"id-{i}",
                name=f"Item {i}",
                price=Decimal("10.00"),
                created_at=1704067200000,
                updated_at=1704067200000,
            )
            for i in range(2)
        ]
        mock_db_client.list_items.return_value = items

        response = client.get("/items?limit=50")

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        mock_db_client.list_items.assert_called_once_with(limit=50)

    def test_list_items_db_error(self, client, mock_db_client):
        """Test list items with database error"""
        mock_db_client.list_items.side_effect = Exception("Database error")

        response = client.get("/items")

        assert response.status_code == 500


class TestCORS:
    """Test CORS configuration"""

    def test_cors_headers_present(self, client):
        """Test that CORS headers are present"""
        response = client.get("/health")

        assert "access-control-allow-origin" in response.headers
        assert response.headers["access-control-allow-origin"] == "*"
