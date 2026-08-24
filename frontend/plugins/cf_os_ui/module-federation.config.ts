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
  name: 'cf_os_ui',
  exposes: {
    './config': './src/config.tsx',
    './cf_os': './src/modules/CfOsMain.tsx',
  },
  shared: (libraryName, defaultConfig) =>
    coreLibraries.has(libraryName) ? defaultConfig : false,
};

export default config;
