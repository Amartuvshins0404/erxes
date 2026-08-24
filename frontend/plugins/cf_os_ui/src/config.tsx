import { IconTerminal2 } from '@tabler/icons-react';
import type { IUIConfig } from 'erxes-ui';

// The MF container name must use underscores (Nx convention); permissionName
// falls back to it for checks, and `navigationGroup.name` sets the visible
// sidebar label.
export const CONFIG: IUIConfig = {
  name: 'cf_os',
  permissionName: 'cf-os',
  path: 'cf-os',
  navigationGroup: {
    name: 'command',
    defaultPath: 'cf-os',
    icon: IconTerminal2,
    content: () => null,
  },
  modules: [
    {
      name: 'command',
      icon: IconTerminal2,
      path: 'cf-os',
    },
  ],
};
