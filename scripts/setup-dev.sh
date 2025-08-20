#!/bin/bash

# Development environment setup script for QuizRally

set -e

echo "🛠️  Setting up QuizRally development environment..."

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

print_warning() {
    echo -e "\033[1;33m⚠ $1\033[0m"
}

# Check system requirements
print_step "Checking system requirements..."

# Check Docker
if command -v docker &> /dev/null; then
    print_success "Docker found: $(docker --version)"
else
    print_error "Docker not found. Please install Docker Desktop."
    exit 1
fi

# Check Docker Compose
if command -v docker-compose &> /dev/null; then
    print_success "Docker Compose found: $(docker-compose --version)"
else
    print_error "Docker Compose not found. Please install Docker Compose."
    exit 1
fi

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_success "Node.js found: $NODE_VERSION"
    if [[ $NODE_VERSION < "v18" ]]; then
        print_warning "Node.js version should be 18 or higher for best compatibility"
    fi
else
    print_error "Node.js not found. Please install Node.js 18+"
    exit 1
fi

# Check Python
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    print_success "Python found: $PYTHON_VERSION"
else
    print_error "Python 3 not found. Please install Python 3.11+"
    exit 1
fi

# Check Flutter
if command -v flutter &> /dev/null; then
    FLUTTER_VERSION=$(flutter --version | head -n 1)
    print_success "Flutter found: $FLUTTER_VERSION"
else
    print_error "Flutter not found. Please install Flutter 3.16+"
    print_error "Visit: https://docs.flutter.dev/get-started/install"
    exit 1
fi

# Check Git
if command -v git &> /dev/null; then
    print_success "Git found: $(git --version)"
else
    print_error "Git not found. Please install Git."
    exit 1
fi

# Setup environment files
print_step "Setting up environment configuration..."
if [ ! -f ".env" ]; then
    cp .env.example .env 2>/dev/null || echo "# QuizRally Environment Configuration
# Database
POSTGRES_USER=quizrally
POSTGRES_PASSWORD=dev_password_change_in_production
POSTGRES_DB=quizrally_dev
DATABASE_URL=postgresql://\${POSTGRES_USER}:\${POSTGRES_PASSWORD}@localhost:5432/\${POSTGRES_DB}

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your_jwt_secret_key_change_in_production
JWT_EXPIRY=1h

# API
API_PORT=3000
GATEWAY_PORT=8080

# Environment
NODE_ENV=development

# Mobile App
APP_NAME=QuizRally
APP_VERSION=1.0.0" > .env
    print_success "Created .env file from template"
else
    print_success ".env file already exists"
fi

# Install backend dependencies
print_step "Installing backend dependencies..."
if [ -d "src/backend" ]; then
    cd src/backend
    if [ -f "package.json" ]; then
        npm install
        print_success "Backend dependencies installed"
    else
        print_warning "Backend package.json not found, skipping npm install"
    fi
    cd ../..
else
    print_warning "Backend directory not found, skipping backend setup"
fi

# Install Python dependencies
print_step "Installing Python dependencies..."
if [ -f "requirements.txt" ]; then
    pip3 install -r requirements.txt
    print_success "Python dependencies installed"
else
    print_warning "requirements.txt not found, skipping Python dependencies"
fi

# Setup Flutter dependencies
print_step "Setting up Flutter dependencies..."
if [ -d "src/mobile" ]; then
    cd src/mobile
    if [ -f "pubspec.yaml" ]; then
        flutter pub get
        print_success "Flutter dependencies installed"
    else
        print_warning "Flutter pubspec.yaml not found, skipping flutter pub get"
    fi
    cd ../..
else
    print_warning "Mobile directory not found, skipping Flutter setup"
fi

# Make scripts executable
print_step "Making scripts executable..."
chmod +x scripts/*.sh
print_success "Scripts made executable"

# Setup Git hooks (if .git exists)
if [ -d ".git" ]; then
    print_step "Setting up Git hooks..."
    # Create pre-commit hook
    cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
echo "Running pre-commit checks..."
./scripts/lint-all.sh
if [ $? -ne 0 ]; then
    echo "Linting failed. Please fix the issues before committing."
    exit 1
fi
EOF
    chmod +x .git/hooks/pre-commit
    print_success "Git pre-commit hook installed"
fi

# Start development services
print_step "Starting development services..."
docker-compose up -d postgres redis
sleep 5

# Check if services are running
if docker-compose ps | grep -q "Up"; then
    print_success "Development services started"
else
    print_warning "Some services may not have started properly. Check with: docker-compose ps"
fi

# Final setup verification
print_step "Verifying setup..."

# Test database connection
if docker-compose exec -T postgres pg_isready -U quizrally > /dev/null 2>&1; then
    print_success "Database connection verified"
else
    print_warning "Database connection could not be verified"
fi

# Test Redis connection
if docker-compose exec -T redis redis-cli ping > /dev/null 2>&1; then
    print_success "Redis connection verified"
else
    print_warning "Redis connection could not be verified"
fi

echo ""
print_success "🎉 Development environment setup complete!"
echo ""
echo "Next steps:"
echo "  1. Review and update .env file with your configuration"
echo "  2. Run 'docker-compose up' to start all services"
echo "  3. Run './scripts/test-all.sh' to verify everything works"
echo "  4. Start developing! 🚀"
echo ""
echo "Useful commands:"
echo "  - Start services: docker-compose up"
echo "  - Stop services: docker-compose down"
echo "  - View logs: docker-compose logs -f"
echo "  - Run tests: ./scripts/test-all.sh"
echo "  - Run linting: ./scripts/lint-all.sh"
echo "  - Build everything: ./scripts/build.sh"
