export default {
  // Test environment
  testEnvironment: 'jsdom',
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/enzyme.setup.js'],
  
  // Test file patterns
  testMatch: [
    '<rootDir>/tests/enzyme-components/**/*.test.{js,jsx,ts,tsx}',
    '<rootDir>/tests/**/*.enzyme.test.{js,jsx,ts,tsx}'
  ],
  
  // Module name mapping for path aliases
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/client/src/$1',
    '^@shared/(.*)$': '<rootDir>/shared/$1',
    '^@assets/(.*)$': '<rootDir>/attached_assets/$1',
  },
  
  // Transform files
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      useESM: true,
      tsconfig: {
        jsx: 'react-jsx',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
      }
    }],
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  
  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  
  // Ignore patterns
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/dist/',
    '<rootDir>/build/',
  ],
  
  // Coverage configuration
  collectCoverageFrom: [
    'client/src/components/**/*.{ts,tsx}',
    'client/src/contexts/**/*.{ts,tsx}',
    'client/src/hooks/**/*.{ts,tsx}',
    'client/src/lib/**/*.{ts,tsx}',
    'client/src/pages/**/*.{ts,tsx}',
    'client/src/stores/**/*.{ts,tsx}',
    '!client/src/**/*.d.ts',
    '!client/src/**/index.{ts,tsx}',
  ],
  
  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  
  // Coverage reporters
  coverageReporters: ['text', 'lcov', 'html'],
  
  // Mock patterns
  modulePathIgnorePatterns: ['<rootDir>/dist/'],
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Verbose output
  verbose: true,
  
  // Handle static assets - merged with existing moduleNameMapping
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/client/src/$1',
    '^@shared/(.*)$': '<rootDir>/shared/$1',
    '^@assets/(.*)$': '<rootDir>/attached_assets/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': 'jest-transform-stub',
  },
  
  // ESM support
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  
  // Globals
  globals: {
    'ts-jest': {
      useESM: true,
    },
  },
};