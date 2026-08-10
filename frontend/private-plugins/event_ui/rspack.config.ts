import { composePlugins, withNx, withReact } from '@nx/rspack';
import { withModuleFederation } from '@nx/rspack/module-federation';
import { DefinePlugin } from '@rspack/core';

import baseConfig from './module-federation.config';

const config = {
  ...baseConfig,
};

export default composePlugins(
  withNx(),
  withReact(),
  withModuleFederation(config, { dts: false }),
  (rspackConfig: any) => {
    // The Google Maps key is read through `process.env` in erxes-ui's config.
    // core-ui defines it for its own bundle, but a remote is built separately —
    // without this the venue picker resolves the key as undefined.
    rspackConfig.plugins?.push(
      new DefinePlugin({
        'process.env.REACT_APP_GOOGLE_MAP_API_KEY': JSON.stringify(
          process.env.REACT_APP_GOOGLE_MAP_API_KEY,
        ),
      }),
    );

    return rspackConfig;
  },
);
