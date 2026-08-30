// Default export required by Jest - do not remove
export default {
  displayName: 'erxes-agent-api',
  preset: '../../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    // Transpile-only: types are enforced by the plugin tsconfig via
    // `npx tsc --project tsconfig.json --noEmit`, not by ts-jest here.
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
    '^@/(.*)$': '<rootDir>/src/modules/$1',
    '^erxes-api-shared/(.*)$': '<rootDir>/../../erxes-api-shared/src/$1',
  },
  testMatch: ['<rootDir>/src/**/__tests__/**/*.test.ts'],
  coverageDirectory: '../../../coverage/backend/plugins/erxes-agent_api',
  modulePathIgnorePatterns: ['<rootDir>/dist/'],
};
