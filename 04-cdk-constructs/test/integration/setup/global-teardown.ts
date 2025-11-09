/**
 * Global teardown for integration tests
 * Runs once after all tests
 */

export default async function globalTeardown(): Promise<void> {
  console.log('\n=================================================');
  console.log('Cleaning up Integration Tests');
  console.log('=================================================\n');

  // Cleanup logic here if needed
  // For example, removing temporary files or doing final cleanup

  console.log('✓ Integration test cleanup complete.\n');
  console.log('To stop LocalStack:');
  console.log('  npm run localstack:stop\n');
}
