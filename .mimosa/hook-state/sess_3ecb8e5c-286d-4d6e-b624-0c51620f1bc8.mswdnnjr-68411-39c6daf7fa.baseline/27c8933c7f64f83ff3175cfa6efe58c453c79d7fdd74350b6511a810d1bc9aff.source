import { useState, useEffect } from 'react';
import { useAtomValue } from 'jotai';
import { currentOrganizationState } from 'ui-modules';
import { PaymentSelection } from '@/config/components/PaymentSelection';
import { useInstanceIdConfig } from '@/config/hooks/useInstanceIdConfig';
import { useOneFitSuggestedInstanceId } from '@/config/hooks/useOneFitSuggestedInstanceId';
import { Button, Input } from 'erxes-ui';

const OneFitSettings = () => {
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
    useOneFitSuggestedInstanceId();
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
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">OneFit Settings</h1>
        <p className="text-sm text-gray-600 mt-1">
          Configure OneFit system settings
        </p>
      </div>

      <div className="space-y-4">
        <div className="bg-white rounded-lg border shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-2">Instance ID</h2>
          <p className="text-sm text-gray-600 mb-4">
            This value identifies the current OneFit instance. Save it here to
            use it as the instance ID for this deployment (e.g. in slave mode).
          </p>

          {configLoading ? (
            <div className="text-sm text-gray-500">Loading instance ID...</div>
          ) : configError ? (
            <div className="text-sm text-red-500">
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
              <div className="flex gap-2">
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
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={handleSave}
                  disabled={
                    updateLoading ||
                    !hasChange ||
                    (isSaas && (suggestedLoading || !suggestedInstanceId))
                  }
                  variant="default"
                >
                  {updateLoading ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg border shadow-sm">
          <PaymentSelection />
        </div>
      </div>
    </div>
  );
};

export default OneFitSettings;
