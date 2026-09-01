import { IconShieldCheck, IconWriting } from '@tabler/icons-react';
import { NavigationMenuLinkItem } from 'erxes-ui';

export const OroltsooAdminNavigation = () => (
  <>
    <NavigationMenuLinkItem
      name="Улс төрчид"
      icon={IconShieldCheck}
      path="oroltsooadmin/profiles"
    />
    <NavigationMenuLinkItem
      name="Постууд"
      icon={IconWriting}
      path="oroltsooadmin/posts"
    />
  </>
);
