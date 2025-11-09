import os
import time
import uuid
from typing import Optional, List
from decimal import Decimal
import boto3
from botocore.exceptions import ClientError
from aws_lambda_powertools import Logger

from ..models.item import Item, ItemCreate, ItemUpdate

logger = Logger()


class DynamoDBClient:
    """DynamoDB client for item operations"""

    def __init__(self):
        self.table_name = os.environ.get('TABLE_NAME', 'dev-benchmark-items')
        self.dynamodb = boto3.resource('dynamodb')
        self.table = self.dynamodb.Table(self.table_name)
        logger.info(f"DynamoDB client initialized for table: {self.table_name}")

    @staticmethod
    def _current_timestamp() -> int:
        """Get current timestamp in milliseconds"""
        return int(time.time() * 1000)

    @staticmethod
    def _decimal_to_float(obj):
        """Convert Decimal to float for JSON serialization"""
        if isinstance(obj, Decimal):
            return float(obj)
        raise TypeError

    def create_item(self, item_data: ItemCreate) -> Item:
        """Create a new item in DynamoDB"""
        item_id = str(uuid.uuid4())
        current_time = self._current_timestamp()

        item = {
            'id': item_id,
            'name': item_data.name,
            'description': item_data.description or '',
            'price': Decimal(str(item_data.price)),
            'created_at': current_time,
            'updated_at': current_time,
        }

        try:
            self.table.put_item(Item=item)
            logger.info(f"Created item: {item_id}")
            return Item(**item)
        except ClientError as e:
            logger.exception("Error creating item")
            raise

    def get_item(self, item_id: str) -> Optional[Item]:
        """Get an item by ID"""
        try:
            response = self.table.get_item(Key={'id': item_id})
            if 'Item' in response:
                logger.info(f"Retrieved item: {item_id}")
                return Item(**response['Item'])
            logger.warning(f"Item not found: {item_id}")
            return None
        except ClientError as e:
            logger.error(f"Error getting item {item_id}: {e}")
            raise

    def update_item(self, item_id: str, item_data: ItemUpdate) -> Optional[Item]:
        """Update an existing item"""
        # First check if item exists
        existing_item = self.get_item(item_id)
        if not existing_item:
            return None

        # Build update expression
        update_parts = []
        expression_values = {}
        expression_names = {}

        if item_data.name is not None:
            update_parts.append('#n = :name')
            expression_values[':name'] = item_data.name
            expression_names['#n'] = 'name'

        if item_data.description is not None:
            update_parts.append('description = :description')
            expression_values[':description'] = item_data.description

        if item_data.price is not None:
            update_parts.append('price = :price')
            expression_values[':price'] = Decimal(str(item_data.price))

        # Always update timestamp
        update_parts.append('updated_at = :updated_at')
        expression_values[':updated_at'] = self._current_timestamp()

        update_expression = 'SET ' + ', '.join(update_parts)

        try:
            response = self.table.update_item(
                Key={'id': item_id},
                UpdateExpression=update_expression,
                ExpressionAttributeValues=expression_values,
                ExpressionAttributeNames=expression_names if expression_names else None,
                ReturnValues='ALL_NEW'
            )
            logger.info(f"Updated item: {item_id}")
            return Item(**response['Attributes'])
        except ClientError as e:
            logger.error(f"Error updating item {item_id}: {e}")
            raise

    def delete_item(self, item_id: str) -> bool:
        """Delete an item"""
        try:
            # Check if item exists first
            existing_item = self.get_item(item_id)
            if not existing_item:
                return False

            self.table.delete_item(Key={'id': item_id})
            logger.info(f"Deleted item: {item_id}")
            return True
        except ClientError as e:
            logger.error(f"Error deleting item {item_id}: {e}")
            raise

    def list_items(
        self,
        limit: int = 100,
        exclusive_start_key: Optional[dict] = None
    ) -> tuple[List[Item], Optional[dict]]:
        """
        List items with optional pagination support

        Args:
            limit: Maximum number of items to return (default: 100)
            exclusive_start_key: Optional key to start scanning from (for pagination)

        Returns:
            Tuple of (items, last_evaluated_key) where last_evaluated_key is None if no more items
        """
        try:
            actual_limit = limit if limit > 0 else 100

            scan_kwargs = {'Limit': actual_limit}
            if exclusive_start_key:
                scan_kwargs['ExclusiveStartKey'] = exclusive_start_key

            response = self.table.scan(**scan_kwargs)
            items = [Item(**item) for item in response.get('Items', [])]
            last_evaluated_key = response.get('LastEvaluatedKey')

            has_more = last_evaluated_key is not None
            logger.info(f"Listed {len(items)} items (hasMore: {has_more})")

            return items, last_evaluated_key
        except ClientError as e:
            logger.error(f"Error listing items: {e}")
            raise
