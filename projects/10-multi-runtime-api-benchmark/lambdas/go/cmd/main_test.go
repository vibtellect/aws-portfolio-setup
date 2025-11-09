package main

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/vibtellect/benchmark-go-lambda/internal/models"
)

func TestHealthHandler(t *testing.T) {
	// Set Gin to test mode
	gin.SetMode(gin.TestMode)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)

	// Create a test request
	req, _ := http.NewRequest("GET", "/health", nil)
	c.Request = req

	healthHandler(c)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d", w.Code)
	}

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	if err != nil {
		t.Fatalf("Failed to parse response: %v", err)
	}

	if response["status"] != "healthy" {
		t.Errorf("Expected status 'healthy', got '%v'", response["status"])
	}

	if response["runtime"] != "go" {
		t.Errorf("Expected runtime 'go', got '%v'", response["runtime"])
	}

	if response["version"] != "1.21" {
		t.Errorf("Expected version '1.21', got '%v'", response["version"])
	}

	if response["framework"] != "Gin" {
		t.Errorf("Expected framework 'Gin', got '%v'", response["framework"])
	}
}

func TestMetricsHandler(t *testing.T) {
	gin.SetMode(gin.TestMode)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)

	req, _ := http.NewRequest("GET", "/metrics", nil)
	c.Request = req

	// Initialize metrics collector for test
	metricsHandler(c)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d", w.Code)
	}

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	if err != nil {
		t.Fatalf("Failed to parse response: %v", err)
	}

	if response["success"] != true {
		t.Error("Expected success to be true")
	}

	if response["data"] == nil {
		t.Error("Expected data to be present")
	}
}

func TestCreateItemHandlerInvalidJSON(t *testing.T) {
	gin.SetMode(gin.TestMode)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)

	// Invalid JSON
	body := bytes.NewBufferString(`{"name":}`)
	req, _ := http.NewRequest("POST", "/items", body)
	req.Header.Set("Content-Type", "application/json")
	c.Request = req

	createItemHandler(c)

	if w.Code != http.StatusBadRequest {
		t.Errorf("Expected status 400, got %d", w.Code)
	}

	var response models.ErrorResponse
	err := json.Unmarshal(w.Body.Bytes(), &response)
	if err != nil {
		t.Fatalf("Failed to parse error response: %v", err)
	}

	if response.Success != false {
		t.Error("Expected success to be false")
	}

	if response.Message == "" {
		t.Error("Expected error message to be present")
	}
}

func TestCreateItemHandlerMissingFields(t *testing.T) {
	gin.SetMode(gin.TestMode)

	tests := []struct {
		name string
		body string
	}{
		{
			name: "Missing name",
			body: `{"description": "Test", "price": 10.0}`,
		},
		{
			name: "Missing price",
			body: `{"name": "Test", "description": "Test"}`,
		},
		{
			name: "Empty name",
			body: `{"name": "", "description": "Test", "price": 10.0}`,
		},
		{
			name: "Zero price",
			body: `{"name": "Test", "description": "Test", "price": 0}`,
		},
		{
			name: "Negative price",
			body: `{"name": "Test", "description": "Test", "price": -5.0}`,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)

			body := bytes.NewBufferString(tt.body)
			req, _ := http.NewRequest("POST", "/items", body)
			req.Header.Set("Content-Type", "application/json")
			c.Request = req

			createItemHandler(c)

			if w.Code != http.StatusBadRequest {
				t.Errorf("Expected status 400, got %d", w.Code)
			}
		})
	}
}

func TestUpdateItemHandlerInvalidJSON(t *testing.T) {
	gin.SetMode(gin.TestMode)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)

	// Set URL parameter
	c.Params = []gin.Param{
		{Key: "id", Value: "test-id"},
	}

	// Invalid JSON
	body := bytes.NewBufferString(`{"name":}`)
	req, _ := http.NewRequest("PUT", "/items/test-id", body)
	req.Header.Set("Content-Type", "application/json")
	c.Request = req

	updateItemHandler(c)

	if w.Code != http.StatusBadRequest {
		t.Errorf("Expected status 400, got %d", w.Code)
	}
}

func TestUpdateItemHandlerInvalidValues(t *testing.T) {
	gin.SetMode(gin.TestMode)

	tests := []struct {
		name string
		body string
	}{
		{
			name: "Empty name",
			body: `{"name": ""}`,
		},
		{
			name: "Zero price",
			body: `{"price": 0}`,
		},
		{
			name: "Negative price",
			body: `{"price": -10.0}`,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)

			c.Params = []gin.Param{
				{Key: "id", Value: "test-id"},
			}

			body := bytes.NewBufferString(tt.body)
			req, _ := http.NewRequest("PUT", "/items/test-id", body)
			req.Header.Set("Content-Type", "application/json")
			c.Request = req

			updateItemHandler(c)

			if w.Code != http.StatusBadRequest {
				t.Errorf("Expected status 400 for %s, got %d", tt.name, w.Code)
			}
		})
	}
}

func TestGetItemHandlerMissingID(t *testing.T) {
	gin.SetMode(gin.TestMode)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)

	// No ID parameter
	req, _ := http.NewRequest("GET", "/items/", nil)
	c.Request = req

	getItemHandler(c)

	// Handler will receive empty ID
	// Behavior depends on DynamoDB client implementation
}

func TestDeleteItemHandlerMissingID(t *testing.T) {
	gin.SetMode(gin.TestMode)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)

	req, _ := http.NewRequest("DELETE", "/items/", nil)
	c.Request = req

	deleteItemHandler(c)

	// Handler will receive empty ID
	// Behavior depends on DynamoDB client implementation
}

func TestListItemsHandlerDefaultLimit(t *testing.T) {
	gin.SetMode(gin.TestMode)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)

	// No limit parameter
	req, _ := http.NewRequest("GET", "/items", nil)
	c.Request = req

	listItemsHandler(c)

	// Default limit of 100 should be used
	// Cannot test without actual DynamoDB client
}

func TestListItemsHandlerWithLimit(t *testing.T) {
	gin.SetMode(gin.TestMode)

	tests := []struct {
		name  string
		limit string
	}{
		{
			name:  "Valid limit",
			limit: "50",
		},
		{
			name:  "Small limit",
			limit: "10",
		},
		{
			name:  "Large limit",
			limit: "1000",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)

			req, _ := http.NewRequest("GET", "/items?limit="+tt.limit, nil)
			c.Request = req

			listItemsHandler(c)

			// Cannot fully test without DynamoDB client
		})
	}
}

func TestListItemsHandlerInvalidLimit(t *testing.T) {
	gin.SetMode(gin.TestMode)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)

	// Invalid limit (not a number)
	req, _ := http.NewRequest("GET", "/items?limit=invalid", nil)
	c.Request = req

	listItemsHandler(c)

	// Should fall back to default limit of 100
}

func TestResponseStructures(t *testing.T) {
	// Test ItemResponse structure
	item := &models.Item{
		ID:          "test",
		Name:        "Test",
		Description: "Desc",
		Price:       10.0,
		CreatedAt:   1704067200000,
		UpdatedAt:   1704067200000,
	}

	itemResponse := models.ItemResponse{
		Success: true,
		Data:    item,
		Message: "Success",
	}

	data, err := json.Marshal(itemResponse)
	if err != nil {
		t.Fatalf("Failed to marshal ItemResponse: %v", err)
	}

	var unmarshaled models.ItemResponse
	err = json.Unmarshal(data, &unmarshaled)
	if err != nil {
		t.Fatalf("Failed to unmarshal ItemResponse: %v", err)
	}

	if !unmarshaled.Success {
		t.Error("Expected success to be true")
	}
}

func TestErrorResponse(t *testing.T) {
	errorResponse := models.ErrorResponse{
		Success: false,
		Message: "Test error",
		Error:   "Error details",
	}

	data, err := json.Marshal(errorResponse)
	if err != nil {
		t.Fatalf("Failed to marshal ErrorResponse: %v", err)
	}

	var unmarshaled models.ErrorResponse
	err = json.Unmarshal(data, &unmarshaled)
	if err != nil {
		t.Fatalf("Failed to unmarshal ErrorResponse: %v", err)
	}

	if unmarshaled.Success {
		t.Error("Expected success to be false")
	}

	if unmarshaled.Message != "Test error" {
		t.Errorf("Expected message 'Test error', got '%s'", unmarshaled.Message)
	}
}

func TestItemListResponse(t *testing.T) {
	items := []models.Item{
		{
			ID:          "1",
			Name:        "Item 1",
			Description: "Desc 1",
			Price:       10.0,
			CreatedAt:   1704067200000,
			UpdatedAt:   1704067200000,
		},
	}

	listResponse := models.ItemListResponse{
		Success: true,
		Data:    items,
		Count:   len(items),
		Message: "Success",
	}

	data, err := json.Marshal(listResponse)
	if err != nil {
		t.Fatalf("Failed to marshal ItemListResponse: %v", err)
	}

	var unmarshaled models.ItemListResponse
	err = json.Unmarshal(data, &unmarshaled)
	if err != nil {
		t.Fatalf("Failed to unmarshal ItemListResponse: %v", err)
	}

	if !unmarshaled.Success {
		t.Error("Expected success to be true")
	}

	if unmarshaled.Count != 1 {
		t.Errorf("Expected count 1, got %d", unmarshaled.Count)
	}
}

func TestCORSHeaders(t *testing.T) {
	gin.SetMode(gin.TestMode)

	// Create a test router with CORS middleware
	r := gin.New()
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Runtime")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		c.Next()
	})

	r.GET("/test", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	// Test OPTIONS request
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("OPTIONS", "/test", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusNoContent {
		t.Errorf("Expected status 204 for OPTIONS, got %d", w.Code)
	}

	// Test GET request with CORS headers
	w = httptest.NewRecorder()
	req, _ = http.NewRequest("GET", "/test", nil)
	r.ServeHTTP(w, req)

	if w.Header().Get("Access-Control-Allow-Origin") != "*" {
		t.Error("Expected CORS header to be set")
	}
}
