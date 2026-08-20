import { IconTerminal2 } from '@tabler/icons-react';
import type { IUIConfig } from 'erxes-ui';

export const CONFIG: IUIConfig = {
  name: 'command',
  path: 'command',
  navigationGroup: {
    name: 'command',
    defaultPath: 'command',
    icon: IconTerminal2,
    content: () => null,
  },
  modules: [
    {
      name: 'command',
      icon: IconTerminal2,
      path: 'command',
    },
  ],
};
