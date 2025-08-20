#!/bin/bash

# Build script for QuizRally
# This script builds all components of the application

set -e

echo "🚀 Starting QuizRally build process..."

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

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

# Build backend services
print_step "Building backend services..."
cd src/backend
if [ -f "package.json" ]; then
    npm install
    npm run build
    print_success "Backend build completed"
else
    print_error "Backend package.json not found"
    exit 1
fi
cd ../..

# Build mobile app
print_step "Building mobile app..."
cd src/mobile
if [ -f "pubspec.yaml" ]; then
    flutter pub get
    flutter build apk --release
    print_success "Mobile app build completed"
else
    print_error "Flutter pubspec.yaml not found"
    exit 1
fi
cd ../..

# Build Docker images
print_step "Building Docker images..."
docker-compose build
print_success "Docker images built successfully"

print_success "🎉 All builds completed successfully!"

echo ""
echo "Build artifacts:"
echo "  - Backend: src/backend/dist/"
echo "  - Mobile APK: src/mobile/build/app/outputs/flutter-apk/app-release.apk"
echo "  - Docker images: Available in local Docker registry"
