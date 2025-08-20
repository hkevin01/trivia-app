# Contributing to QuizRally

Thank you for your interest in contributing to QuizRally! This document provides guidelines and information for contributors.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Contributing Guidelines](#contributing-guidelines)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Documentation](#documentation)

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR-USERNAME/trivia-app.git`
3. Create a feature branch: `git checkout -b feature/your-feature-name`
4. Make your changes
5. Test your changes
6. Submit a pull request

## Development Setup

### Prerequisites

- Node.js 18+
- Python 3.11+
- Flutter 3.16+
- Docker and Docker Compose
- Git

### Initial Setup

```bash
# Clone the repository
git clone https://github.com/your-repo/trivia-app.git
cd trivia-app

# Install backend dependencies
cd src/backend
npm install

# Install Python dependencies
pip install -r requirements.txt

# Install Flutter dependencies
cd ../mobile
flutter pub get

# Setup environment variables
cp .env.example .env
# Edit .env with your configuration

# Start development services
docker-compose up -d
```

## Contributing Guidelines

### Issue Guidelines

- Search existing issues before creating new ones
- Use the provided issue templates
- Provide clear reproduction steps for bugs
- Include system information and logs where relevant

### Branch Naming

- `feature/` - New features
- `bugfix/` - Bug fixes
- `hotfix/` - Critical production fixes
- `docs/` - Documentation updates
- `chore/` - Maintenance tasks

### Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: New features
- `fix`: Bug fixes
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Test additions/modifications
- `chore`: Maintenance tasks

Examples:
```
feat(mobile): add real-time score updates
fix(backend): resolve authentication token expiry
docs(api): update WebSocket event documentation
```

## Pull Request Process

1. **Update Documentation**: Ensure any new features are documented
2. **Add Tests**: Include appropriate test coverage for your changes
3. **Follow Style Guidelines**: Ensure your code follows project conventions
4. **Update CHANGELOG**: Add entry describing your changes
5. **Self-Review**: Review your own code before submitting
6. **Link Issues**: Reference related issues in your PR description

### PR Checklist

- [ ] Tests pass locally
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] Breaking changes documented

## Coding Standards

### General Principles

- Write clean, readable, and maintainable code
- Follow SOLID principles
- Use meaningful variable and function names
- Comment complex logic
- Keep functions small and focused

### Language-Specific Standards

#### TypeScript/JavaScript

- Use ESLint and Prettier configurations
- Prefer `const` over `let`, avoid `var`
- Use TypeScript strict mode
- Document public APIs with JSDoc

#### Python

- Follow PEP 8 style guidelines
- Use Black for code formatting
- Use type hints for function signatures
- Write docstrings for modules, classes, and functions

#### Dart/Flutter

- Follow official Dart style guidelines
- Use `flutter format` for formatting
- Organize imports: dart, flutter, package, relative
- Use meaningful widget names

#### Java

- Follow Google Java Style Guide
- Use descriptive class and method names
- Implement proper error handling
- Use appropriate design patterns

#### C++

- Follow Google C++ Style Guide
- Use RAII principles
- Prefer smart pointers over raw pointers
- Include appropriate headers

### File Naming Conventions

- TypeScript/JavaScript: `kebab-case.ts`, `PascalCase.tsx` for components
- Python: `snake_case.py`
- Dart: `snake_case.dart`
- Java: `PascalCase.java`
- C++: `snake_case.cpp`, `snake_case.h`

## Testing

### Test Requirements

- Unit tests for all business logic
- Integration tests for API endpoints
- Widget tests for Flutter components
- End-to-end tests for critical user flows

### Running Tests

```bash
# Backend tests
cd src/backend
npm test

# Python tests
pytest tests/

# Flutter tests
cd src/mobile
flutter test

# All tests
./scripts/test-all.sh
```

### Test Coverage

- Maintain >80% code coverage
- Focus on testing business logic and edge cases
- Mock external dependencies appropriately

## Documentation

### Required Documentation

- README updates for new features
- API documentation for new endpoints
- Inline code comments for complex logic
- Architecture decision records (ADRs) for significant changes

### Documentation Standards

- Use Markdown for documentation
- Include code examples where appropriate
- Keep documentation up-to-date with code changes
- Use clear and concise language

## Security Considerations

- Never commit secrets or API keys
- Follow secure coding practices
- Report security vulnerabilities responsibly
- Review code for potential security issues

## Performance Guidelines

- Profile code changes for performance impact
- Optimize database queries
- Minimize network requests
- Use appropriate caching strategies

## Accessibility

- Follow WCAG 2.1 AA guidelines
- Test with screen readers
- Ensure proper color contrast
- Provide alternative text for images

## Getting Help

- Join our Discord server for real-time help
- Check existing issues and discussions
- Review documentation and examples
- Reach out to maintainers for guidance

## Recognition

Contributors will be recognized in:
- CONTRIBUTORS.md file
- Release notes for significant contributions
- Annual contributor appreciation posts

Thank you for contributing to QuizRally!
