import { BtkCompanyInfo } from './btk/components/BtkCompanyInfo';
import { BtkSettingsSidebar } from './btk/components/BtkSettingsSidebar';
import { IconStackFilled } from '@tabler/icons-react';
import { Button, PageContainer } from 'erxes-ui';
import { Link } from 'react-router-dom';
import { SettingsHeader } from 'ui-modules';

export default function Settings() {
  return (
    <PageContainer>
      <SettingsHeader breadcrumbs={<BtkSettingsBreadcrumb />}></SettingsHeader>
      <div className="flex flex-auto overflow-hidden">
        <BtkSettingsSidebar />
        <div className="flex flex-col h-full overflow-auto flex-1">
          <BtkCompanyInfo />
        </div>
      </div>
    </PageContainer>
  );
}

function BtkSettingsBreadcrumb() {
  return (
    <Button variant="ghost" className="font-semibold" asChild>
      <Link to="/settings/btk">
        <IconStackFilled className="text-accent-foreground" />
        Btk Admin
      </Link>
    </Button>
  );
}
