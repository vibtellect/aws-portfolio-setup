module.exports = {
  // Use ts-jest for TypeScript support
  preset: 'ts-jest',
  testEnvironment: 'node',

  // Test Match Patterns
  testMatch: [
    '**/test/**/*.test.ts',
    '**/__tests__/**/*.test.ts',
  ],

  // Coverage Configuration
  collectCoverageFrom: [
    '**/src/**/*.ts',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/examples/**',
    '!**/*.d.ts',
  ],

  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },

  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],

  // Module Resolution
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

  // Transform Configuration
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        // Override some tsconfig settings for faster tests
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
      },
    }],
  },

  // TDD-friendly settings
  verbose: true,
  silent: false,
  detectOpenHandles: true,
  forceExit: false,

  // Watch mode settings (für TDD)
  watchPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/coverage/',
  ],

  // Performance
  maxWorkers: '50%',

  // Clear mocks automatically
  clearMocks: true,
  resetMocks: false,
  restoreMocks: true,

  // Globals (CDK specific)
  globals: {
    'ts-jest': {
      isolatedModules: true, // Faster compilation
    },
  },

  // Setup files
  // setupFilesAfterEnv: ['<rootDir>/test-setup.js'],

  // Display individual test results
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: 'coverage',
      outputName: 'junit.xml',
      classNameTemplate: '{classname}',
      titleTemplate: '{title}',
      ancestorSeparator: ' › ',
      usePathForSuiteName: true,
    }],
  ],
};
