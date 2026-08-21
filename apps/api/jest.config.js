/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  // Tell ts-jest how to resolve the workspace package during tests
  moduleNameMapper: {
    '^@ai-chatbot/shared-types$':
      '<rootDir>/../../packages/shared-types/src/index.ts',
  },
};
