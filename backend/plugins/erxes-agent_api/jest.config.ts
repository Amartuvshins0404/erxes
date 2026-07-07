/* eslint-disable */
export default {
  displayName: 'mastra-api',
  preset: '../../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    // isolatedModules = transpile-only: ts-jest's full per-worker type program
    // OOMs (2GB heap) on files whose import graph reaches @mastra/core +
    // connectionResolvers. Types are enforced by `pnpm build` (tsc), not here.
    '^.+\\.[tj]s$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
        isolatedModules: true,
        diagnostics: false,
      },
    ],
  },
  // Transpile three deps that Jest's CommonJS loader can't take as-shipped:
  //  - yoga-wasm-web is ESM-only (Satori's layout engine); ts-jest -> CJS.
  //  - yoga-layout ships raw TS/ESM sources (@react-pdf/layout's engine).
  //  - pptxgenjs is CJS but uses `import('node:fs')`; transpiling downlevels
  //    that dynamic import to require() so the deck write works without the
  //    --experimental-vm-modules flag. All run natively in the prod build.
  transformIgnorePatterns: [
    '/node_modules/\\.pnpm/(?!(yoga-wasm-web|yoga-layout|pptxgenjs)@)',
  ],
  moduleFileExtensions: ['ts', 'js', 'html'],
  moduleNameMapper: {
    '^~/(.*)$': '<rootDir>/src/$1',
    '^@/(.*)$': '<rootDir>/src/modules/$1',
  },
  testMatch: ['<rootDir>/src/**/*.test.ts'],
  coverageDirectory: '../../../coverage/backend/plugins/erxes-agent_api',
};
