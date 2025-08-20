#!/bin/bash

# Lint script for QuizRally
# This script runs linting across all codebases

set -e

echo "🔍 Starting QuizRally linting process..."

# Function to print colored output
print_step() {
    echo -e "\033[1;34m► $1\033[0m"
}

print_success() {
    echo -e "\033[1;32m✓ $1\033[0m"
}

print_error() {
    echo -e "\033[1;31m✗ $1\033[0m"
}

# Initialize lint results
backend_lint=0
mobile_lint=0
python_lint=0

# Lint backend JavaScript/TypeScript
print_step "Linting backend code..."
cd src/backend
if [ -f "package.json" ]; then
    npm run lint || backend_lint=1
    if [ $backend_lint -eq 0 ]; then
        print_success "Backend linting passed"
    else
        print_error "Backend linting failed"
    fi
else
    print_error "Backend package.json not found"
    backend_lint=1
fi
cd ../..

# Lint Python code
print_step "Linting Python code..."
if command -v flake8 &> /dev/null && command -v black &> /dev/null; then
    # Check Python formatting with black
    black --check src/backend/ tests/ || python_lint=1

    # Check Python linting with flake8
    flake8 src/backend/ tests/ --count --select=E9,F63,F7,F82 --show-source --statistics || python_lint=1

    # Run pylint if available
    if command -v pylint &> /dev/null; then
        pylint src/backend/ --disable=C0114,C0115,C0116 || python_lint=1
    fi

    if [ $python_lint -eq 0 ]; then
        print_success "Python linting passed"
    else
        print_error "Python linting failed"
    fi
else
    echo "Python linting tools not found. Install with: pip install flake8 black pylint"
    python_lint=1
fi

# Lint mobile code
print_step "Linting mobile code..."
cd src/mobile
if [ -f "pubspec.yaml" ]; then
    flutter analyze || mobile_lint=1
    if [ $mobile_lint -eq 0 ]; then
        print_success "Mobile linting passed"
    else
        print_error "Mobile linting failed"
    fi
else
    print_error "Flutter pubspec.yaml not found"
    mobile_lint=1
fi
cd ../..

# Lint Markdown files
print_step "Linting Markdown files..."
if command -v markdownlint &> /dev/null; then
    markdownlint README.md docs/ --ignore node_modules || echo "Markdown linting completed with warnings"
else
    echo "markdownlint not found. Install with: npm install -g markdownlint-cli"
fi

# Lint YAML files
print_step "Linting YAML files..."
if command -v yamllint &> /dev/null; then
    yamllint .github/ docker-compose*.yml || echo "YAML linting completed with warnings"
else
    echo "yamllint not found. Install with: pip install yamllint"
fi

# Summary
echo ""
echo "📊 Lint Summary:"
if [ $backend_lint -eq 0 ]; then
    print_success "Backend linting: PASSED"
else
    print_error "Backend linting: FAILED"
fi

if [ $python_lint -eq 0 ]; then
    print_success "Python linting: PASSED"
else
    print_error "Python linting: FAILED"
fi

if [ $mobile_lint -eq 0 ]; then
    print_success "Mobile linting: PASSED"
else
    print_error "Mobile linting: FAILED"
fi

# Exit with error if any linting failed
total_failures=$((backend_lint + python_lint + mobile_lint))
if [ $total_failures -gt 0 ]; then
    print_error "🚫 $total_failures linting suite(s) failed"
    exit 1
else
    print_success "🎉 All linting passed!"
    exit 0
fi
