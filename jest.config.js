/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testPathIgnorePatterns: ['<rootDir>/__tests__/config/*'],
  globalSetup: '<rootDir>/__tests__/config/setup.test.ts',
  globalTeardown: '<rootDir>/__tests__/config/teardown.test.ts',
  collectCoverage: true,
  coverageDirectory: 'coverage',
  collectCoverageFrom: ['src/**/*.ts', 'src/**/**/*.ts', '!src/**/*.d.ts'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
    },
    './src/index.ts': {
      statements: 100,
    },
  },
};
