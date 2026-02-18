/** @type {import('jest').Config} */
export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'jsdom',
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^nanoid$': '<rootDir>/node_modules/nanoid/index.cjs',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
      },
    ],
  },
  transformIgnorePatterns: ['node_modules/(?!(@revisium/schema-toolkit)/)'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testMatch: ['**/__tests__/**/*.spec.ts', '**/__tests__/**/*.spec.tsx', '**/?(*.)+(spec|test).ts', '**/?(*.)+(spec|test).tsx'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.tsx',
    '!src/**/*.spec.ts',
    '!src/**/*.spec.tsx',
    '!src/**/*.test.ts',
    '!src/**/*.test.tsx',
    '!src/**/index.ts',
    '!src/schema-editor/vm/**',
    '!src/schema-editor/ui/**',
  ],
  coverageDirectory: 'coverage/jest',
  coverageReporters: ['text', 'lcov', 'html'],
};
