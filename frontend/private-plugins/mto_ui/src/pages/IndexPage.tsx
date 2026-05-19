import {
  IconTags,
  IconClipboardList,
  IconForms,
} from '@tabler/icons-react';
import { Button } from 'erxes-ui';
import { Link } from 'react-router-dom';
import { MtoPageLayout } from '~/components/MtoPageLayout';
import { useMtoMode } from '~/modules/config/hooks/useMtoMode';

export function IndexPage() {
  const { isSlaveMode } = useMtoMode();

  return (
    <MtoPageLayout pageName="">
      <div className="flex h-full overflow-hidden">
        <div className="flex flex-col h-full overflow-hidden flex-auto p-6">
          <div className="flex flex-col gap-4">
            <h1 className="text-2xl font-bold">Mto</h1>
            <div className="flex flex-wrap gap-4">
<Button asChild>
                <Link to="/mto/registration">
                  <IconClipboardList />
                  Registration
                </Link>
              </Button>
              {!isSlaveMode && (
                <Button asChild>
                  <Link to="/mto/fillform">
                    <IconForms />
                    FillForm
                  </Link>
                </Button>
              )}
              {!isSlaveMode && (
                <Button asChild>
                  <Link to="/mto/categories">
                    <IconTags />
                    Categories
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </MtoPageLayout>
  );
}
