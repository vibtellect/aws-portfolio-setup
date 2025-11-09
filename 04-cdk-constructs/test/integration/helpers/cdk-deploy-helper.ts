/**
 * CDK Deployment Helper for LocalStack Integration Tests
 *
 * Provides utilities to deploy and destroy CDK stacks in LocalStack.
 */

import { App, Stack, CfnOutput } from 'aws-cdk-lib';
import * as child_process from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { localstackEnv, LOCALSTACK_ENDPOINT } from './localstack-config';

export interface DeploymentResult {
  stackName: string;
  outputs: Record<string, string>;
  resources: any[];
}

/**
 * Deploy a CDK stack to LocalStack using cdklocal
 */
export async function deployStack(
  stack: Stack,
  stackName: string = stack.stackName
): Promise<DeploymentResult> {
  const app = stack.node.root as App;
  const assembly = app.synth();

  // Get the cloud assembly directory
  const cloudAssemblyDir = assembly.directory;

  console.log(`Deploying stack ${stackName} to LocalStack...`);
  console.log(`Cloud assembly directory: ${cloudAssemblyDir}`);

  try {
    // Use AWS CDK with LocalStack endpoint
    const deployCommand = `npx cdk deploy ${stackName} --app="${cloudAssemblyDir}" --require-approval=never --output=${cloudAssemblyDir}/outputs.json`;

    const env = {
      ...process.env,
      AWS_ENDPOINT_URL: LOCALSTACK_ENDPOINT,
      AWS_DEFAULT_REGION: localstackEnv.region,
      AWS_ACCESS_KEY_ID: 'test',
      AWS_SECRET_ACCESS_KEY: 'test',
      CDK_DEFAULT_ACCOUNT: localstackEnv.account,
      CDK_DEFAULT_REGION: localstackEnv.region,
    };

    child_process.execSync(deployCommand, {
      stdio: 'inherit',
      env,
    });

    // Read outputs
    const outputsFile = path.join(cloudAssemblyDir, 'outputs.json');
    let outputs: Record<string, string> = {};

    if (fs.existsSync(outputsFile)) {
      const outputsData = JSON.parse(fs.readFileSync(outputsFile, 'utf-8'));
      outputs = outputsData[stackName] || {};
    }

    return {
      stackName,
      outputs,
      resources: [],
    };
  } catch (error) {
    console.error(`Failed to deploy stack ${stackName}:`, error);
    throw error;
  }
}

/**
 * Destroy a CDK stack from LocalStack
 */
export async function destroyStack(stackName: string): Promise<void> {
  console.log(`Destroying stack ${stackName} from LocalStack...`);

  try {
    const destroyCommand = `npx cdk destroy ${stackName} --force`;

    const env = {
      ...process.env,
      AWS_ENDPOINT_URL: LOCALSTACK_ENDPOINT,
      AWS_DEFAULT_REGION: localstackEnv.region,
      AWS_ACCESS_KEY_ID: 'test',
      AWS_SECRET_ACCESS_KEY: 'test',
      CDK_DEFAULT_ACCOUNT: localstackEnv.account,
      CDK_DEFAULT_REGION: localstackEnv.region,
    };

    child_process.execSync(destroyCommand, {
      stdio: 'inherit',
      env,
    });
  } catch (error) {
    console.warn(`Warning: Failed to destroy stack ${stackName}:`, error);
    // Don't throw, as the stack might not exist
  }
}

/**
 * Create a test app with LocalStack environment
 */
export function createTestApp(): App {
  return new App({
    context: {
      '@aws-cdk/core:newStyleStackSynthesis': true,
    },
  });
}

/**
 * Create a test stack with LocalStack environment
 */
export function createTestStack(app: App, stackName: string): Stack {
  return new Stack(app, stackName, {
    env: localstackEnv,
    stackName,
  });
}

/**
 * Add an output to a stack
 */
export function addOutput(
  stack: Stack,
  outputName: string,
  value: string,
  description?: string
): void {
  new CfnOutput(stack, outputName, {
    value,
    description,
    exportName: `${stack.stackName}-${outputName}`,
  });
}
