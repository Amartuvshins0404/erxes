import { useState } from 'react';
import {
  Button,
  isUndefinedOrNull,
  Sheet,
  Spinner,
  useQueryState,
} from 'erxes-ui';
import { IconPencil } from '@tabler/icons-react';
import { useRiskGroupDetail } from '../hooks/useRiskGroups';
import { RiskGroupForm } from './RiskGroupForms';
import { useRiskGroupsUpdate } from '../hooks/useRiskGroupsUpdate';

export const RiskGroupEditSheet = () => {
  const [open, setOpen] = useState(false);
  const [activeRiskGroupId] = useQueryState<string | null>('activeRiskGroupId');

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <Sheet.Trigger asChild>
        <Button>
          <IconPencil />
          Edit
        </Button>
      </Sheet.Trigger>
      <Sheet.View className="p-0 sm:max-w-5xl">
        <Sheet.Header>
          <Sheet.Title>Edit risk group</Sheet.Title>
          <Sheet.Close />
        </Sheet.Header>
        {activeRiskGroupId && (
          <RiskGroupEdit id={activeRiskGroupId} setOpen={setOpen} />
        )}
      </Sheet.View>
    </Sheet>
  );
};

export const RiskGroupEdit = ({
  id,
  setOpen,
}: {
  id: string;
  setOpen: (open: boolean) => void;
}) => {
  const { riskGroupDetail, loading } = useRiskGroupDetail({ id });
  const { updateRiskGroup, loading: updateLoading } = useRiskGroupsUpdate({ id });

  if (loading) return <Spinner />;

  return (
    <RiskGroupForm
      defaultValues={Object.fromEntries(
        Object.entries(riskGroupDetail || {}).map(([key, value]) => [
          key,
          isUndefinedOrNull(value) ? undefined : value,
        ]),
      )}
      onSubmit={(data) => {
        updateRiskGroup({
          variables: {
            id,
            input: data,
          },
          onCompleted: () => {
            setOpen(false);
          },
        });
      }}
      loading={updateLoading}
      isEdit={true}
    />
  );
};

