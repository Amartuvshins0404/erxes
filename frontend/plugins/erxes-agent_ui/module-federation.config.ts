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
    // Expose keys loaded by the host via `${plugin.name}_ui` must use the
    // underscored remote name (see config.tsx `name`).
    './erxes_agent': './src/modules/ErxesAgentMain.tsx',
    // The host's settings router resolves `${CONFIG.name}_ui/erxes_agentSettings`
    // and mounts it under `/settings/erxes-agent/*`.
    './erxes_agentSettings': './src/modules/ErxesAgentSettings.tsx',
    './floatingWidget': './src/widgets/FloatingWidget.tsx',
  },

  shared: (libraryName, defaultConfig) => {
    if (coreLibraries.has(libraryName)) {
      return defaultConfig;
    }

    // Returning false means the library is not shared.
    return false;
  },
};

// Default export required by Nx/Rspack tooling - do not remove
export default config;
