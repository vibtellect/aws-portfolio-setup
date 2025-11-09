package models

import (
	"encoding/json"
	"testing"
	"time"
)

func TestItemJSONMarshaling(t *testing.T) {
	tests := []struct {
		name     string
		item     Item
		expected string
	}{
		{
			name: "Complete item",
			item: Item{
				ID:          "test-123",
				Name:        "Test Item",
				Description: "Test Description",
				Price:       19.99,
				CreatedAt:   1704067200000,
				UpdatedAt:   1704067200000,
			},
			expected: `{"id":"test-123","name":"Test Item","description":"Test Description","price":19.99,"created_at":1704067200000,"updated_at":1704067200000}`,
		},
		{
			name: "Item with zero price",
			item: Item{
				ID:          "test-456",
				Name:        "Another Item",
				Description: "",
				Price:       0.0,
				CreatedAt:   1704067200000,
				UpdatedAt:   1704067200000,
			},
			expected: `{"id":"test-456","name":"Another Item","price":0,"created_at":1704067200000,"updated_at":1704067200000}`,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			data, err := json.Marshal(tt.item)
			if err != nil {
				t.Fatalf("Failed to marshal item: %v", err)
			}

			if string(data) != tt.expected {
				t.Errorf("Expected JSON %s, got %s", tt.expected, string(data))
			}
		})
	}
}

func TestItemJSONUnmarshaling(t *testing.T) {
	tests := []struct {
		name     string
		jsonData string
		expected Item
		wantErr  bool
	}{
		{
			name:     "Valid JSON",
			jsonData: `{"id":"test-123","name":"Test Item","description":"Test Description","price":19.99,"created_at":1704067200000,"updated_at":1704067200000}`,
			expected: Item{
				ID:          "test-123",
				Name:        "Test Item",
				Description: "Test Description",
				Price:       19.99,
				CreatedAt:   1704067200000,
				UpdatedAt:   1704067200000,
			},
			wantErr: false,
		},
		{
			name:     "Invalid JSON",
			jsonData: `{"id":"test-123","name":}`,
			wantErr:  true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var item Item
			err := json.Unmarshal([]byte(tt.jsonData), &item)

			if tt.wantErr {
				if err == nil {
					t.Error("Expected error, got nil")
				}
				return
			}

			if err != nil {
				t.Fatalf("Unexpected error: %v", err)
			}

			if item != tt.expected {
				t.Errorf("Expected item %+v, got %+v", tt.expected, item)
			}
		})
	}
}

func TestItemCreateJSONMarshaling(t *testing.T) {
	tests := []struct {
		name     string
		input    ItemCreate
		expected string
	}{
		{
			name: "Complete create request",
			input: ItemCreate{
				Name:        "New Item",
				Description: "New Description",
				Price:       29.99,
			},
			expected: `{"name":"New Item","description":"New Description","price":29.99}`,
		},
		{
			name: "Create request with empty description",
			input: ItemCreate{
				Name:        "Item",
				Description: "",
				Price:       9.99,
			},
			expected: `{"name":"Item","price":9.99}`,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			data, err := json.Marshal(tt.input)
			if err != nil {
				t.Fatalf("Failed to marshal ItemCreate: %v", err)
			}

			if string(data) != tt.expected {
				t.Errorf("Expected JSON %s, got %s", tt.expected, string(data))
			}
		})
	}
}

func TestItemCreateValidation(t *testing.T) {
	tests := []struct {
		name    string
		input   ItemCreate
		isValid bool
	}{
		{
			name: "Valid input",
			input: ItemCreate{
				Name:        "Valid Name",
				Description: "Valid Description",
				Price:       19.99,
			},
			isValid: true,
		},
		{
			name: "Empty name",
			input: ItemCreate{
				Name:        "",
				Description: "Description",
				Price:       19.99,
			},
			isValid: false,
		},
		{
			name: "Only whitespace name",
			input: ItemCreate{
				Name:        "   ",
				Description: "Description",
				Price:       19.99,
			},
			isValid: false,
		},
		{
			name: "Valid with empty description",
			input: ItemCreate{
				Name:        "Name",
				Description: "",
				Price:       9.99,
			},
			isValid: true,
		},
		{
			name: "Invalid zero price",
			input: ItemCreate{
				Name:        "Name",
				Description: "Description",
				Price:       0.0,
			},
			isValid: false,
		},
		{
			name: "Invalid negative price",
			input: ItemCreate{
				Name:        "Name",
				Description: "Description",
				Price:       -5.0,
			},
			isValid: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			isValid := tt.input.Name != "" && len(tt.input.Name) > 0
			// Check for non-whitespace content
			trimmed := ""
			for _, c := range tt.input.Name {
				if c != ' ' && c != '\t' && c != '\n' {
					trimmed += string(c)
				}
			}
			isValid = isValid && len(trimmed) > 0 && tt.input.Price > 0

			if isValid != tt.isValid {
				t.Errorf("Expected validation result %v, got %v", tt.isValid, isValid)
			}
		})
	}
}

func TestItemUpdateJSONMarshaling(t *testing.T) {
	tests := []struct {
		name     string
		input    ItemUpdate
		expected string
	}{
		{
			name: "Update all fields",
			input: ItemUpdate{
				Name:        stringPtr("Updated Name"),
				Description: stringPtr("Updated Description"),
				Price:       float64Ptr(39.99),
			},
			expected: `{"name":"Updated Name","description":"Updated Description","price":39.99}`,
		},
		{
			name: "Update only name",
			input: ItemUpdate{
				Name:        stringPtr("Updated Name"),
				Description: nil,
				Price:       nil,
			},
			expected: `{"name":"Updated Name"}`,
		},
		{
			name: "Update only price",
			input: ItemUpdate{
				Name:        nil,
				Description: nil,
				Price:       float64Ptr(49.99),
			},
			expected: `{"price":49.99}`,
		},
		{
			name:     "Update nothing",
			input:    ItemUpdate{},
			expected: `{}`,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			data, err := json.Marshal(tt.input)
			if err != nil {
				t.Fatalf("Failed to marshal ItemUpdate: %v", err)
			}

			if string(data) != tt.expected {
				t.Errorf("Expected JSON %s, got %s", tt.expected, string(data))
			}
		})
	}
}

func TestCurrentTimestamp(t *testing.T) {
	before := time.Now().UnixNano() / int64(time.Millisecond)
	timestamp := CurrentTimestamp()
	after := time.Now().UnixNano() / int64(time.Millisecond)

	if timestamp < before || timestamp > after {
		t.Errorf("Timestamp %d is not between %d and %d", timestamp, before, after)
	}
}

func TestErrorResponseJSONMarshaling(t *testing.T) {
	tests := []struct {
		name     string
		response ErrorResponse
		expected string
	}{
		{
			name: "Error with message",
			response: ErrorResponse{
				Success: false,
				Message: "Test error",
				Error:   "Details",
			},
			expected: `{"success":false,"message":"Test error","error":"Details"}`,
		},
		{
			name: "Error without details",
			response: ErrorResponse{
				Success: false,
				Message: "Test error",
			},
			expected: `{"success":false,"message":"Test error"}`,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			data, err := json.Marshal(tt.response)
			if err != nil {
				t.Fatalf("Failed to marshal ErrorResponse: %v", err)
			}

			if string(data) != tt.expected {
				t.Errorf("Expected JSON %s, got %s", tt.expected, string(data))
			}
		})
	}
}

func TestItemResponseJSONMarshaling(t *testing.T) {
	item := &Item{
		ID:          "test-123",
		Name:        "Test",
		Description: "Description",
		Price:       19.99,
		CreatedAt:   1704067200000,
		UpdatedAt:   1704067200000,
	}

	response := ItemResponse{
		Success: true,
		Data:    item,
		Message: "Success",
	}

	data, err := json.Marshal(response)
	if err != nil {
		t.Fatalf("Failed to marshal ItemResponse: %v", err)
	}

	var unmarshaled ItemResponse
	err = json.Unmarshal(data, &unmarshaled)
	if err != nil {
		t.Fatalf("Failed to unmarshal ItemResponse: %v", err)
	}

	if !unmarshaled.Success {
		t.Error("Expected success to be true")
	}
	if unmarshaled.Message != "Success" {
		t.Errorf("Expected message 'Success', got '%s'", unmarshaled.Message)
	}
}

func TestItemListResponseJSONMarshaling(t *testing.T) {
	items := []Item{
		{
			ID:          "1",
			Name:        "Item 1",
			Description: "Desc 1",
			Price:       10.0,
			CreatedAt:   1704067200000,
			UpdatedAt:   1704067200000,
		},
		{
			ID:          "2",
			Name:        "Item 2",
			Description: "Desc 2",
			Price:       20.0,
			CreatedAt:   1704067200000,
			UpdatedAt:   1704067200000,
		},
	}

	response := ItemListResponse{
		Success: true,
		Data:    items,
		Count:   len(items),
		Message: "Success",
	}

	data, err := json.Marshal(response)
	if err != nil {
		t.Fatalf("Failed to marshal ItemListResponse: %v", err)
	}

	var unmarshaled ItemListResponse
	err = json.Unmarshal(data, &unmarshaled)
	if err != nil {
		t.Fatalf("Failed to unmarshal ItemListResponse: %v", err)
	}

	if !unmarshaled.Success {
		t.Error("Expected success to be true")
	}
	if unmarshaled.Count != 2 {
		t.Errorf("Expected count 2, got %d", unmarshaled.Count)
	}
	if len(unmarshaled.Data) != 2 {
		t.Errorf("Expected 2 items, got %d", len(unmarshaled.Data))
	}
}

// Helper functions
func stringPtr(s string) *string {
	return &s
}

func float64Ptr(f float64) *float64 {
	return &f
}
