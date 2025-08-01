# Spotify Integration Patterns

## Authentication Flow

### OAuth Implementation
- Use Authorization Code flow as primary method
- Implement Implicit Grant as fallback for client-side limitations
- Store state parameter for security validation
- Handle both cookie and localStorage for token persistence

### Token Management
- Check token expiration before API calls
- Implement background refresh when token near expiry
- Provide user notifications for re-authentication needs
- Clear all auth data on logout

### Error Handling
- Handle state mismatch errors gracefully
- Provide fallback authentication methods
- Show user-friendly error messages
- Log detailed errors for debugging

## API Integration

### Request Patterns
- Always check token validity before API calls
- Include proper error handling for rate limits
- Use consistent response format across API calls
- Implement retry logic for transient failures

### Data Handling
- Validate API responses before using data
- Transform API data to internal models
- Cache frequently accessed data appropriately
- Handle partial data scenarios

## Configuration Management

### Environment Setup
- Keep sensitive config in separate files
- Use clear variable names: `clientId`, `redirectUri`
- Document required configuration steps
- Provide example configurations

### Deployment Considerations
- Support both local development and production URLs
- Handle different redirect URI patterns
- Provide clear setup instructions
- Test configuration validation

## User Experience

### Authentication UX
- Show clear login prompts
- Handle authentication errors gracefully
- Provide re-authentication options
- Maintain user context during auth flows

### API Loading States
- Show loading indicators for API calls
- Handle slow network conditions
- Provide retry options for failed requests
- Cache data to reduce API calls

## Security Best Practices

### Token Security
- Never log access tokens
- Use secure storage when available
- Implement proper token cleanup
- Validate all authentication state

### API Security
- Validate all user inputs before API calls
- Sanitize data from API responses
- Use HTTPS for all API communications
- Implement proper CORS handling