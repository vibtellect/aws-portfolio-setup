#!/bin/bash

# =============================================================================
# CDK Construct Scaffolding Script (TDD-ready)
# =============================================================================
# Erstellt automatisch ein neues CDK Construct mit allen benötigten Dateien
# für Test-Driven Development
#
# Usage:
#   ./scripts/create-construct.sh <category> <domain> <construct-name>
#
# Examples:
#   ./scripts/create-construct.sh primitives compute lambda-function-secure
#   ./scripts/create-construct.sh patterns api graphql-api-appsync
# =============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# =============================================================================
# Functions
# =============================================================================

print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# =============================================================================
# Validate Arguments
# =============================================================================

if [ "$#" -ne 3 ]; then
    print_error "Falsche Anzahl an Argumenten!"
    echo ""
    echo "Usage:"
    echo "  $0 <category> <domain> <construct-name>"
    echo ""
    echo "Examples:"
    echo "  $0 primitives compute lambda-function-secure"
    echo "  $0 patterns api graphql-api-appsync"
    echo ""
    echo "Categories:"
    echo "  primitives - Einzelne AWS-Ressourcen"
    echo "  patterns   - Kombination mehrerer Ressourcen"
    echo ""
    echo "Domains:"
    echo "  compute, storage, database, networking, security,"
    echo "  messaging, observability, cdn, api, async, web, data, container, governance"
    exit 1
fi

CATEGORY=$1
DOMAIN=$2
CONSTRUCT_NAME=$3

# Validate category
if [[ "$CATEGORY" != "primitives" && "$CATEGORY" != "patterns" ]]; then
    print_error "Category muss 'primitives' oder 'patterns' sein!"
    exit 1
fi

# Convert construct-name to PascalCase for class name
# e.g., lambda-function-secure → LambdaFunctionSecure
CONSTRUCT_CLASS=$(echo "$CONSTRUCT_NAME" | sed -r 's/(^|-)([a-z])/\U\2/g')

# Paths
CDK_CONSTRUCTS_DIR="04-cdk-constructs"
TARGET_DIR="$CDK_CONSTRUCTS_DIR/$CATEGORY/$DOMAIN/$CONSTRUCT_NAME"
TEMPLATE_DIR="$CDK_CONSTRUCTS_DIR/.construct-template"

# =============================================================================
# Main Script
# =============================================================================

print_header "CDK Construct Scaffolding"

print_info "Category:       $CATEGORY"
print_info "Domain:         $DOMAIN"
print_info "Construct Name: $CONSTRUCT_NAME"
print_info "Class Name:     $CONSTRUCT_CLASS"
print_info "Target Path:    $TARGET_DIR"
echo ""

# Check if target directory already exists
if [ -d "$TARGET_DIR" ]; then
    print_error "Ordner existiert bereits: $TARGET_DIR"
    exit 1
fi

# Check if template directory exists
if [ ! -d "$TEMPLATE_DIR" ]; then
    print_error "Template-Ordner nicht gefunden: $TEMPLATE_DIR"
    exit 1
fi

# Create directory structure
print_info "Erstelle Ordnerstruktur..."
mkdir -p "$TARGET_DIR/src"
mkdir -p "$TARGET_DIR/test"
mkdir -p "$TARGET_DIR/examples"
print_success "Ordner erstellt"

# Copy and process templates
print_info "Kopiere Template-Dateien..."

# Function to replace placeholders in file
replace_placeholders() {
    local file=$1
    sed -i "s/{construct-name}/$CONSTRUCT_NAME/g" "$file"
    sed -i "s/{ConstructName}/$CONSTRUCT_CLASS/g" "$file"
    sed -i "s/{category}/$CATEGORY/g" "$file"
    sed -i "s/{domain}/$DOMAIN/g" "$file"
    sed -i "s/{YYYY-MM-DD}/$(date +%Y-%m-%d)/g" "$file"
}

# Copy and process package.json
cp "$TEMPLATE_DIR/package.template.json" "$TARGET_DIR/package.json"
replace_placeholders "$TARGET_DIR/package.json"
print_success "package.json erstellt"

# Copy and process tsconfig.json
cp "$TEMPLATE_DIR/tsconfig.template.json" "$TARGET_DIR/tsconfig.json"
replace_placeholders "$TARGET_DIR/tsconfig.json"
print_success "tsconfig.json erstellt"

# Copy and process jest.config.js
cp "$TEMPLATE_DIR/jest.config.template.js" "$TARGET_DIR/jest.config.js"
replace_placeholders "$TARGET_DIR/jest.config.js"
print_success "jest.config.js erstellt"

# Copy and process .gitignore
cp "$TEMPLATE_DIR/.gitignore.template" "$TARGET_DIR/.gitignore"
print_success ".gitignore erstellt"

# Copy and process README.md
cp "$TEMPLATE_DIR/README.template.md" "$TARGET_DIR/README.md"
replace_placeholders "$TARGET_DIR/README.md"
print_success "README.md erstellt"

# Copy and process CHANGELOG.md
cp "$TEMPLATE_DIR/CHANGELOG.template.md" "$TARGET_DIR/CHANGELOG.md"
replace_placeholders "$TARGET_DIR/CHANGELOG.md"
print_success "CHANGELOG.md erstellt"

# Copy and process src/index.ts
cp "$TEMPLATE_DIR/src/index.template.ts" "$TARGET_DIR/src/index.ts"
replace_placeholders "$TARGET_DIR/src/index.ts"
print_success "src/index.ts erstellt"

# Copy and process test/unit.test.ts
cp "$TEMPLATE_DIR/test/unit.test.template.ts" "$TARGET_DIR/test/unit.test.ts"
replace_placeholders "$TARGET_DIR/test/unit.test.ts"
print_success "test/unit.test.ts erstellt"

# Copy and process examples
cp "$TEMPLATE_DIR/examples/basic.template.ts" "$TARGET_DIR/examples/basic.ts"
replace_placeholders "$TARGET_DIR/examples/basic.ts"
print_success "examples/basic.ts erstellt"

cp "$TEMPLATE_DIR/examples/production.template.ts" "$TARGET_DIR/examples/production.ts"
replace_placeholders "$TARGET_DIR/examples/production.ts"
print_success "examples/production.ts erstellt"

# Install dependencies
print_info "Installiere NPM Dependencies..."
cd "$TARGET_DIR"
npm install --silent > /dev/null 2>&1
cd - > /dev/null
print_success "Dependencies installiert"

# Print next steps
echo ""
print_header "✅ Construct erfolgreich erstellt!"
echo ""
print_info "Nächste Schritte (TDD Workflow):"
echo ""
echo "  1. Navigate to construct:"
echo "     ${BLUE}cd $TARGET_DIR${NC}"
echo ""
echo "  2. Start TDD watch mode:"
echo "     ${BLUE}npm run test:tdd${NC}"
echo ""
echo "  3. Open test file in editor:"
echo "     ${BLUE}vim test/unit.test.ts${NC}"
echo ""
echo "  4. Follow TDD cycle:"
echo "     🔴 RED    - Schreibe Test (schlägt fehl)"
echo "     🟢 GREEN  - Implementiere src/index.ts (Test besteht)"
echo "     🔧 REFACTOR - Verbessere Code"
echo ""
echo "  5. Siehe TDD Guide:"
echo "     ${BLUE}cat ../../../TDD_GUIDE.md${NC}"
echo ""
print_success "Happy Test-Driven Development! 🚀"
echo ""

# Create a helper file for quick reference
cat > "$TARGET_DIR/QUICKSTART.md" << EOF
# Quick Start: $CONSTRUCT_CLASS

## TDD Workflow

\`\`\`bash
# 1. Start TDD watch mode
npm run test:tdd

# 2. Edit test (in another terminal)
vim test/unit.test.ts

# 3. Edit source
vim src/index.ts

# 4. Repeat: RED → GREEN → REFACTOR
\`\`\`

## Available Scripts

\`\`\`bash
npm run test:tdd       # TDD watch mode (empfohlen)
npm run test:watch     # Normal watch mode
npm test               # Run all tests once
npm run test:coverage  # Run with coverage report
npm run build          # Compile TypeScript
npm run build:watch    # Compile in watch mode
\`\`\`

## File Structure

\`\`\`
$CONSTRUCT_NAME/
├── src/
│   └── index.ts           # ← Implement here (GREEN phase)
├── test/
│   └── unit.test.ts       # ← Write tests first (RED phase)
├── examples/
│   ├── basic.ts           # ← Simple usage example
│   └── production.ts      # ← Production-ready example
├── README.md              # ← Documentation
├── CHANGELOG.md           # ← Version history
└── package.json           # ← NPM config
\`\`\`

## TDD Cycle

1. **🔴 RED** - Write a failing test in \`test/unit.test.ts\`
2. **🟢 GREEN** - Write minimal code in \`src/index.ts\` to pass test
3. **🔧 REFACTOR** - Improve code while keeping tests green

## Resources

- [TDD Guide](../../../TDD_GUIDE.md)
- [Contributing Guide](../../../CONTRIBUTING.md)
- [Getting Started](../../../GETTING_STARTED.md)

---

**Created:** $(date +%Y-%m-%d)
**Construct:** $CONSTRUCT_CLASS
**Category:** $CATEGORY
**Domain:** $DOMAIN
EOF

print_success "QUICKSTART.md erstellt für schnelle Referenz"
