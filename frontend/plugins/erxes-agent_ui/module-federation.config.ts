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

export const config: ModuleFederationConfig = {
  name: 'erxes-agent_ui',
  exposes: {
    './config': './src/config.tsx',
    './erxes_agent': './src/modules/MastraMain.tsx',
    './erxes_agentSettings': './src/modules/MastraSettings.tsx',
    './widgets': './src/widgets/Widgets.tsx',
    './automationsWidget':
      './src/widgets/automations/components/AutomationRemoteEntry.tsx',
  },
  // Keep both router packages in the host's singleton context. Use explicit
  // configs because this pnpm graph stores version-qualified external-node
  // names, which makes Nx's string-form additionalShared lookup fail.
  additionalShared: [
    [
      'react-router',
      { singleton: true, strictVersion: false, requiredVersion: false },
    ],
    [
      'react-router-dom',
      { singleton: true, strictVersion: false, requiredVersion: false },
    ],
  ],
  shared: (libraryName, defaultConfig) => {
    if (coreLibraries.has(libraryName)) {
      return defaultConfig;
    }
    return false;
  },
};

export default config;
