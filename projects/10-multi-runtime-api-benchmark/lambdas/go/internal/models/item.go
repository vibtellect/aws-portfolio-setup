package models

import (
	"time"
)

// Item represents a complete item with all metadata
type Item struct {
	ID          string  `json:"id" dynamodbav:"id"`
	Name        string  `json:"name" dynamodbav:"name"`
	Description string  `json:"description,omitempty" dynamodbav:"description,omitempty"`
	Price       float64 `json:"price" dynamodbav:"price"`
	CreatedAt   int64   `json:"created_at" dynamodbav:"created_at"`
	UpdatedAt   int64   `json:"updated_at" dynamodbav:"updated_at"`
}

// ItemCreate represents data for creating a new item
type ItemCreate struct {
	Name        string  `json:"name" binding:"required,min=1,max=100"`
	Description string  `json:"description,omitempty" binding:"max=500"`
	Price       float64 `json:"price" binding:"required,gt=0"`
}

// ItemUpdate represents data for updating an existing item
type ItemUpdate struct {
	Name        *string  `json:"name,omitempty" binding:"omitempty,min=1,max=100"`
	Description *string  `json:"description,omitempty" binding:"omitempty,max=500"`
	Price       *float64 `json:"price,omitempty" binding:"omitempty,gt=0"`
}

// ItemResponse represents a standard API response for item operations
type ItemResponse struct {
	Success bool   `json:"success"`
	Data    *Item  `json:"data,omitempty"`
	Message string `json:"message,omitempty"`
}

// ItemListResponse represents a response for listing items
type ItemListResponse struct {
	Success bool   `json:"success"`
	Data    []Item `json:"data"`
	Count   int    `json:"count"`
	Message string `json:"message,omitempty"`
}

// ErrorResponse represents an error response
type ErrorResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
	Error   string `json:"error,omitempty"`
}

// CurrentTimestamp returns the current Unix timestamp in milliseconds
func CurrentTimestamp() int64 {
	return time.Now().UnixNano() / int64(time.Millisecond)
}
