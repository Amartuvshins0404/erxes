import { BLOCK_FORMS } from '@/form/constants/blockForms';
import { IconColumns } from '@tabler/icons-react';
import { NavigationMenuGroup, NavigationMenuLinkItem } from 'erxes-ui';
import { useLocation } from 'react-router-dom';

export const FormNavigation = () => {
  const location = useLocation();

  const isOnFormRoute = location.pathname.startsWith('/blockadmin/form');

  if (!isOnFormRoute) return null;

  const forms = Object.keys(BLOCK_FORMS);

  return (
    <NavigationMenuGroup name="Submissions">
      {forms.map((form: string, index: number) => (
        <NavigationMenuLinkItem
          key={form}
          name={BLOCK_FORMS[index + 1].title}
          icon={IconColumns}
          path={`/blockadmin/form/submissions/${form}`}
        />
      ))}
    </NavigationMenuGroup>
  );
};
