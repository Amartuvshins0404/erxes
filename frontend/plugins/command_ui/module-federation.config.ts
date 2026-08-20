import { ModuleFederationConfig } from '@nx/rspack/module-federation';

const coreLibraries = new Set([
  'react',
  'react-dom',
  'react-router',
  'react-router-dom',
  'erxes-ui',
  'jotai',
  'ui-modules',
  'react-i18next',
]);

const config: ModuleFederationConfig = {
  name: 'command_ui',
  exposes: {
    './config': './src/config.tsx',
    './command': './src/modules/CommandMain.tsx',
  },
  shared: (libraryName, defaultConfig) =>
    coreLibraries.has(libraryName) ? defaultConfig : false,
};

export default config;
