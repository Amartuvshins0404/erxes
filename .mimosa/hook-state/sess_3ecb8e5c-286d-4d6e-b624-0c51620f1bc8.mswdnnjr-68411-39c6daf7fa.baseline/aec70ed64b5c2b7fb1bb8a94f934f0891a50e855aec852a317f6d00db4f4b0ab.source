import { Button, Form, Select } from 'erxes-ui';
import { Control, UseFormSetValue, useWatch } from 'react-hook-form';
import {
  useBuildings,
  useBuildingZonings,
} from '@/building/hooks/useBuildings';
import { useUnits } from '@/unit/hooks/useUnits';
import { IconMinus } from '@tabler/icons-react';
import { TAddOppty } from '@/oppty/types/validations';

export const UnitSelectRow = ({
  index,
  control,
  projectId,
  onRemove,
  setValue,
  allUnitRows,
}: {
  index: number;
  control: Control<TAddOppty>;
  projectId: string;
  onRemove: () => void;
  setValue: UseFormSetValue<TAddOppty>;
  allUnitRows: TAddOppty['unitRows'];
}) => {
  const buildingId = useWatch({
    control,
    name: `unitRows.${index}.buildingId`,
  });
  const zoningId = useWatch({ control, name: `unitRows.${index}.zoningId` });

  const { buildings = [] } = useBuildings({ projectId });
  const { buildingZonings = [] } = useBuildingZonings({
    buildingId,
    skip: !buildingId,
  });
  const { units = [] } = useUnits({
    variables: { zoning: zoningId },
    skip: !zoningId,
  });

  const selectedUnitIds = allUnitRows
    .filter((_, i) => i !== index)
    .map((row) => row.unitId)
    .filter(Boolean);

  const availableUnits = units.filter((u) => !selectedUnitIds.includes(u._id));

  return (
    <div className="flex gap-2 items-center">
      <Form.Field
        control={control}
        name={`unitRows.${index}.buildingId`}
        render={({ field }) => (
          <Select
            value={field.value}
            onValueChange={(val) => {
              field.onChange(val);
              setValue(`unitRows.${index}.zoningId`, '');
              setValue(`unitRows.${index}.unitId`, '');
            }}
          >
            <Select.Trigger className="h-8">
              <Select.Value placeholder="Building" />
            </Select.Trigger>
            <Select.Content>
              {buildings.map((b) => (
                <Select.Item key={b._id} value={b._id}>
                  {b.name}
                </Select.Item>
              ))}
            </Select.Content>
          </Select>
        )}
      />

      <Form.Field
        control={control}
        name={`unitRows.${index}.zoningId`}
        render={({ field }) => (
          <Select
            value={field.value}
            onValueChange={(val) => {
              field.onChange(val);
              setValue(`unitRows.${index}.unitId`, '');
            }}
            disabled={!buildingId}
          >
            <Select.Trigger className="h-8">
              <Select.Value placeholder="Zone" />
            </Select.Trigger>
            <Select.Content>
              {buildingZonings.map((z) => (
                <Select.Item key={z._id} value={z._id}>
                  Floor {z.floor}
                </Select.Item>
              ))}
            </Select.Content>
          </Select>
        )}
      />

      <Form.Field
        control={control}
        name={`unitRows.${index}.unitId`}
        render={({ field }) => (
          <Select
            value={field.value}
            onValueChange={field.onChange}
            disabled={!zoningId}
          >
            <Select.Trigger className="h-8">
              <Select.Value placeholder="Unit" />
            </Select.Trigger>
            <Select.Content>
              {availableUnits.map((u) => {
                const isSigned = u.activeContract?.statusType === 'signed';
                return (
                  <Select.Item key={u._id} value={u._id} disabled={isSigned}>
                    Unit {u.number}
                    {isSigned && (
                      <span className="ml-2 text-xs text-muted-foreground">(Signed)</span>
                    )}
                  </Select.Item>
                );
              })}
            </Select.Content>
          </Select>
        )}
      />

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onRemove}
        className="text-destructive hover:text-destructive"
      >
        <IconMinus className="size-4" />
      </Button>
    </div>
  );
};
