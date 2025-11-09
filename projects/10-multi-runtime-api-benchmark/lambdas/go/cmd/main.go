package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"strconv"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	ginadapter "github.com/awslabs/aws-lambda-go-api-proxy/gin"
	"github.com/gin-gonic/gin"
	"github.com/vibtellect/benchmark-go-lambda/internal/models"
	"github.com/vibtellect/benchmark-go-lambda/internal/utils"
)

var (
	ginLambda      *ginadapter.GinLambda
	dbClient       *utils.DynamoDBClient
	metricsCollector *utils.MetricsCollector
)

func init() {
	// Initialize DynamoDB client
	dbClient = utils.NewDynamoDBClient()

	// Initialize metrics collector
	metricsCollector = utils.NewMetricsCollector()

	// Set Gin mode
	ginMode := os.Getenv("GIN_MODE")
	if ginMode == "" {
		ginMode = gin.ReleaseMode
	}
	gin.SetMode(ginMode)

	// Initialize Gin
	r := gin.Default()

	// Configure CORS
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

	// Health check endpoints
	r.GET("/health", healthHandler)
	r.GET("/go/health", healthHandler)

	// Metrics endpoints
	r.GET("/metrics", metricsHandler)
	r.GET("/go/metrics", metricsHandler)

	// Items endpoints
	items := r.Group("")
	{
		items.POST("/items", createItemHandler)
		items.GET("/items", listItemsHandler)
		items.GET("/items/:id", getItemHandler)
		items.PUT("/items/:id", updateItemHandler)
		items.DELETE("/items/:id", deleteItemHandler)
	}

	// Go-prefixed routes
	goItems := r.Group("/go")
	{
		goItems.POST("/items", createItemHandler)
		goItems.GET("/items", listItemsHandler)
		goItems.GET("/items/:id", getItemHandler)
		goItems.PUT("/items/:id", updateItemHandler)
		goItems.DELETE("/items/:id", deleteItemHandler)
	}

	ginLambda = ginadapter.New(r)
}

func healthHandler(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":    "healthy",
		"runtime":   "go",
		"version":   "1.21",
		"framework": "Gin",
	})
}

func metricsHandler(c *gin.Context) {
	metrics := metricsCollector.GetMetrics()
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    metrics,
	})
}

func createItemHandler(c *gin.Context) {
	var itemData models.ItemCreate
	if err := c.ShouldBindJSON(&itemData); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Success: false,
			Message: "Invalid request data",
			Error:   err.Error(),
		})
		return
	}

	item, err := dbClient.CreateItem(itemData)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Success: false,
			Message: "Error creating item",
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, models.ItemResponse{
		Success: true,
		Data:    item,
		Message: "Item created successfully",
	})
}

func getItemHandler(c *gin.Context) {
	itemID := c.Param("id")

	item, err := dbClient.GetItem(itemID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Success: false,
			Message: "Error getting item",
			Error:   err.Error(),
		})
		return
	}

	if item == nil {
		c.JSON(http.StatusNotFound, models.ErrorResponse{
			Success: false,
			Message: "Item not found: " + itemID,
		})
		return
	}

	c.JSON(http.StatusOK, models.ItemResponse{
		Success: true,
		Data:    item,
		Message: "Item retrieved successfully",
	})
}

func updateItemHandler(c *gin.Context) {
	itemID := c.Param("id")

	var itemData models.ItemUpdate
	if err := c.ShouldBindJSON(&itemData); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Success: false,
			Message: "Invalid request data",
			Error:   err.Error(),
		})
		return
	}

	item, err := dbClient.UpdateItem(itemID, itemData)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Success: false,
			Message: "Error updating item",
			Error:   err.Error(),
		})
		return
	}

	if item == nil {
		c.JSON(http.StatusNotFound, models.ErrorResponse{
			Success: false,
			Message: "Item not found: " + itemID,
		})
		return
	}

	c.JSON(http.StatusOK, models.ItemResponse{
		Success: true,
		Data:    item,
		Message: "Item updated successfully",
	})
}

func deleteItemHandler(c *gin.Context) {
	itemID := c.Param("id")

	deleted, err := dbClient.DeleteItem(itemID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Success: false,
			Message: "Error deleting item",
			Error:   err.Error(),
		})
		return
	}

	if !deleted {
		c.JSON(http.StatusNotFound, models.ErrorResponse{
			Success: false,
			Message: "Item not found: " + itemID,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Item " + itemID + " deleted successfully",
	})
}

func listItemsHandler(c *gin.Context) {
	limitStr := c.DefaultQuery("limit", "100")
	limit, err := strconv.ParseInt(limitStr, 10, 64)
	if err != nil {
		limit = 100
	}

	items, err := dbClient.ListItems(limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Success: false,
			Message: "Error listing items",
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.ItemListResponse{
		Success: true,
		Data:    items,
		Count:   len(items),
		Message: "Items retrieved successfully",
	})
}

// Handler is the Lambda function handler
func Handler(ctx context.Context, req events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	return ginLambda.ProxyWithContext(ctx, req)
}

func main() {
	// Check if running in Lambda
	if os.Getenv("AWS_LAMBDA_FUNCTION_NAME") != "" {
		lambda.Start(Handler)
	} else {
		// For local testing
		log.Println("Starting local server on :8080")
		r := gin.Default()
		r.GET("/health", healthHandler)
		r.Run(":8080")
	}
}
