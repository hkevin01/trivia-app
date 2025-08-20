# QuizRally - Cross-Platform Trivia Game

<div align="center">

![QuizRally Logo](assets/images/logo.png)

**A modern, real-time multiplayer trivia game with advanced anti-cheat features**

[![Build Status](https://github.com/your-repo/trivia-app/workflows/CI/badge.svg)](https://github.com/your-repo/trivia-app/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Flutter Version](https://img.shields.io/badge/Flutter-3.16.0-blue.svg)](https://flutter.dev/)
[![Node.js Version](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)

</div>

## 🎯 Overview

QuizRally is a comprehensive trivia game platform that supports both local Wi-Fi and internet-based multiplayer gameplay. Designed for competitive trivia environments, it features robust anti-cheat systems, real-time synchronization, and a scalable microservices architecture.

### ✨ Key Features

- **🎮 Cross-Platform Mobile App**: Native iOS and Android apps built with Flutter
- **🌐 Dual Network Modes**: Local Wi-Fi discovery and internet-based rooms
- **👥 Team-Based Gameplay**: Support for individual players or team-based competition
- **⚡ Real-Time Synchronization**: Live scoring, timers, and game state updates
- **🛡️ Advanced Anti-Cheat**: Behavioral analysis, device fingerprinting, and human verification
- **📊 Comprehensive Analytics**: Game statistics, player behavior, and performance metrics
- **🎨 Modern UI/UX**: Intuitive design with accessibility features
- **🔧 Admin Tools**: Complete moderation and management dashboard

## 🏗️ Architecture

QuizRally follows a microservices architecture with the following components:

### Backend Services
- **API Gateway**: Authentication, routing, and rate limiting
- **WebSocket Gateway**: Real-time communication and event handling
- **Question Bank**: Question management and categorization
- **Scoring Service**: Answer validation and point calculation
- **Anti-Cheat Service**: Behavioral analysis and fraud detection
- **Admin Service**: Moderation tools and analytics

### Mobile Application
- **Flutter Framework**: Cross-platform mobile development
- **Riverpod**: State management and dependency injection
- **WebSocket Client**: Real-time communication
- **Local Storage**: Offline caching and user preferences

### Infrastructure
- **PostgreSQL**: Primary database with ACID compliance
- **Redis**: Caching, session storage, and pub/sub messaging
- **Docker**: Containerized deployment
- **Nginx**: Load balancing and reverse proxy

## 🚀 Quick Start

### Prerequisites

Ensure you have the following installed:
- [Docker](https://www.docker.com/get-started) (20.10+)
- [Node.js](https://nodejs.org/) (18+)
- [Python](https://www.python.org/) (3.11+)
- [Flutter](https://flutter.dev/docs/get-started/install) (3.16+)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-repo/trivia-app.git
   cd trivia-app
   ```

2. **Run the setup script**
   ```bash
   chmod +x scripts/setup-dev.sh
   ./scripts/setup-dev.sh
   ```

3. **Start the development environment**
   ```bash
   docker-compose up -d
   ```

4. **Verify the installation**
   ```bash
   ./scripts/test-all.sh
   ```

### Development Workflow

- **Start services**: `docker-compose up`
- **Stop services**: `docker-compose down`
- **Run tests**: `./scripts/test-all.sh`
- **Build all**: `./scripts/build.sh`
- **Lint code**: `./scripts/lint-all.sh`

## 📱 Mobile App Features

### For Players
- **Quick Join**: Scan QR codes or enter room codes
- **Team Formation**: Create or join teams with friends
- **Real-Time Gameplay**: Live questions, timers, and scoring
- **Anti-Cheat Compliance**: Transparent security measures
- **Accessibility**: Screen reader support and high contrast modes

### For Hosts
- **Room Management**: Create and configure game rooms
- **Question Control**: Import questions or use built-in sets
- **Live Moderation**: Monitor players and manage game flow
- **Anti-Cheat Dashboard**: Real-time security monitoring
- **Result Export**: Share game results and statistics

## 🛡️ Security & Anti-Cheat

QuizRally implements multiple layers of security:

### Client-Side Detection
- App backgrounding and switching monitoring
- Clipboard access prevention during games
- Device integrity verification
- Behavioral pattern analysis

### Server-Side Validation
- Answer submission rate limiting
- Device fingerprinting and tracking
- Human verification challenges
- Suspicious activity scoring

### Privacy Protection
- Minimal data collection with user consent
- GDPR and CCPA compliance
- Transparent security measures
- User control over privacy settings

## 🌐 Networking

### Local Wi-Fi Mode
- **mDNS/Bonjour Discovery**: Automatic host detection
- **QR Code Fallback**: Manual room joining
- **Low Latency**: Direct local network communication

### Internet Mode
- **Global Room Discovery**: Public and private rooms
- **WebSocket Communication**: Real-time synchronization
- **Geographic Regions**: Optimized for US markets
- **Fallback Mechanisms**: Robust connection handling

## 📊 Performance

QuizRally is designed for scale:

- **Concurrent Users**: 10,000+ simultaneous players
- **Room Capacity**: 500 players per game room
- **Response Time**: <100ms API response time
- **Real-Time Latency**: <500ms WebSocket message delivery
- **Uptime**: 99.9% availability target

## 🧪 Testing

Comprehensive testing strategy:

- **Unit Tests**: Business logic and individual components
- **Integration Tests**: Service communication and workflows
- **End-to-End Tests**: Complete user journeys
- **Load Tests**: Performance under concurrent load
- **Security Tests**: Vulnerability assessments

Run all tests:
```bash
./scripts/test-all.sh
```

## 📚 Documentation

Detailed documentation is available in the `docs/` directory:

- [📋 Project Plan](docs/PROJECT_PLAN.md) - Comprehensive development roadmap
- [🏗️ Architecture Guide](docs/ARCHITECTURE.md) - System design and components
- [📖 API Documentation](docs/API.md) - REST and WebSocket API reference
- [🎮 User Guide](docs/USER_GUIDE.md) - Player and host instructions
- [🔧 Admin Guide](docs/ADMIN_GUIDE.md) - Administrative tools and procedures

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](.github/CONTRIBUTING.md) for details.

### Development Process
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the full test suite
6. Submit a pull request

### Code Standards
- Follow established coding conventions
- Write comprehensive tests
- Include documentation updates
- Ensure security best practices

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Flutter team for the excellent cross-platform framework
- PostgreSQL and Redis communities for robust data solutions
- The open-source community for inspiration and tools

## 📞 Support

For support and questions:

- 📧 **General**: Check our [User Guide](docs/USER_GUIDE.md)
- 🐛 **Bug Reports**: [Create an issue](https://github.com/your-repo/trivia-app/issues)
- 💡 **Feature Requests**: [Submit a request](https://github.com/your-repo/trivia-app/issues)
- 🔒 **Security**: Review our [Security Policy](.github/SECURITY.md)

---

<div align="center">

**Built with ❤️ for the trivia community**

</div>
