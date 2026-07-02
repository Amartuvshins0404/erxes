/* eslint-disable */
export default {
  displayName: 'mastra-ui',
  preset: '../../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]sx?$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'html'],
  // Mirror the `~` alias (tsconfig paths) so component tests can import runtime
  // modules, not just type-only shapes.
  moduleNameMapper: {
    '^~/(.*)$': '<rootDir>/src/$1',
  },
  coverageDirectory: '../../coverage/plugins/erxes-agent_ui',
};
