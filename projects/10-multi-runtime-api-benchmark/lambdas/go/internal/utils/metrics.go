package utils

import (
	"log"
	"os"
	"runtime"
	"time"
)

var (
	coldStart  = true
	startTime  = time.Now()
)

// MetricsCollector collects runtime metrics
type MetricsCollector struct {
	RuntimeName string
	StartTime   time.Time
	ColdStart   bool
}

// NewMetricsCollector creates a new metrics collector
func NewMetricsCollector() *MetricsCollector {
	runtimeName := os.Getenv("RUNTIME_NAME")
	if runtimeName == "" {
		runtimeName = "go"
	}

	isColdStart := coldStart
	coldStart = false // Subsequent invocations are warm starts

	return &MetricsCollector{
		RuntimeName: runtimeName,
		StartTime:   startTime,
		ColdStart:   isColdStart,
	}
}

// Metrics represents runtime metrics
type Metrics struct {
	Runtime        string         `json:"runtime"`
	ColdStart      bool           `json:"cold_start"`
	UptimeSeconds  float64        `json:"uptime_seconds"`
	Memory         MemoryMetrics  `json:"memory"`
	GoVersion      string         `json:"go_version"`
	Environment    string         `json:"environment"`
	Lambda         *LambdaContext `json:"lambda,omitempty"`
}

// MemoryMetrics represents memory usage metrics
type MemoryMetrics struct {
	AllocMB      float64 `json:"alloc_mb"`
	TotalAllocMB float64 `json:"total_alloc_mb"`
	SysMB        float64 `json:"sys_mb"`
	NumGC        uint32  `json:"num_gc"`
}

// LambdaContext represents Lambda-specific context
type LambdaContext struct {
	FunctionName    string `json:"function_name,omitempty"`
	FunctionVersion string `json:"function_version,omitempty"`
	MemoryLimitMB   string `json:"memory_limit_mb,omitempty"`
	LogGroup        string `json:"log_group,omitempty"`
	LogStream       string `json:"log_stream,omitempty"`
}

// GetMetrics returns current runtime metrics
func (mc *MetricsCollector) GetMetrics() Metrics {
	var m runtime.MemStats
	runtime.ReadMemStats(&m)

	metrics := Metrics{
		Runtime:       mc.RuntimeName,
		ColdStart:     mc.ColdStart,
		UptimeSeconds: time.Since(mc.StartTime).Seconds(),
		Memory: MemoryMetrics{
			AllocMB:      float64(m.Alloc) / 1024 / 1024,
			TotalAllocMB: float64(m.TotalAlloc) / 1024 / 1024,
			SysMB:        float64(m.Sys) / 1024 / 1024,
			NumGC:        m.NumGC,
		},
		GoVersion:   runtime.Version(),
		Environment: getEnv("ENVIRONMENT", "dev"),
	}

	// Add Lambda context if available
	if os.Getenv("AWS_LAMBDA_FUNCTION_NAME") != "" {
		metrics.Lambda = &LambdaContext{
			FunctionName:    os.Getenv("AWS_LAMBDA_FUNCTION_NAME"),
			FunctionVersion: os.Getenv("AWS_LAMBDA_FUNCTION_VERSION"),
			MemoryLimitMB:   os.Getenv("AWS_LAMBDA_FUNCTION_MEMORY_SIZE"),
			LogGroup:        os.Getenv("AWS_LAMBDA_LOG_GROUP_NAME"),
			LogStream:       os.Getenv("AWS_LAMBDA_LOG_STREAM_NAME"),
		}
	}

	log.Printf("Collected metrics: runtime=%s, cold_start=%v, uptime=%.2fs",
		metrics.Runtime, metrics.ColdStart, metrics.UptimeSeconds)

	return metrics
}

func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}
