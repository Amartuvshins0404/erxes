import { IconCalendarEvent } from '@tabler/icons-react';
import { IUIConfig } from 'erxes-ui';
import { MainNavigation } from '~/modules/MainNavigation';

export const CONFIG: IUIConfig = {
  name: 'event',
  path: 'event',
  icon: IconCalendarEvent,
  navigationGroup: {
    name: 'event',
    icon: IconCalendarEvent,
    content: () => <MainNavigation />,
  },
  modules: [
    {
      name: 'event',
      icon: IconCalendarEvent,
      path: 'event',
    },
  ],
};
