# QuizRally Development Prompts

This document contains custom prompts and guidelines specifically for the QuizRally trivia app development.

## Code Generation Prompts

### Backend Development
```
When creating backend services for QuizRally:
- Use microservices architecture with Docker containers
- Implement proper error handling and logging
- Include WebSocket support for real-time features
- Add comprehensive input validation
- Implement rate limiting and security measures
- Follow RESTful API conventions
- Include health check endpoints
- Use dependency injection patterns
```

### Mobile Development
```
When creating Flutter mobile app features:
- Use Riverpod for state management
- Implement proper lifecycle management
- Add offline support where applicable
- Include accessibility features
- Follow Material Design guidelines
- Implement proper error handling and user feedback
- Add comprehensive widget tests
- Use responsive design patterns
```

### Anti-Cheat System
```
When working on anti-cheat features:
- Implement client-side detection without compromising user privacy
- Use behavioral analysis for bot detection
- Add device fingerprinting with user consent
- Implement secure challenge-response mechanisms
- Log suspicious activities for analysis
- Balance security with user experience
- Follow privacy regulations (GDPR, CCPA)
```

### Real-Time Features
```
When implementing real-time functionality:
- Use WebSocket connections with proper reconnection logic
- Implement message queuing for reliability
- Add conflict resolution for concurrent updates
- Use optimistic UI updates where appropriate
- Implement proper timeout handling
- Add connection quality indicators
- Scale horizontally with Redis pub/sub
```

## Testing Prompts

### Unit Testing
```
Create comprehensive unit tests that:
- Test all business logic paths
- Include edge cases and error scenarios
- Mock external dependencies properly
- Achieve >80% code coverage
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)
```

### Integration Testing
```
Design integration tests that:
- Test API endpoints with real database
- Verify WebSocket message handling
- Test service-to-service communication
- Include authentication flows
- Test error handling across services
- Verify data consistency
```

### Load Testing
```
Create load tests that simulate:
- 500 concurrent players per game room
- Multiple game rooms simultaneously
- WebSocket connection stress testing
- Database query performance under load
- Anti-cheat system performance impact
```

## Security Prompts

### Authentication & Authorization
```
Implement secure authentication that:
- Uses JWT tokens with proper expiration
- Includes refresh token rotation
- Implements rate limiting
- Adds device fingerprinting
- Supports 2FA for hosts
- Logs security events
```

### Data Protection
```
Ensure data protection by:
- Encrypting sensitive data at rest
- Using HTTPS/TLS for all communications
- Implementing proper input sanitization
- Following OWASP security guidelines
- Adding SQL injection protection
- Implementing CSRF protection
```

## Performance Prompts

### Database Optimization
```
Optimize database performance by:
- Using proper indexing strategies
- Implementing connection pooling
- Adding query optimization
- Using read replicas for scaling
- Implementing caching layers
- Monitoring query performance
```

### Mobile Performance
```
Optimize mobile app performance by:
- Minimizing memory usage
- Implementing efficient UI rendering
- Using lazy loading for large lists
- Optimizing image loading and caching
- Implementing background processing
- Monitoring performance metrics
```

## Documentation Prompts

### API Documentation
```
Create comprehensive API documentation that includes:
- OpenAPI/Swagger specifications
- Request/response examples
- Error code descriptions
- Rate limiting information
- Authentication requirements
- WebSocket event schemas
```

### Code Documentation
```
Add code documentation that:
- Explains complex business logic
- Documents public API interfaces
- Includes usage examples
- Describes security considerations
- Documents performance implications
- Explains architectural decisions
```

## Architecture Prompts

### Microservices Design
```
Design microservices that:
- Have single responsibilities
- Communicate via well-defined APIs
- Include health check endpoints
- Can be deployed independently
- Have proper error boundaries
- Include monitoring and logging
```

### Event-Driven Architecture
```
Implement event-driven patterns that:
- Use domain events for communication
- Implement proper event sourcing
- Add event replay capabilities
- Include dead letter queues
- Implement idempotent event handlers
- Add event versioning support
```
