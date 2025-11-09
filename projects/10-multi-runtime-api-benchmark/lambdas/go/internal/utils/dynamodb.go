package utils

import (
	"fmt"
	"log"
	"os"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbattribute"
	"github.com/google/uuid"
	"github.com/vibtellect/benchmark-go-lambda/internal/models"
)

// DynamoDBClient handles DynamoDB operations
type DynamoDBClient struct {
	client    *dynamodb.DynamoDB
	tableName string
}

// NewDynamoDBClient creates a new DynamoDB client
func NewDynamoDBClient() *DynamoDBClient {
	sess := session.Must(session.NewSession())
	client := dynamodb.New(sess)

	tableName := os.Getenv("TABLE_NAME")
	if tableName == "" {
		tableName = "dev-benchmark-items"
	}

	log.Printf("DynamoDB client initialized for table: %s", tableName)

	return &DynamoDBClient{
		client:    client,
		tableName: tableName,
	}
}

// CreateItem creates a new item in DynamoDB
func (db *DynamoDBClient) CreateItem(itemData models.ItemCreate) (*models.Item, error) {
	itemID := uuid.New().String()
	currentTime := models.CurrentTimestamp()

	item := models.Item{
		ID:          itemID,
		Name:        itemData.Name,
		Description: itemData.Description,
		Price:       itemData.Price,
		CreatedAt:   currentTime,
		UpdatedAt:   currentTime,
	}

	av, err := dynamodbattribute.MarshalMap(item)
	if err != nil {
		log.Printf("Error marshaling item: %v", err)
		return nil, err
	}

	input := &dynamodb.PutItemInput{
		TableName: aws.String(db.tableName),
		Item:      av,
	}

	_, err = db.client.PutItem(input)
	if err != nil {
		log.Printf("Error creating item: %v", err)
		return nil, err
	}

	log.Printf("Created item: %s", itemID)
	return &item, nil
}

// GetItem retrieves an item by ID
func (db *DynamoDBClient) GetItem(itemID string) (*models.Item, error) {
	input := &dynamodb.GetItemInput{
		TableName: aws.String(db.tableName),
		Key: map[string]*dynamodb.AttributeValue{
			"id": {
				S: aws.String(itemID),
			},
		},
	}

	result, err := db.client.GetItem(input)
	if err != nil {
		log.Printf("Error getting item %s: %v", itemID, err)
		return nil, err
	}

	if result.Item == nil {
		log.Printf("Item not found: %s", itemID)
		return nil, nil
	}

	var item models.Item
	err = dynamodbattribute.UnmarshalMap(result.Item, &item)
	if err != nil {
		log.Printf("Error unmarshaling item: %v", err)
		return nil, err
	}

	log.Printf("Retrieved item: %s", itemID)
	return &item, nil
}

// UpdateItem updates an existing item
func (db *DynamoDBClient) UpdateItem(itemID string, itemData models.ItemUpdate) (*models.Item, error) {
	// First check if item exists
	existingItem, err := db.GetItem(itemID)
	if err != nil {
		return nil, err
	}
	if existingItem == nil {
		return nil, nil
	}

	// Build update expression
	updateExpression := "SET updated_at = :updated_at"
	expressionValues := map[string]*dynamodb.AttributeValue{
		":updated_at": {
			N: aws.String(fmt.Sprintf("%d", models.CurrentTimestamp())),
		},
	}

	if itemData.Name != nil {
		updateExpression += ", #n = :name"
		expressionValues[":name"] = &dynamodb.AttributeValue{
			S: aws.String(*itemData.Name),
		}
	}

	if itemData.Description != nil {
		updateExpression += ", description = :description"
		expressionValues[":description"] = &dynamodb.AttributeValue{
			S: aws.String(*itemData.Description),
		}
	}

	if itemData.Price != nil {
		updateExpression += ", price = :price"
		expressionValues[":price"] = &dynamodb.AttributeValue{
			N: aws.String(strconv.FormatFloat(*itemData.Price, 'f', -1, 64)),
		}
	}

	input := &dynamodb.UpdateItemInput{
		TableName: aws.String(db.tableName),
		Key: map[string]*dynamodb.AttributeValue{
			"id": {
				S: aws.String(itemID),
			},
		},
		UpdateExpression:          aws.String(updateExpression),
		ExpressionAttributeValues: expressionValues,
		ReturnValues:              aws.String("ALL_NEW"),
	}

	// Add expression attribute names if name is being updated
	if itemData.Name != nil {
		input.ExpressionAttributeNames = map[string]*string{
			"#n": aws.String("name"),
		}
	}

	result, err := db.client.UpdateItem(input)
	if err != nil {
		log.Printf("Error updating item %s: %v", itemID, err)
		return nil, err
	}

	var item models.Item
	err = dynamodbattribute.UnmarshalMap(result.Attributes, &item)
	if err != nil {
		log.Printf("Error unmarshaling updated item: %v", err)
		return nil, err
	}

	log.Printf("Updated item: %s", itemID)
	return &item, nil
}

// DeleteItem deletes an item
func (db *DynamoDBClient) DeleteItem(itemID string) (bool, error) {
	// Check if item exists first
	existingItem, err := db.GetItem(itemID)
	if err != nil {
		return false, err
	}
	if existingItem == nil {
		return false, nil
	}

	input := &dynamodb.DeleteItemInput{
		TableName: aws.String(db.tableName),
		Key: map[string]*dynamodb.AttributeValue{
			"id": {
				S: aws.String(itemID),
			},
		},
	}

	_, err = db.client.DeleteItem(input)
	if err != nil {
		log.Printf("Error deleting item %s: %v", itemID, err)
		return false, err
	}

	log.Printf("Deleted item: %s", itemID)
	return true, nil
}

// ListItems lists all items with optional limit and pagination support
// Returns items, lastEvaluatedKey for pagination, and error
func (db *DynamoDBClient) ListItems(limit int64, exclusiveStartKey map[string]*dynamodb.AttributeValue) ([]models.Item, map[string]*dynamodb.AttributeValue, error) {
	if limit <= 0 {
		limit = 100
	}

	input := &dynamodb.ScanInput{
		TableName:         aws.String(db.tableName),
		Limit:             aws.Int64(limit),
		ExclusiveStartKey: exclusiveStartKey,
	}

	result, err := db.client.Scan(input)
	if err != nil {
		log.Printf("Error listing items: %v", err)
		return nil, nil, err
	}

	items := make([]models.Item, 0, len(result.Items))
	for _, i := range result.Items {
		var item models.Item
		err = dynamodbattribute.UnmarshalMap(i, &item)
		if err != nil {
			log.Printf("Error unmarshaling item: %v", err)
			continue
		}
		items = append(items, item)
	}

	log.Printf("Listed %d items (hasMore: %v)", len(items), len(result.LastEvaluatedKey) > 0)
	return items, result.LastEvaluatedKey, nil
}
