import { IconPlus } from '@tabler/icons-react';
import { Button, Sheet } from 'erxes-ui';
import { useAtom, useAtomValue } from 'jotai';
import { opptyCreateSheetState } from '@/oppty/states/opptyCreateSheetState';
import { OpptyForm } from './OpptyForms';
import { useCreateOppty } from '@/oppty/hooks/useCreateOppty';
import { TAddOppty } from '@/oppty/types/validations';
import { useParams } from 'react-router-dom';
import { currentUserState, useCreateMultipleRelations } from 'ui-modules';

export const AddOpptySheet = ({
  onComplete,
  showTrigger = true,
}: {
  onComplete?: (opptyId: string) => void;
  showTrigger?: boolean;
}) => {
  const [open, setOpen] = useAtom(opptyCreateSheetState);
  const { projectId } = useParams<{ projectId?: string }>();
  const currentUser = useAtomValue(currentUserState);
  const { createOppty, loading } = useCreateOppty();
  const { createMultipleRelations } = useCreateMultipleRelations();

  const onSubmit = (data: TAddOppty) => {
    const propertyRows = data.unitRows
      .filter((row) => row.buildingId)
      .map((row) => ({
        buildingId: row.buildingId,
        zoningId: row.zoningId || undefined,
        unitId: row.unitId || undefined,
        isMain: row.isMain || false,
      }));

    createOppty({
      variables: {
        input: {
          description: data.description,
          customerId: data.customerId,
          status: data.status,
          customerSource: data.customerSource,
          assignedUserId: data.assignedUserId,
          unitType: data.unitType || undefined,
          tenureType: data.tenureType || undefined,
          propertyRows,
          labelIds: data.labelIds,
          tagIds: data.tagIds,
          startDate: data.startDate,
          targetDate: data.targetDate,
          projectId: projectId || data.projectId,
        },
      },
      onCompleted: (result) => {
        const opptyId = result?.blockCreateOppty?._id;
        if (opptyId && data.customerId) {
          createMultipleRelations([
            {
              entities: [
                { contentType: 'core:customer', contentId: data.customerId },
                { contentType: 'block:oppty', contentId: opptyId },
              ],
            },
          ]);
        }
        if (opptyId && onComplete) {
          onComplete(opptyId);
        }
        setOpen(false);
      },
    });
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {showTrigger && (
        <Sheet.Trigger asChild>
          <Button>
            <IconPlus />
            Add opportunity
          </Button>
        </Sheet.Trigger>
      )}
      <Sheet.View className="p-0 sm:max-w-5xl">
        <Sheet.Header>
          <Sheet.Title>New opportunity</Sheet.Title>
          <Sheet.Close />
        </Sheet.Header>
        <OpptyForm
          defaultValues={{
            assignedUserId: currentUser?._id || undefined,
          }}
          onSubmit={onSubmit}
          loading={loading}
        />
      </Sheet.View>
    </Sheet>
  );
};
