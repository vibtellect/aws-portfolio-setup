/**
 * Global setup for integration tests
 * Runs once before all tests
 */

import { waitForLocalStack, LOCALSTACK_ENDPOINT } from '../helpers/localstack-config';

export default async function globalSetup(): Promise<void> {
  console.log('\n=================================================');
  console.log('Setting up LocalStack Integration Tests');
  console.log('=================================================\n');

  try {
    console.log(`Checking LocalStack availability at ${LOCALSTACK_ENDPOINT}...`);
    await waitForLocalStack(30, 2000);
    console.log('✓ LocalStack is ready!\n');
  } catch (error) {
    console.error('\n❌ Failed to connect to LocalStack!');
    console.error('\nPlease ensure LocalStack is running:');
    console.error('  npm run localstack:start\n');
    console.error('Or run all tests with:');
    console.error('  npm run localstack:test\n');
    throw error;
  }

  console.log('Integration test environment is ready.\n');
}
