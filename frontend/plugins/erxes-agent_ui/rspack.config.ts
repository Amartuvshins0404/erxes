import { composePlugins, withNx, withReact } from '@nx/rspack';
import { withModuleFederation } from '@nx/rspack/module-federation';

import { config as baseConfig } from './module-federation.config';

const config = {
  ...baseConfig,
};

// Default export required by Nx/Rspack tooling - do not remove
export default composePlugins(
  withNx(),
  withReact(),
  withModuleFederation(config, { dts: false }),
  (config) => {
    config.module = config.module || {};
    config.module.rules = config.module.rules || [];
    config.module.rules.push({
      test: /\.css$/,
      use: ['postcss-loader'],
      type: 'css',
    });

    return config;
  },
);
