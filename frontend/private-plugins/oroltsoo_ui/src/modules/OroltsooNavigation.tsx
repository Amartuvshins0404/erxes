import {
  IconUsersGroup,
  IconUserStar,
  IconWriting,
} from '@tabler/icons-react';
import { NavigationMenuLinkItem } from 'erxes-ui';

export const OroltsooNavigation = () => (
  <>
    <NavigationMenuLinkItem
      name="Миний профайл"
      icon={IconUserStar}
      path="oroltsoo/profile"
    />
    <NavigationMenuLinkItem
      name="Постууд"
      icon={IconWriting}
      path="oroltsoo/posts"
    />
    <NavigationMenuLinkItem
      name="Уулзалтын хуваарь"
      icon={IconUsersGroup}
      path="oroltsoo/meetings"
    />
  </>
);
