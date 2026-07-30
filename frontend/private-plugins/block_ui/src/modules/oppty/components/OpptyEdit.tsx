import { useState } from 'react';
import { Button, Sheet, Spinner, useQueryState } from 'erxes-ui';
import { IconPencil } from '@tabler/icons-react';
import { useGetOppty } from '../hooks/useGetOppty';
import { OpptyForm } from './OpptyForms';
import { useUpdateOppty } from '../hooks/useUpdateOppty';
import { TAddOppty } from '../types/validations';
import { useManageRelations } from 'ui-modules';

export const OpptyEditSheet = ({ disabled }: { disabled?: boolean }) => {
  const [open, setOpen] = useState(false);
  const [activeOpptyId] = useQueryState<string | null>('activeOpptyId');

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <Sheet.Trigger asChild>
        <Button disabled={disabled} title={disabled ? 'Editing is locked after 10 minutes for completed opportunities' : undefined}>
          <IconPencil />
          Edit
        </Button>
      </Sheet.Trigger>
      <Sheet.View className="p-0 sm:max-w-5xl">
        <Sheet.Header>
          <Sheet.Title>Edit opportunity</Sheet.Title>
          <Sheet.Close />
        </Sheet.Header>
        {activeOpptyId && open && (
          <OpptyEdit id={activeOpptyId} setOpen={setOpen} />
        )}
      </Sheet.View>
    </Sheet>
  );
};

export const OpptyEdit = ({
  id,
  setOpen,
}: {
  id: string;
  setOpen: (open: boolean) => void;
}) => {
  const { oppty, loading } = useGetOppty({ variables: { _id: id } });
  const { updateOppty, loading: updateLoading } = useUpdateOppty({ _id: id });
  const { manageRelations } = useManageRelations();

  if (loading) return <Spinner />;
  if (!oppty) return null;

  const rows = (oppty.propertyRows || []).map((row) => ({
    buildingId: row.buildingId || '',
    zoningId: row.zoningId || '',
    unitId: row.unitId || '',
    isMain: row.isMain || false,
  }));

  const defaultValues = {
    description: oppty.description || '',
    customerId: oppty.customerId || '',
    status: oppty.status || '',
    customerSource: oppty.customerSource || '',
    assignedUserId: oppty.assignedUserId || undefined,
    unitType: oppty.unitType || '',
    tenureType: oppty.tenureType || '',
    unitRows: rows.length > 0 ? rows : [{ buildingId: '', zoningId: '', unitId: '' }],
    labelIds: oppty.labelIds || [],
    tagIds: oppty.tagIds || [],
    projectId: oppty.projectId || undefined,
    startDate: oppty.startDate ? new Date(oppty.startDate) : undefined,
    targetDate: oppty.targetDate ? new Date(oppty.targetDate) : undefined,
  };

  return (
    <OpptyForm
      defaultValues={defaultValues}
      onSubmit={(data: TAddOppty) => {
        const propertyRows = data.unitRows
          .filter((row) => row.buildingId)
          .map((row) => ({
            buildingId: row.buildingId,
            zoningId: row.zoningId || undefined,
            unitId: row.unitId || undefined,
            isMain: row.isMain || false,
          }));

        updateOppty({
          variables: {
            _id: id,
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
              projectId: data.projectId,
            },
          },
          onCompleted: () => {
            if (data.customerId) {
              manageRelations({
                contentType: 'block:oppty',
                contentId: id,
                relatedContentType: 'core:customer',
                relatedContentIds: [data.customerId],
              });
            }

            if (propertyRows?.length) {
              const unitIds = propertyRows.map((row) => row.unitId).filter(Boolean) as string[]

              manageRelations({
                contentType: 'block:oppty',
                contentId: id,
                relatedContentType: 'block:unit',
                relatedContentIds: unitIds || [],
              });
            }

            setOpen(false);
          },
        });
      }}
      loading={updateLoading}
      isEdit={true}
    />
  );
};
