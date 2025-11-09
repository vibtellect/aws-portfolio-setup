/**
 * LocalStack Configuration Helper
 *
 * Provides AWS SDK client configuration for LocalStack integration testing.
 */

export const LOCALSTACK_ENDPOINT = process.env.LOCALSTACK_ENDPOINT || 'http://localhost:4566';
export const AWS_REGION = process.env.AWS_DEFAULT_REGION || 'eu-central-1';
export const AWS_ACCOUNT_ID = process.env.CDK_DEFAULT_ACCOUNT || '000000000000';

/**
 * Common AWS SDK client configuration for LocalStack
 */
export const localstackConfig = {
  endpoint: LOCALSTACK_ENDPOINT,
  region: AWS_REGION,
  credentials: {
    accessKeyId: 'test',
    secretAccessKey: 'test',
  },
  forcePathStyle: true, // Required for S3
  tls: false,
};

/**
 * CDK environment configuration for LocalStack
 */
export const localstackEnv = {
  account: AWS_ACCOUNT_ID,
  region: AWS_REGION,
};

/**
 * Wait for LocalStack to be ready
 */
export async function waitForLocalStack(
  maxAttempts: number = 30,
  delayMs: number = 1000
): Promise<void> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetch(`${LOCALSTACK_ENDPOINT}/_localstack/health`);
      if (response.ok) {
        const health = await response.json();
        console.log('LocalStack is ready:', health);
        return;
      }
    } catch (error) {
      if (attempt === maxAttempts) {
        throw new Error(
          `LocalStack is not ready after ${maxAttempts} attempts. Make sure LocalStack is running with 'npm run localstack:start'`
        );
      }
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

/**
 * Check if a specific service is available in LocalStack
 */
export async function isServiceAvailable(serviceName: string): Promise<boolean> {
  try {
    const response = await fetch(`${LOCALSTACK_ENDPOINT}/_localstack/health`);
    if (!response.ok) {
      return false;
    }
    const health = await response.json();
    return health.services?.[serviceName] === 'available' ||
           health.services?.[serviceName] === 'running';
  } catch {
    return false;
  }
}

/**
 * Generate a unique test resource name
 */
export function generateTestResourceName(prefix: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}-${timestamp}-${random}`;
}
