import { composePlugins, withNx, withReact } from '@nx/rspack';
import { withModuleFederation } from '@nx/rspack/module-federation';
import type { Configuration } from '@rspack/core';
import { config as baseConfig } from './module-federation.config';

export default composePlugins(
  withNx(),
  withReact(),
  withModuleFederation({ ...baseConfig }, { dts: false }),
  (config: Configuration) => {
    config.module = config.module ?? {};
    config.module.rules = config.module.rules ?? [];
    config.module.rules.push({
      include: /@open-file-viewer/,
      resolve: { fullySpecified: false },
    });
    return config;
  },
);
