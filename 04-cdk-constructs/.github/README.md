# GitHub Actions Workflows

This directory contains GitHub Actions workflows and configurations for the AWS CDK Constructs library.

## Workflows

### CI (`ci.yml`)
**Triggers:** Push to `main`, Pull Requests

Runs on every push and PR to ensure code quality:
- **Lint**: Runs ESLint to check code style
- **Type Check**: Runs TypeScript compiler to verify types
- **Test**: Runs test suite across Node.js 18, 20, and 22
- **Build**: Verifies package builds successfully

### Release (`release.yml`)
**Triggers:** Tag push (v*)

Automates the release process:
1. Runs tests to ensure quality
2. Builds the package
3. Verifies version matches tag
4. Publishes to npm
5. Creates GitHub release with notes

**Required Secrets:**
- `NPM_TOKEN`: npm authentication token for publishing

### Security Scan (`security.yml`)
**Triggers:** Push to `main`, Pull Requests, Weekly schedule

Comprehensive security scanning:
- **NPM Audit**: Checks for vulnerable dependencies
- **Dependency Review**: Reviews new dependencies in PRs
- **CodeQL**: Static code analysis for security issues
- **Snyk**: Third-party vulnerability scanning

**Required Secrets:**
- `SNYK_TOKEN`: Snyk API token (optional)

### Code Coverage (`coverage.yml`)
**Triggers:** Push to `main`, Pull Requests

Generates and reports code coverage:
- Runs tests with coverage
- Uploads to Codecov
- Comments coverage report on PRs
- Generates coverage badges

**Required Secrets:**
- `CODECOV_TOKEN`: Codecov upload token (optional)

### Auto Tag (`auto-tag.yml`)
**Triggers:** Push to `main` (when package.json changes)

Automatically creates git tags when version is bumped:
- Detects version changes in package.json
- Creates and pushes git tag (v*)
- Triggers release workflow

### PR Labeler (`pr-labeler.yml`)
**Triggers:** Pull Request opened/updated

Automatically labels PRs:
- Labels by file paths (primitive/*, tests, docs, etc.)
- Labels by PR size (xs, s, m, l, xl)

## Dependabot

**Configuration:** `dependabot.yml`

Automated dependency updates:
- **NPM**: Weekly updates for npm packages
  - Groups AWS CDK packages together
  - Groups dev dependencies together
- **GitHub Actions**: Weekly updates for workflow actions

## Labeler Configuration

**Configuration:** `labeler.yml`

Defines automatic PR labeling rules based on:
- Source code categories (primitives)
- Tests
- Documentation
- CI/CD files
- Dependencies
- Configuration files

## Setting Up

### Required Secrets

To use all workflows, configure these secrets in repository settings:

1. **NPM_TOKEN**
   - Purpose: Publish packages to npm
   - Required for: `release.yml`
   - How to get: Create token at https://www.npmjs.com/settings/[username]/tokens

2. **CODECOV_TOKEN** (optional)
   - Purpose: Upload coverage reports
   - Required for: `coverage.yml`, `ci.yml`
   - How to get: Sign up at https://codecov.io

3. **SNYK_TOKEN** (optional)
   - Purpose: Vulnerability scanning
   - Required for: `security.yml`
   - How to get: Sign up at https://snyk.io

### Required Permissions

Ensure the repository has these permissions enabled:
- **Workflows**: Read and write permissions
- **Pull Requests**: Write permissions
- **Contents**: Write permissions
- **Security Events**: Write permissions

## Workflow Features

### Matrix Testing
Tests run across multiple Node.js versions (18, 20, 22) to ensure compatibility.

### Automated Releases
Simply bump version in package.json and merge to main - the rest is automated:
1. Auto-tag creates git tag
2. Tag push triggers release workflow
3. Release workflow publishes to npm and creates GitHub release

### Security Scanning
Multiple layers of security:
- npm audit (high severity)
- Dependency review on PRs
- CodeQL static analysis
- Snyk vulnerability scanning
- Weekly scheduled scans

### Code Quality Gates
All PRs must pass:
- Linting
- Type checking
- Tests (all Node versions)
- Security scans
- Build verification

## Maintenance

### Updating Workflows
When updating workflows:
1. Test changes in a fork first
2. Use semantic commit messages (e.g., `ci: update Node.js versions`)
3. Document changes in PR description

### Monitoring
- Check workflow runs in Actions tab
- Review Dependabot PRs weekly
- Monitor security alerts in Security tab
- Review coverage trends in Codecov

## Troubleshooting

### Build Failures
1. Check Node.js version compatibility
2. Verify npm dependencies are locked
3. Review test logs for specific failures

### Release Failures
1. Verify NPM_TOKEN is valid
2. Check package.json version is unique
3. Ensure all tests pass

### Security Scan Failures
1. Review npm audit output
2. Update vulnerable dependencies
3. Check for breaking changes in updates

## Best Practices

1. **Keep workflows updated**: Dependabot handles this automatically
2. **Monitor security alerts**: Review and act on them promptly
3. **Maintain high coverage**: Aim for >95% code coverage
4. **Version bumps**: Use semantic versioning (major.minor.patch)
5. **PR reviews**: Wait for all checks to pass before merging
