package utils

import (
	"encoding/json"
	"os"
	"runtime"
	"testing"
	"time"
)

func TestNewMetricsCollector(t *testing.T) {
	// Reset cold start for test
	coldStart = true

	// Set environment variable
	os.Setenv("RUNTIME_NAME", "go-test")
	defer os.Unsetenv("RUNTIME_NAME")

	collector := NewMetricsCollector()

	if collector == nil {
		t.Fatal("Expected collector to be non-nil")
	}

	if collector.RuntimeName != "go-test" {
		t.Errorf("Expected runtime 'go-test', got '%s'", collector.RuntimeName)
	}

	// First collector after reset should be a cold start
	if !collector.ColdStart {
		t.Error("Expected ColdStart to be true for first collector")
	}

	if collector.StartTime.IsZero() {
		t.Error("Expected StartTime to be set")
	}
}

func TestNewMetricsCollectorDefaultRuntime(t *testing.T) {
	// Reset cold start for test
	coldStart = true

	// Ensure RUNTIME_NAME is not set
	os.Unsetenv("RUNTIME_NAME")

	collector := NewMetricsCollector()

	if collector.RuntimeName != "go" {
		t.Errorf("Expected default runtime 'go', got '%s'", collector.RuntimeName)
	}
}

func TestColdStartToggle(t *testing.T) {
	// Reset cold start
	coldStart = true

	// First collector
	collector1 := NewMetricsCollector()
	if !collector1.ColdStart {
		t.Error("Expected first collector to be cold start")
	}

	// Second collector
	collector2 := NewMetricsCollector()
	if collector2.ColdStart {
		t.Error("Expected second collector to not be cold start")
	}

	// Third collector
	collector3 := NewMetricsCollector()
	if collector3.ColdStart {
		t.Error("Expected third collector to not be cold start")
	}
}

func TestGetMetrics(t *testing.T) {
	os.Setenv("RUNTIME_NAME", "go-test")
	os.Setenv("ENVIRONMENT", "test")
	defer os.Unsetenv("RUNTIME_NAME")
	defer os.Unsetenv("ENVIRONMENT")

	collector := NewMetricsCollector()

	// Sleep a bit to ensure some uptime
	time.Sleep(10 * time.Millisecond)

	metrics := collector.GetMetrics()

	if metrics.Runtime != "go-test" {
		t.Errorf("Expected runtime 'go-test', got '%s'", metrics.Runtime)
	}

	if metrics.Environment != "test" {
		t.Errorf("Expected environment 'test', got '%s'", metrics.Environment)
	}

	if metrics.UptimeSeconds <= 0 {
		t.Error("Expected uptime to be greater than 0")
	}

	if metrics.GoVersion == "" {
		t.Error("Expected Go version to be set")
	}

	// Check memory metrics
	if metrics.Memory.AllocMB < 0 {
		t.Error("Expected AllocMB to be non-negative")
	}

	if metrics.Memory.TotalAllocMB < 0 {
		t.Error("Expected TotalAllocMB to be non-negative")
	}

	if metrics.Memory.SysMB <= 0 {
		t.Error("Expected SysMB to be greater than 0")
	}
}

func TestGetMetricsDefaultEnvironment(t *testing.T) {
	os.Unsetenv("ENVIRONMENT")

	collector := NewMetricsCollector()
	metrics := collector.GetMetrics()

	if metrics.Environment != "dev" {
		t.Errorf("Expected default environment 'dev', got '%s'", metrics.Environment)
	}
}

func TestGetMetricsWithLambdaContext(t *testing.T) {
	// Set Lambda environment variables
	os.Setenv("AWS_LAMBDA_FUNCTION_NAME", "test-function")
	os.Setenv("AWS_LAMBDA_FUNCTION_VERSION", "1")
	os.Setenv("AWS_LAMBDA_FUNCTION_MEMORY_SIZE", "512")
	os.Setenv("AWS_LAMBDA_LOG_GROUP_NAME", "/aws/lambda/test")
	os.Setenv("AWS_LAMBDA_LOG_STREAM_NAME", "2024/01/01/test")

	defer func() {
		os.Unsetenv("AWS_LAMBDA_FUNCTION_NAME")
		os.Unsetenv("AWS_LAMBDA_FUNCTION_VERSION")
		os.Unsetenv("AWS_LAMBDA_FUNCTION_MEMORY_SIZE")
		os.Unsetenv("AWS_LAMBDA_LOG_GROUP_NAME")
		os.Unsetenv("AWS_LAMBDA_LOG_STREAM_NAME")
	}()

	collector := NewMetricsCollector()
	metrics := collector.GetMetrics()

	if metrics.Lambda == nil {
		t.Fatal("Expected Lambda context to be set")
	}

	if metrics.Lambda.FunctionName != "test-function" {
		t.Errorf("Expected function name 'test-function', got '%s'", metrics.Lambda.FunctionName)
	}

	if metrics.Lambda.FunctionVersion != "1" {
		t.Errorf("Expected function version '1', got '%s'", metrics.Lambda.FunctionVersion)
	}

	if metrics.Lambda.MemoryLimitMB != "512" {
		t.Errorf("Expected memory limit '512', got '%s'", metrics.Lambda.MemoryLimitMB)
	}
}

func TestGetMetricsWithoutLambdaContext(t *testing.T) {
	// Ensure Lambda env vars are not set
	os.Unsetenv("AWS_LAMBDA_FUNCTION_NAME")

	collector := NewMetricsCollector()
	metrics := collector.GetMetrics()

	if metrics.Lambda != nil {
		t.Error("Expected Lambda context to be nil when not in Lambda")
	}
}

func TestMemoryMetrics(t *testing.T) {
	collector := NewMetricsCollector()
	metrics := collector.GetMetrics()

	// Verify memory metrics structure
	if metrics.Memory.AllocMB < 0 {
		t.Errorf("Expected AllocMB >= 0, got %f", metrics.Memory.AllocMB)
	}

	if metrics.Memory.TotalAllocMB < metrics.Memory.AllocMB {
		t.Errorf("Expected TotalAllocMB >= AllocMB")
	}

	if metrics.Memory.SysMB < metrics.Memory.AllocMB {
		t.Errorf("Expected SysMB >= AllocMB")
	}

	// NumGC can be 0 on first run
	if metrics.Memory.NumGC < 0 {
		t.Errorf("Expected NumGC >= 0, got %d", metrics.Memory.NumGC)
	}
}

func TestUptimeIncreases(t *testing.T) {
	collector := NewMetricsCollector()

	metrics1 := collector.GetMetrics()
	uptime1 := metrics1.UptimeSeconds

	// Wait a bit
	time.Sleep(100 * time.Millisecond)

	metrics2 := collector.GetMetrics()
	uptime2 := metrics2.UptimeSeconds

	if uptime2 <= uptime1 {
		t.Errorf("Expected uptime to increase: %f -> %f", uptime1, uptime2)
	}

	diff := uptime2 - uptime1
	if diff < 0.05 {
		t.Logf("Warning: Uptime diff seems small: %f seconds", diff)
	}
}

func TestGoVersion(t *testing.T) {
	collector := NewMetricsCollector()
	metrics := collector.GetMetrics()

	expectedVersion := runtime.Version()
	if metrics.GoVersion != expectedVersion {
		t.Errorf("Expected Go version '%s', got '%s'", expectedVersion, metrics.GoVersion)
	}
}

func TestMetricsJSONSerialization(t *testing.T) {
	collector := NewMetricsCollector()
	metrics := collector.GetMetrics()

	// Marshal to JSON
	data, err := json.Marshal(metrics)
	if err != nil {
		t.Fatalf("Failed to marshal metrics: %v", err)
	}

	// Unmarshal back
	var unmarshaled Metrics
	err = json.Unmarshal(data, &unmarshaled)
	if err != nil {
		t.Fatalf("Failed to unmarshal metrics: %v", err)
	}

	// Verify key fields
	if unmarshaled.Runtime != metrics.Runtime {
		t.Errorf("Runtime mismatch after JSON round-trip")
	}

	if unmarshaled.ColdStart != metrics.ColdStart {
		t.Errorf("ColdStart mismatch after JSON round-trip")
	}

	if unmarshaled.GoVersion != metrics.GoVersion {
		t.Errorf("GoVersion mismatch after JSON round-trip")
	}
}

func TestGetEnv(t *testing.T) {
	tests := []struct {
		name         string
		key          string
		defaultValue string
		setValue     string
		expected     string
	}{
		{
			name:         "Returns environment value",
			key:          "TEST_KEY",
			defaultValue: "default",
			setValue:     "custom",
			expected:     "custom",
		},
		{
			name:         "Returns default when not set",
			key:          "UNSET_KEY",
			defaultValue: "default",
			setValue:     "",
			expected:     "default",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if tt.setValue != "" {
				os.Setenv(tt.key, tt.setValue)
				defer os.Unsetenv(tt.key)
			} else {
				os.Unsetenv(tt.key)
			}

			result := getEnv(tt.key, tt.defaultValue)
			if result != tt.expected {
				t.Errorf("Expected '%s', got '%s'", tt.expected, result)
			}
		})
	}
}

func TestMemoryMetricsStructure(t *testing.T) {
	var m runtime.MemStats
	runtime.ReadMemStats(&m)

	memMetrics := MemoryMetrics{
		AllocMB:      float64(m.Alloc) / 1024 / 1024,
		TotalAllocMB: float64(m.TotalAlloc) / 1024 / 1024,
		SysMB:        float64(m.Sys) / 1024 / 1024,
		NumGC:        m.NumGC,
	}

	// Verify the structure can be marshaled
	data, err := json.Marshal(memMetrics)
	if err != nil {
		t.Fatalf("Failed to marshal MemoryMetrics: %v", err)
	}

	var unmarshaled MemoryMetrics
	err = json.Unmarshal(data, &unmarshaled)
	if err != nil {
		t.Fatalf("Failed to unmarshal MemoryMetrics: %v", err)
	}

	if unmarshaled.AllocMB != memMetrics.AllocMB {
		t.Error("AllocMB mismatch after JSON round-trip")
	}
}

func TestLambdaContextStructure(t *testing.T) {
	ctx := &LambdaContext{
		FunctionName:    "test-func",
		FunctionVersion: "1",
		MemoryLimitMB:   "512",
		LogGroup:        "/aws/lambda/test",
		LogStream:       "2024/01/01/test",
	}

	// Verify the structure can be marshaled
	data, err := json.Marshal(ctx)
	if err != nil {
		t.Fatalf("Failed to marshal LambdaContext: %v", err)
	}

	var unmarshaled LambdaContext
	err = json.Unmarshal(data, &unmarshaled)
	if err != nil {
		t.Fatalf("Failed to unmarshal LambdaContext: %v", err)
	}

	if unmarshaled.FunctionName != ctx.FunctionName {
		t.Error("FunctionName mismatch after JSON round-trip")
	}
}
