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
  // Nx only calls `shared` for dependencies discovered in its project graph.
  // Force both router packages into the share scope so this remote's descendant
  // Routes consume the host Router context instead of bundling a private copy.
  additionalShared: ['react-router', 'react-router-dom'],
  shared: (libraryName, defaultConfig) => {
    if (coreLibraries.has(libraryName)) {
      return defaultConfig;
    }
    return false;
  },
};

export default config;
