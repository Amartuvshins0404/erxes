import { Sheet } from 'erxes-ui';
import { useAtom, useAtomValue } from 'jotai';
import { opptyWidgetSheetState } from '@/oppty/states/opptyWidgetSheetState';
import { OpptyWidgetForm } from './OpptyWidgetForm';
import { useCreateOppty } from '@/oppty/hooks/useCreateOppty';
import { TWidgetOppty } from '@/oppty/types/validations';
import { currentUserState } from 'ui-modules';

export const AddOpptyWidgetSheet = ({
  customerId,
  onComplete,
  defaultValues,
}: {
  customerId?: string;
  onComplete?: (opptyId: string) => void;
  defaultValues?: Partial<TWidgetOppty>;
}) => {
  const [open, setOpen] = useAtom(opptyWidgetSheetState);
  const currentUser = useAtomValue(currentUserState);
  const { createOppty, loading } = useCreateOppty();

  const onSubmit = (data: TWidgetOppty) => {
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
          customerId: customerId,
          customerSource: data.customerSource,
          status: data.status,
          assignedUserId: data.assignedUserId,
          unitType: data.unitType || undefined,
          tenureType: data.tenureType || undefined,
          propertyRows,
          labelIds: data.labelIds,
          tagIds: data.tagIds,
          startDate: data.startDate,
          targetDate: data.targetDate,
          projectId: data.projectId,
        },
      },
      onCompleted: (result) => {
        const opptyId = result?.blockCreateOppty?._id;
        if (opptyId && onComplete) {
          onComplete(opptyId);
        }
        setOpen(false);
      },
    });
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <Sheet.View className="p-0 sm:max-w-2xl">
        <Sheet.Header>
          <Sheet.Title>New opportunity</Sheet.Title>
          <Sheet.Close />
        </Sheet.Header>
        <OpptyWidgetForm
          defaultValues={{
            assignedUserId: currentUser?._id || undefined,
            ...defaultValues,
          }}
          onSubmit={onSubmit}
          loading={loading}
        />
      </Sheet.View>
    </Sheet>
  );
};
