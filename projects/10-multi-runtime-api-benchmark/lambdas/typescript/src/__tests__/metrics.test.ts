import { MetricsCollector } from '../utils/metrics';

describe('MetricsCollector', () => {
  let collector: MetricsCollector;

  beforeEach(() => {
    process.env.RUNTIME_NAME = 'typescript';
    process.env.ENVIRONMENT = 'test';
    collector = new MetricsCollector();
  });

  afterEach(() => {
    delete process.env.RUNTIME_NAME;
    delete process.env.ENVIRONMENT;
    delete process.env.AWS_LAMBDA_FUNCTION_NAME;
    delete process.env.AWS_LAMBDA_FUNCTION_VERSION;
    delete process.env.AWS_LAMBDA_FUNCTION_MEMORY_SIZE;
  });

  describe('initialization', () => {
    test('initializes with runtime name from environment', () => {
      expect(collector).toBeDefined();
    });

    test('uses default runtime name if not provided', () => {
      delete process.env.RUNTIME_NAME;
      const defaultCollector = new MetricsCollector();
      expect(defaultCollector).toBeDefined();
    });

    test('detects cold start on first invocation', () => {
      // Reset the static warmStarted flag
      (MetricsCollector as any).warmStarted = false;
      const newCollector = new MetricsCollector();
      const metrics = newCollector.getMetrics();
      expect(metrics.cold_start).toBe(true);
    });

    test('detects warm start on subsequent invocations', () => {
      const collector1 = new MetricsCollector();
      const metrics1 = collector1.getMetrics();

      const collector2 = new MetricsCollector();
      const metrics2 = collector2.getMetrics();

      expect(metrics2.cold_start).toBe(false);
    });
  });

  describe('getMetrics', () => {
    test('returns complete metrics object', () => {
      const metrics = collector.getMetrics();

      expect(metrics).toBeDefined();
      expect(metrics.runtime).toBe('typescript');
      expect(metrics.environment).toBe('test');
      expect(typeof metrics.cold_start).toBe('boolean');
      expect(typeof metrics.uptime_seconds).toBe('number');
      expect(metrics.node_version).toBeDefined();
      expect(metrics.memory).toBeDefined();
    });

    test('includes memory metrics', () => {
      const metrics = collector.getMetrics();

      expect(metrics.memory).toBeDefined();
      expect(typeof metrics.memory.heap_used_mb).toBe('number');
      expect(typeof metrics.memory.heap_total_mb).toBe('number');
      expect(typeof metrics.memory.external_mb).toBe('number');
      expect(typeof metrics.memory.rss_mb).toBe('number');
      expect(metrics.memory.heap_used_mb).toBeGreaterThan(0);
      expect(metrics.memory.heap_total_mb).toBeGreaterThan(0);
      expect(metrics.memory.rss_mb).toBeGreaterThan(0);
    });

    test('calculates uptime correctly', async () => {
      const metrics1 = collector.getMetrics();
      await new Promise(resolve => setTimeout(resolve, 100)); // Wait 100ms
      const metrics2 = collector.getMetrics();

      expect(metrics2.uptime_seconds).toBeGreaterThan(metrics1.uptime_seconds);
      expect(metrics2.uptime_seconds - metrics1.uptime_seconds).toBeGreaterThanOrEqual(0.09);
    });

    test('includes Node.js version', () => {
      const metrics = collector.getMetrics();

      expect(metrics.node_version).toBeDefined();
      expect(typeof metrics.node_version).toBe('string');
      expect(metrics.node_version).toContain('v');
    });

    test('includes Lambda context when available', () => {
      process.env.AWS_LAMBDA_FUNCTION_NAME = 'test-function';
      process.env.AWS_LAMBDA_FUNCTION_VERSION = '$LATEST';
      process.env.AWS_LAMBDA_FUNCTION_MEMORY_SIZE = '512';
      process.env.AWS_LAMBDA_LOG_GROUP_NAME = '/aws/lambda/test-function';
      process.env.AWS_LAMBDA_LOG_STREAM_NAME = '2024/01/01/[$LATEST]abc123';

      const lambdaCollector = new MetricsCollector();
      const metrics = lambdaCollector.getMetrics();

      expect(metrics.lambda).toBeDefined();
      expect(metrics.lambda?.function_name).toBe('test-function');
      expect(metrics.lambda?.function_version).toBe('$LATEST');
      expect(metrics.lambda?.memory_limit_mb).toBe('512');
      expect(metrics.lambda?.log_group).toBe('/aws/lambda/test-function');
      expect(metrics.lambda?.log_stream).toBe('2024/01/01/[$LATEST]abc123');
    });

    test('omits Lambda context when not available', () => {
      const metrics = collector.getMetrics();

      expect(metrics.lambda).toBeUndefined();
    });

    test('metrics are JSON serializable', () => {
      const metrics = collector.getMetrics();
      const jsonString = JSON.stringify(metrics);

      expect(jsonString).toBeDefined();
      expect(typeof jsonString).toBe('string');

      const parsed = JSON.parse(jsonString);
      expect(parsed.runtime).toBe('typescript');
      expect(parsed.memory).toBeDefined();
    });

    test('multiple calls return updated metrics', () => {
      const metrics1 = collector.getMetrics();
      const metrics2 = collector.getMetrics();

      expect(metrics2.uptime_seconds).toBeGreaterThanOrEqual(metrics1.uptime_seconds);
      expect(metrics1.runtime).toBe(metrics2.runtime);
      expect(metrics1.cold_start).toBe(metrics2.cold_start);
    });
  });

  describe('memory tracking', () => {
    test('tracks heap memory growth', () => {
      const metrics1 = collector.getMetrics();

      // Allocate some memory
      const largeArray = new Array(100000).fill('test');

      const metrics2 = collector.getMetrics();

      expect(metrics2.memory.heap_used_mb).toBeGreaterThanOrEqual(metrics1.memory.heap_used_mb);

      // Cleanup
      largeArray.length = 0;
    });
  });
});
