/* eslint-disable */
export default {
  displayName: 'erxes-api-shared',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    // isolatedModules = transpile-only; types are enforced by `pnpm build` (tsc).
    '^.+\\.[tj]s$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
        isolatedModules: true,
        diagnostics: false,
      },
    ],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  testMatch: ['<rootDir>/src/**/*.test.ts'],
  coverageDirectory: '../../coverage/backend/erxes-api-shared',
};
