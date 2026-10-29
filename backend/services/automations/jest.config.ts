export default {
  displayName: 'automations-service',
  preset: '../../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
        diagnostics: false,
      },
    ],
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
  moduleNameMapper: {
    '^~/(.*)$': '<rootDir>/src/$1',
    '^@/(.*)$': '<rootDir>/src/$1',
    '^erxes-api-shared/(.*)$': '<rootDir>/../../erxes-api-shared/src/$1',
  },
  testMatch: ['<rootDir>/src/**/*.test.ts'],
  forceExit: true,
  coverageDirectory: '../../../coverage/backend/services/automations',
  modulePathIgnorePatterns: ['<rootDir>/dist/'],
};
