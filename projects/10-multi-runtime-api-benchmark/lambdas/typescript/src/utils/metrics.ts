/**
 * Metrics collector for TypeScript Lambda
 */

interface LambdaMetrics {
  runtime: string;
  cold_start: boolean;
  uptime_seconds: number;
  memory: {
    heap_used_mb: number;
    heap_total_mb: number;
    external_mb: number;
    rss_mb: number;
  };
  node_version: string;
  environment: string;
  lambda?: {
    function_name?: string;
    function_version?: string;
    memory_limit_mb?: string;
    log_group?: string;
    log_stream?: string;
  };
}

export class MetricsCollector {
  private runtimeName: string;
  private startTime: number;
  private coldStart: boolean;

  // Use a module-level variable to track warm starts
  private static warmStarted = false;

  constructor() {
    this.runtimeName = process.env.RUNTIME_NAME || 'typescript';
    this.startTime = Date.now();
    this.coldStart = !MetricsCollector.warmStarted;
    MetricsCollector.warmStarted = true;
  }

  getMetrics(): LambdaMetrics {
    const memoryUsage = process.memoryUsage();

    const metrics: LambdaMetrics = {
      runtime: this.runtimeName,
      cold_start: this.coldStart,
      uptime_seconds: (Date.now() - this.startTime) / 1000,
      memory: {
        heap_used_mb: memoryUsage.heapUsed / 1024 / 1024,
        heap_total_mb: memoryUsage.heapTotal / 1024 / 1024,
        external_mb: memoryUsage.external / 1024 / 1024,
        rss_mb: memoryUsage.rss / 1024 / 1024,
      },
      node_version: process.version,
      environment: process.env.ENVIRONMENT || 'dev',
    };

    // Add Lambda-specific context if available
    if (process.env.AWS_LAMBDA_FUNCTION_NAME) {
      metrics.lambda = {
        function_name: process.env.AWS_LAMBDA_FUNCTION_NAME,
        function_version: process.env.AWS_LAMBDA_FUNCTION_VERSION,
        memory_limit_mb: process.env.AWS_LAMBDA_FUNCTION_MEMORY_SIZE,
        log_group: process.env.AWS_LAMBDA_LOG_GROUP_NAME,
        log_stream: process.env.AWS_LAMBDA_LOG_STREAM_NAME,
      };
    }

    console.log('Collected metrics:', JSON.stringify(metrics));
    return metrics;
  }
}
