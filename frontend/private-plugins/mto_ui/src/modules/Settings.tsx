import { useState, useEffect } from 'react';
import { useAtomValue } from 'jotai';
import { IconActivity } from '@tabler/icons-react';
import { Button, Input, PageContainer, Sidebar } from 'erxes-ui';
import { Link, useLocation } from 'react-router-dom';
import {
  currentOrganizationState,
  SettingsHeader,
} from 'ui-modules';
import { PaymentSelection } from '@/config/components/PaymentSelection';
import { useInstanceIdConfig } from '@/config/hooks/useInstanceIdConfig';
import { useMtoSuggestedInstanceId } from '@/config/hooks/useMtoSuggestedInstanceId';

const MtoSettingsSidebar = () => {
  const { pathname } = useLocation();
  return (
    <Sidebar collapsible="none" className="border-r flex-none">
      <Sidebar.Group>
        <Sidebar.GroupContent>
          <Sidebar.Menu>
            <Sidebar.MenuItem>
              <Sidebar.MenuButton
                isActive={pathname === '/settings/mto'}
                asChild
              >
                <Link to="/settings/mto">General</Link>
              </Sidebar.MenuButton>
            </Sidebar.MenuItem>
          </Sidebar.Menu>
        </Sidebar.GroupContent>
      </Sidebar.Group>
    </Sidebar>
  );
};

const MtoSettings = () => {
  const organization = useAtomValue(currentOrganizationState);
  const isSaas = organization?.type === 'saas';
  const {
    instanceId: savedInstanceId,
    loading: configLoading,
    error: configError,
    updateInstanceId,
    updateLoading,
  } = useInstanceIdConfig();
  const { suggestedInstanceId, loading: suggestedLoading } =
    useMtoSuggestedInstanceId();
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    if (isSaas && suggestedInstanceId) {
      setInputValue(suggestedInstanceId);
    } else {
      setInputValue(savedInstanceId);
    }
  }, [savedInstanceId, isSaas, suggestedInstanceId]);

  const handleSave = () => {
    updateInstanceId(inputValue);
  };

  const hasChange = inputValue !== savedInstanceId;
  const saasReadOnly = isSaas;

  return (
    <PageContainer>
      <SettingsHeader
        breadcrumbs={
          <Button variant="ghost" className="font-semibold" asChild>
            <Link to="/settings/mto">
              <IconActivity className="text-accent-foreground" />
              Mto
            </Link>
          </Button>
        }
      />
      <div className="flex flex-auto overflow-hidden">
        <MtoSettingsSidebar />
        <div className="flex flex-col h-full overflow-auto flex-1 p-6 gap-6">
          <div className="rounded-lg border p-6 space-y-4">
            <div>
              <h2 className="text-lg font-semibold mb-1">Instance ID</h2>
              <p className="text-sm text-muted-foreground">
                This value identifies the current Mto instance. Save it here to
                use it as the instance ID for this deployment (e.g. in slave
                mode).
              </p>
            </div>

            {configLoading ? (
              <div className="text-sm text-muted-foreground">
                Loading instance ID...
              </div>
            ) : configError ? (
              <div className="text-sm text-destructive">
                Failed to load instance ID
              </div>
            ) : (
              <div className="space-y-3">
                {isSaas && (
                  <p className="text-sm text-muted-foreground">
                    In SAAS mode, the Instance ID is your organization ID and
                    cannot be changed.
                  </p>
                )}
                <Input
                  type="text"
                  value={inputValue}
                  onChange={(e) =>
                    !saasReadOnly && setInputValue(e.target.value)
                  }
                  placeholder={
                    isSaas && !suggestedInstanceId
                      ? 'Loading organization ID...'
                      : 'Enter instance ID'
                  }
                  className="w-full"
                  readOnly={saasReadOnly}
                  disabled={saasReadOnly}
                />
                <div className="flex justify-end">
                  <Button
                    onClick={handleSave}
                    disabled={
                      updateLoading ||
                      !hasChange ||
                      (isSaas && (suggestedLoading || !suggestedInstanceId))
                    }
                  >
                    {updateLoading ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-lg border">
            <PaymentSelection />
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default MtoSettings;
