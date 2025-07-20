module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  moduleNameMapper: {
    '\\.(css|less)': '<rootDir>/tests/mocks/styleMock.js'
  },
  transform: {}, // No transform needed for our tests
  testMatch: ['**/tests/**/*.test.js'],
  setupFiles: ['<rootDir>/tests/setup.js'],
  transformIgnorePatterns: [
    '/node_modules/'
  ]
};