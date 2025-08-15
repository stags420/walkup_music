export default {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/test/unit/setupTests.ts'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  globals: {
    'ts-jest': {
      tsconfig: {
        sourceMap: true,
        inlineSources: true,
        inlineSourceMap: true,
      },
      isolatedModules: true,
      diagnostics: false,
      useESM: true,
    },
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  testMatch: [
    '<rootDir>/test/unit/**/*.test.(ts|tsx|js)',
    '<rootDir>/test/unit/**/*.spec.(ts|tsx|js)',
  ],
  testPathIgnorePatterns: ['<rootDir>/test/e2e/'],
  collectCoverageFrom: [
    'src/**/*.(ts|tsx)',
    '!src/**/*.d.ts',
    '!src/main.tsx',
    '!src/vite-env.d.ts',
  ],
  testEnvironmentOptions: {
    customExportConditions: [''],
  },
  // Unit coverage with V8 provider; Monocart will generate the report
  collectCoverage: process.env.VITE_ENABLE_COVERAGE === 'true',
  coverageProvider: 'v8',
  coverageDirectory: 'test/reports/unit/coverage/dumps/',
  coverageReporters: ['json'],
  reporters: [
    'default',
    [
      'jest-html-reporter',
      {
        pageTitle: 'Unit Test Report',
        outputPath: 'test/reports/unit/report/index.html',
        includeFailureMsg: true,
        includeSuiteFailure: true,
        useCssFile: false,
      },
    ],
    [
      'jest-monocart-coverage',
      {
        name: 'Unit Coverage',
        outputDir: 'test/reports/unit/coverage/report',
        baseDir: '.',
        reports: ['v8', 'console-summary'],
        filter: '**/src/**/*.{ts,tsx,js,jsx}',
      },
    ],
  ],
};
