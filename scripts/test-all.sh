#!/bin/bash

# Test script for QuizRally
# This script runs all tests across the application

set -e

echo "🧪 Starting QuizRally test suite..."

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

# Initialize test results
backend_tests=0
mobile_tests=0
integration_tests=0

# Run backend tests
print_step "Running backend tests..."
cd src/backend
if [ -f "package.json" ]; then
    npm test || backend_tests=1
    if [ $backend_tests -eq 0 ]; then
        print_success "Backend tests passed"
    else
        print_error "Backend tests failed"
    fi
else
    print_error "Backend package.json not found"
    backend_tests=1
fi
cd ../..

# Run Python tests if any
print_step "Running Python tests..."
if [ -f "requirements.txt" ] || [ -f "pyproject.toml" ]; then
    if command -v pytest &> /dev/null; then
        pytest tests/ --cov=src/backend --cov-report=term-missing || backend_tests=1
        if [ $backend_tests -eq 0 ]; then
            print_success "Python tests passed"
        else
            print_error "Python tests failed"
        fi
    else
        print_error "pytest not found. Please install pytest."
        backend_tests=1
    fi
fi

# Run mobile tests
print_step "Running mobile tests..."
cd src/mobile
if [ -f "pubspec.yaml" ]; then
    flutter test || mobile_tests=1
    if [ $mobile_tests -eq 0 ]; then
        print_success "Mobile tests passed"
    else
        print_error "Mobile tests failed"
    fi
else
    print_error "Flutter pubspec.yaml not found"
    mobile_tests=1
fi
cd ../..

# Run integration tests
print_step "Running integration tests..."
if [ -d "tests/integration" ]; then
    # Start test environment
    docker-compose -f docker-compose.test.yml up -d || true
    sleep 10

    # Run integration tests
    npm run test:integration || integration_tests=1

    # Cleanup
    docker-compose -f docker-compose.test.yml down || true

    if [ $integration_tests -eq 0 ]; then
        print_success "Integration tests passed"
    else
        print_error "Integration tests failed"
    fi
else
    echo "No integration tests found, skipping..."
fi

# Summary
echo ""
echo "📊 Test Summary:"
if [ $backend_tests -eq 0 ]; then
    print_success "Backend tests: PASSED"
else
    print_error "Backend tests: FAILED"
fi

if [ $mobile_tests -eq 0 ]; then
    print_success "Mobile tests: PASSED"
else
    print_error "Mobile tests: FAILED"
fi

if [ $integration_tests -eq 0 ]; then
    print_success "Integration tests: PASSED"
else
    print_error "Integration tests: FAILED"
fi

# Exit with error if any tests failed
total_failures=$((backend_tests + mobile_tests + integration_tests))
if [ $total_failures -gt 0 ]; then
    print_error "🚫 $total_failures test suite(s) failed"
    exit 1
else
    print_success "🎉 All tests passed!"
    exit 0
fi
