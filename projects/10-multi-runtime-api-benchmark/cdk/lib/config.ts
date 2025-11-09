import { Duration } from 'aws-cdk-lib';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';

export interface RuntimeConfig {
  name: string;
  displayName: string;
  runtime: Runtime;
  handler: string;
  codePath: string;
  memorySize: number;
  timeout: Duration;
  environment?: { [key: string]: string };
  bundling?: {
    command?: string[];
    image?: string;
  };
}

export interface BenchmarkConfig {
  projectName: string;
  environment: 'dev' | 'staging' | 'prod';
  tableName: string;
  logRetention: RetentionDays;
  enableXRay: boolean;
  enableDetailedMetrics: boolean;
  runtimes: {
    python: RuntimeConfig;
    typescript: RuntimeConfig;
    go: RuntimeConfig;
    kotlin: RuntimeConfig;
  };
}

export function getConfig(environment: 'dev' | 'staging' | 'prod' = 'dev'): BenchmarkConfig {
  const isProd = environment === 'prod';

  return {
    projectName: 'multi-runtime-benchmark',
    environment,
    tableName: `${environment}-benchmark-items`,
    logRetention: isProd ? RetentionDays.TWO_WEEKS : RetentionDays.ONE_WEEK,
    enableXRay: true,
    enableDetailedMetrics: true,

    runtimes: {
      python: {
        name: 'python',
        displayName: 'Python 3.11 (FastAPI + Mangum)',
        runtime: Runtime.PYTHON_3_11,
        handler: 'app.handler',
        codePath: '../lambdas/python',
        memorySize: 512,
        timeout: Duration.seconds(30),
        environment: {
          POWERTOOLS_SERVICE_NAME: 'benchmark-python',
          LOG_LEVEL: isProd ? 'INFO' : 'DEBUG',
        },
      },

      typescript: {
        name: 'typescript',
        displayName: 'Node.js 20 (Express + serverless-http)',
        runtime: Runtime.NODEJS_20_X,
        handler: 'index.handler',
        codePath: '../lambdas/typescript',
        memorySize: 512,
        timeout: Duration.seconds(30),
        environment: {
          NODE_ENV: environment,
          LOG_LEVEL: isProd ? 'info' : 'debug',
        },
      },

      go: {
        name: 'go',
        displayName: 'Go 1.x (Gin Framework)',
        runtime: Runtime.PROVIDED_AL2,
        handler: 'bootstrap',
        codePath: '../lambdas/go',
        memorySize: 512,
        timeout: Duration.seconds(30),
        environment: {
          GIN_MODE: isProd ? 'release' : 'debug',
        },
      },

      kotlin: {
        name: 'kotlin',
        displayName: 'Kotlin (Ktor + GraalVM Native)',
        runtime: Runtime.PROVIDED_AL2,
        handler: 'not.used.in.provided.runtime',
        codePath: '../lambdas/kotlin',
        memorySize: 512,
        timeout: Duration.seconds(30),
        environment: {
          KTOR_ENV: environment,
        },
      },
    },
  };
}

export const COMMON_TAGS = {
  Project: 'MultiRuntimeBenchmark',
  ManagedBy: 'CDK',
  Repository: 'aws-portfolio-setup',
};

export const API_CORS_CONFIG = {
  allowOrigins: ['*'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: [
    'Content-Type',
    'X-Amz-Date',
    'Authorization',
    'X-Api-Key',
    'X-Amz-Security-Token',
    'X-Runtime',
  ],
};
