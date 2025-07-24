# Authentication Tests

This directory contains tests for the Spotify Walk-up Music application, focusing on the authentication flow.

## Test Coverage

The tests cover the following aspects of the authentication flow:

1. **Authentication Initialization**
   - Checking authentication status from cookies
   - Falling back to localStorage if cookies are not available
   - Navigating based on authentication status

2. **Token Storage and Retrieval**
   - Storing tokens in both cookies and localStorage
   - Retrieving tokens from cookies first
   - Clearing all tokens on logout

3. **Token Refresh Mechanism**
   - Refreshing token when it is about to expire
   - Handling missing refresh token
   - Validating token expiration

## Running the Tests

To run the tests, use the following command:

```bash
npm test
```

Or to run Jest directly:

```bash
npx jest
```

## Test Structure

The tests are organized by functionality:

- `tests/js/components/auth.test.js`: Tests for the authentication component

## Mocks

The tests use Jest's mocking capabilities to mock:

- Cookie utilities (setCookie, getCookie, deleteCookie)
- Browser APIs (localStorage, document.cookie)

This allows us to test the authentication flow without relying on actual browser APIs or making real network requests.