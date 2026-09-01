import { composePlugins, withNx, withReact } from '@nx/rspack';
import { withModuleFederation } from '@nx/rspack/module-federation';
import { DefinePlugin } from '@rspack/core';

import baseConfig from './module-federation.config';

export default composePlugins(
  withNx(),
  withReact(),
  withModuleFederation(baseConfig, { dts: false }),
  (rspackConfig) => {
    rspackConfig.plugins?.push(
      new DefinePlugin({
        'process.env.CF_OS_URL': JSON.stringify(process.env.CF_OS_URL),
      }),
    );

    return rspackConfig;
  },
);
