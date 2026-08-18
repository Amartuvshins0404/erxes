import { ModuleFederationConfig } from '@nx/rspack/module-federation';

const coreLibraries = new Set([
  'react',
  'react-dom',
  'react-router',
  'react-router-dom',
  'erxes-ui',
  '@apollo/client',
  'jotai',
  'ui-modules',
  'react-i18next',
]);

const config: ModuleFederationConfig = {
  name: 'block_ui',
  exposes: {
    './config': './src/config.tsx',
    './block': './src/modules/Main.tsx',
    './blockSettings': './src/modules/Settings.tsx',
    './widgets': './src/widgets/Widgets.tsx',
    './floatingWidget': './src/widgets/FloatingWidget.tsx',
    './relationWidget': './src/widgets/relation/RelationWidgets.tsx',
  },

  shared: (libraryName, defaultConfig) => {
    if (coreLibraries.has(libraryName)) {
      return defaultConfig;
    }

    // Returning false means the library is not shared.
    return false;
  },
};

export default config;
