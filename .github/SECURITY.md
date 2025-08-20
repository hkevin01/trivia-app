# Security Policy

## Supported Versions

We release patches for security vulnerabilities in the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

The QuizRally team takes security bugs seriously. We appreciate your efforts to responsibly disclose your findings, and will make every effort to acknowledge your contributions.

### How to Report a Security Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report them via one of the following methods:

1. **Email**: Send an email to security@quizrally.app with details about the vulnerability
2. **GitHub Security Advisory**: Use the [GitHub Security Advisory](https://github.com/your-repo/trivia-app/security/advisories/new) feature

### What to Include

When reporting a vulnerability, please include:

- Type of issue (e.g. buffer overflow, SQL injection, cross-site scripting, etc.)
- Full paths of source file(s) related to the manifestation of the issue
- The location of the affected source code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit the issue

### Response Timeline

- **Initial Response**: We will acknowledge receipt of your vulnerability report within 48 hours
- **Status Updates**: We will send you regular updates about our progress every 5 business days
- **Disclosure**: We aim to resolve critical vulnerabilities within 90 days

### Preferred Languages

We prefer all communications to be in English.

### Safe Harbor

We support safe harbor for security researchers who:

- Make a good faith effort to avoid privacy violations, destruction of data, and interruption or degradation of our services
- Only interact with accounts you own or with explicit permission of the account holder
- Do not access a system or service beyond what is necessary to demonstrate a vulnerability
- Report vulnerabilities as soon as reasonably possible
- Do not intentionally harm our users or our systems

## Bug Bounty Program

Currently, we do not offer a paid bug bounty program. However, we will publicly acknowledge researchers who responsibly disclose vulnerabilities to us (unless they prefer to remain anonymous).

## Security Features

### Anti-Cheat Measures
- Real-time monitoring of app state changes
- Device fingerprinting and integrity checks
- Human verification challenges
- Rate limiting and behavioral analysis

### Data Protection
- End-to-end encryption for sensitive communications
- Secure token-based authentication
- Input validation and sanitization
- SQL injection protection

### Infrastructure Security
- Container security scanning
- Dependency vulnerability monitoring
- Regular security audits
- Secure CI/CD pipeline

## Contact

For any questions regarding this security policy, please contact us at security@quizrally.app.
