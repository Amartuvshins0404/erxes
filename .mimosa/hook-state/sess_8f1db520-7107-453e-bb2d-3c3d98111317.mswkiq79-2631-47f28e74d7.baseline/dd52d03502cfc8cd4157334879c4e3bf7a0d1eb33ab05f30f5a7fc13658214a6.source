import { BlockDeveloperInfo } from '@/block/components/BlockDeveloperInfo';
import { BlockSettingsSidebar } from '@/block/components/BlockSettingsSidebar';
import { IconStackFilled } from '@tabler/icons-react';
import { Button, PageContainer } from 'erxes-ui';
import { Link } from 'react-router-dom';
import { SettingsHeader } from 'ui-modules';
import '../styles.css';

export default function Settings() {
  return (
    <PageContainer>
      <SettingsHeader
        breadcrumbs={<BlockSettingsBreadcrumb />}
      ></SettingsHeader>
      <div className="flex flex-auto overflow-hidden">
        <BlockSettingsSidebar />
        <div className="flex flex-col h-full overflow-auto flex-1">
          <BlockDeveloperInfo />
        </div>
      </div>
    </PageContainer>
  );
}

function BlockSettingsBreadcrumb() {
  return (
    <Button variant="ghost" className="font-semibold" asChild>
      <Link to="/settings/block">
        <IconStackFilled className="text-accent-foreground" />
        Block
      </Link>
    </Button>
  );
}
