#!/usr/bin/env node

/**
 * CDK Construct Scaffolding Script (JavaScript Wrapper)
 * Wrapper für create-construct.sh für einfachere NPM Integration
 */

const { execSync } = require('child_process');
const path = require('path');

const args = process.argv.slice(2);

if (args.length !== 3) {
  console.error('❌ Falsche Anzahl an Argumenten!\n');
  console.log('Usage:');
  console.log('  npm run scaffold <category> <domain> <construct-name>\n');
  console.log('Examples:');
  console.log('  npm run scaffold primitives compute lambda-function-secure');
  console.log('  npm run scaffold patterns api graphql-api-appsync\n');
  process.exit(1);
}

const scriptPath = path.join(__dirname, 'create-construct.sh');

try {
  execSync(`bash ${scriptPath} ${args.join(' ')}`, {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..'),
  });
} catch (error) {
  process.exit(1);
}
