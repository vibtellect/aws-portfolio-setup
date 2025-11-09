package utils

import (
	"os"
	"testing"

	"github.com/vibtellect/benchmark-go-lambda/internal/models"
)

func TestNewDynamoDBClient(t *testing.T) {
	// Test with custom table name
	os.Setenv("TABLE_NAME", "test-table")
	defer os.Unsetenv("TABLE_NAME")

	client := NewDynamoDBClient()

	if client == nil {
		t.Fatal("Expected client to be non-nil")
	}

	if client.tableName != "test-table" {
		t.Errorf("Expected table name 'test-table', got '%s'", client.tableName)
	}

	if client.client == nil {
		t.Error("Expected DynamoDB client to be initialized")
	}
}

func TestNewDynamoDBClientDefaultTableName(t *testing.T) {
	// Ensure TABLE_NAME is not set
	os.Unsetenv("TABLE_NAME")

	client := NewDynamoDBClient()

	if client.tableName != "dev-benchmark-items" {
		t.Errorf("Expected default table name 'dev-benchmark-items', got '%s'", client.tableName)
	}
}

func TestItemCreateValidation(t *testing.T) {
	tests := []struct {
		name    string
		input   models.ItemCreate
		isValid bool
	}{
		{
			name: "Valid item",
			input: models.ItemCreate{
				Name:        "Test Item",
				Description: "Test Description",
				Price:       19.99,
			},
			isValid: true,
		},
		{
			name: "Empty name",
			input: models.ItemCreate{
				Name:        "",
				Description: "Description",
				Price:       10.0,
			},
			isValid: false,
		},
		{
			name: "Zero price",
			input: models.ItemCreate{
				Name:        "Item",
				Description: "Description",
				Price:       0,
			},
			isValid: false,
		},
		{
			name: "Negative price",
			input: models.ItemCreate{
				Name:        "Item",
				Description: "Description",
				Price:       -5.0,
			},
			isValid: false,
		},
		{
			name: "Valid with empty description",
			input: models.ItemCreate{
				Name:        "Item",
				Description: "",
				Price:       10.0,
			},
			isValid: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Basic validation logic
			isValid := tt.input.Name != "" && tt.input.Price > 0

			if isValid != tt.isValid {
				t.Errorf("Expected validation %v, got %v", tt.isValid, isValid)
			}
		})
	}
}

func TestItemUpdateValidation(t *testing.T) {
	tests := []struct {
		name    string
		input   models.ItemUpdate
		isValid bool
	}{
		{
			name: "Update name only",
			input: models.ItemUpdate{
				Name:        stringPtr("Updated"),
				Description: nil,
				Price:       nil,
			},
			isValid: true,
		},
		{
			name: "Update price only",
			input: models.ItemUpdate{
				Name:        nil,
				Description: nil,
				Price:       float64Ptr(29.99),
			},
			isValid: true,
		},
		{
			name: "Update with invalid price",
			input: models.ItemUpdate{
				Name:        nil,
				Description: nil,
				Price:       float64Ptr(-10.0),
			},
			isValid: false,
		},
		{
			name: "Update with zero price",
			input: models.ItemUpdate{
				Name:        nil,
				Description: nil,
				Price:       float64Ptr(0.0),
			},
			isValid: false,
		},
		{
			name: "Update with empty name",
			input: models.ItemUpdate{
				Name:        stringPtr(""),
				Description: nil,
				Price:       nil,
			},
			isValid: false,
		},
		{
			name: "Valid update all fields",
			input: models.ItemUpdate{
				Name:        stringPtr("New Name"),
				Description: stringPtr("New Description"),
				Price:       float64Ptr(39.99),
			},
			isValid: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Validation logic for updates
			isValid := true

			if tt.input.Name != nil && *tt.input.Name == "" {
				isValid = false
			}

			if tt.input.Price != nil && *tt.input.Price <= 0 {
				isValid = false
			}

			if isValid != tt.isValid {
				t.Errorf("Expected validation %v, got %v", tt.isValid, isValid)
			}
		})
	}
}

func TestDynamoDBClientTableName(t *testing.T) {
	tests := []struct {
		name      string
		envValue  string
		expected  string
	}{
		{
			name:     "Custom table name",
			envValue: "custom-table",
			expected: "custom-table",
		},
		{
			name:     "Production table",
			envValue: "prod-benchmark-items",
			expected: "prod-benchmark-items",
		},
		{
			name:     "Staging table",
			envValue: "staging-benchmark-items",
			expected: "staging-benchmark-items",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			os.Setenv("TABLE_NAME", tt.envValue)
			defer os.Unsetenv("TABLE_NAME")

			client := NewDynamoDBClient()

			if client.tableName != tt.expected {
				t.Errorf("Expected table name '%s', got '%s'", tt.expected, client.tableName)
			}
		})
	}
}

func TestItemStructure(t *testing.T) {
	// Test that Item structure is properly defined
	item := models.Item{
		ID:          "test-id",
		Name:        "Test",
		Description: "Description",
		Price:       10.0,
		CreatedAt:   1704067200000,
		UpdatedAt:   1704067200000,
	}

	if item.ID == "" {
		t.Error("Item ID should not be empty")
	}

	if item.Name == "" {
		t.Error("Item Name should not be empty")
	}

	if item.Price <= 0 {
		t.Error("Item Price should be positive")
	}

	if item.CreatedAt <= 0 {
		t.Error("Item CreatedAt should be positive")
	}

	if item.UpdatedAt <= 0 {
		t.Error("Item UpdatedAt should be positive")
	}
}

func TestCurrentTimestampFormat(t *testing.T) {
	timestamp := models.CurrentTimestamp()

	// Timestamp should be positive
	if timestamp <= 0 {
		t.Errorf("Expected positive timestamp, got %d", timestamp)
	}

	// Timestamp should be reasonable (after 2020)
	minimumTimestamp := int64(1577836800000) // 2020-01-01 in milliseconds
	if timestamp < minimumTimestamp {
		t.Errorf("Timestamp %d seems too old", timestamp)
	}

	// Check that subsequent timestamps increase
	timestamp2 := models.CurrentTimestamp()
	if timestamp2 < timestamp {
		t.Error("Timestamps should increase over time")
	}
}

// Helper functions
func stringPtr(s string) *string {
	return &s
}

func float64Ptr(f float64) *float64 {
	return &f
}
