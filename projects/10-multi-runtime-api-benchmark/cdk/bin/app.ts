#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { SharedStack } from '../lib/shared-stack';
import { RuntimeStack } from '../lib/runtime-stack';
import { MonitoringStack } from '../lib/monitoring-stack';

const app = new cdk.App();

// Get environment from context or default to 'dev'
const environment = (app.node.tryGetContext('environment') || 'dev') as 'dev' | 'staging' | 'prod';
const alertEmail = app.node.tryGetContext('alertEmail') as string | undefined;

// Environment configuration
const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
};

console.log(`Deploying to environment: ${environment}`);
console.log(`Account: ${env.account}, Region: ${env.region}`);

// Create shared infrastructure stack
const sharedStack = new SharedStack(app, 'MultiRuntimeBenchmarkSharedStack', {
  env,
  environment,
  description: `Shared infrastructure for Multi-Runtime API Benchmark (${environment})`,
  stackName: `multi-runtime-benchmark-shared-${environment}`,
});

// Create runtime-specific stacks
const pythonStack = new RuntimeStack(app, 'MultiRuntimeBenchmarkPythonStack', {
  env,
  runtimeName: 'python',
  environment,
  tableName: sharedStack.table.tableName,
  tableArn: sharedStack.table.tableArn,
  apiId: sharedStack.api.restApiId,
  apiRootResourceId: sharedStack.api.root.resourceId,
  description: `Python Lambda for Multi-Runtime API Benchmark (${environment})`,
  stackName: `multi-runtime-benchmark-python-${environment}`,
});
pythonStack.addDependency(sharedStack);

const typescriptStack = new RuntimeStack(app, 'MultiRuntimeBenchmarkTypeScriptStack', {
  env,
  runtimeName: 'typescript',
  environment,
  tableName: sharedStack.table.tableName,
  tableArn: sharedStack.table.tableArn,
  apiId: sharedStack.api.restApiId,
  apiRootResourceId: sharedStack.api.root.resourceId,
  description: `TypeScript Lambda for Multi-Runtime API Benchmark (${environment})`,
  stackName: `multi-runtime-benchmark-typescript-${environment}`,
});
typescriptStack.addDependency(sharedStack);

const goStack = new RuntimeStack(app, 'MultiRuntimeBenchmarkGoStack', {
  env,
  runtimeName: 'go',
  environment,
  tableName: sharedStack.table.tableName,
  tableArn: sharedStack.table.tableArn,
  apiId: sharedStack.api.restApiId,
  apiRootResourceId: sharedStack.api.root.resourceId,
  description: `Go Lambda for Multi-Runtime API Benchmark (${environment})`,
  stackName: `multi-runtime-benchmark-go-${environment}`,
});
goStack.addDependency(sharedStack);

const kotlinStack = new RuntimeStack(app, 'MultiRuntimeBenchmarkKotlinStack', {
  env,
  runtimeName: 'kotlin',
  environment,
  tableName: sharedStack.table.tableName,
  tableArn: sharedStack.table.tableArn,
  apiId: sharedStack.api.restApiId,
  apiRootResourceId: sharedStack.api.root.resourceId,
  description: `Kotlin Lambda for Multi-Runtime API Benchmark (${environment})`,
  stackName: `multi-runtime-benchmark-kotlin-${environment}`,
});
kotlinStack.addDependency(sharedStack);

// Create monitoring stack
const monitoringStack = new MonitoringStack(app, 'MultiRuntimeBenchmarkMonitoringStack', {
  env,
  environment,
  lambdaFunctions: {
    python: pythonStack.lambdaFunction,
    typescript: typescriptStack.lambdaFunction,
    go: goStack.lambdaFunction,
    kotlin: kotlinStack.lambdaFunction,
  },
  table: sharedStack.table,
  alertEmail,
  description: `Monitoring dashboard for Multi-Runtime API Benchmark (${environment})`,
  stackName: `multi-runtime-benchmark-monitoring-${environment}`,
});
monitoringStack.addDependency(pythonStack);
monitoringStack.addDependency(typescriptStack);
monitoringStack.addDependency(goStack);
monitoringStack.addDependency(kotlinStack);

// Add tags to all stacks
cdk.Tags.of(app).add('Project', 'MultiRuntimeBenchmark');
cdk.Tags.of(app).add('Environment', environment);
cdk.Tags.of(app).add('ManagedBy', 'CDK');

app.synth();
