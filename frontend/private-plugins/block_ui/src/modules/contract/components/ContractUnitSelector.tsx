import { Form, Select } from 'erxes-ui';
import { Control, UseFormSetValue } from 'react-hook-form';
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  useBuildings,
  useBuildingZonings,
} from '@/building/hooks/useBuildings';
import { useUnits } from '@/unit/hooks/useUnits';
import { ContractFormData } from '@/contract/constants/contractSchema';

export const ContractUnitSelector = ({
  control,
  setValue,
}: {
  control: Control<ContractFormData>;
  setValue: UseFormSetValue<ContractFormData>;
}) => {
  const { id, projectId: projectIdParam } = useParams<{
    id?: string;
    projectId?: string;
  }>();
  const projectId = projectIdParam || id || '';

  const [buildingId, setBuildingId] = useState<string>('');
  const [zoningId, setZoningId] = useState<string>('');

  const { buildings = [] } = useBuildings({ projectId });
  const { buildingZonings = [] } = useBuildingZonings({
    buildingId,
    skip: !buildingId,
  });
  const { units = [] } = useUnits({
    variables: { zoning: zoningId },
    skip: !zoningId,
  });

  useEffect(() => {
    setZoningId('');
    setValue('unit', '');
  }, [buildingId, setValue]);

  useEffect(() => {
    setValue('unit', '');
  }, [zoningId, setValue]);

  if (!projectId) {
    return (
      <p className="text-muted-foreground text-sm">
        Project must be selected before choosing a unit.
      </p>
    );
  }

  return (
    <div className="gap-4 grid grid-cols-3">
      <div className="space-y-2">
        <Form.Label>Building</Form.Label>
        <Select value={buildingId} onValueChange={setBuildingId}>
          <Select.Trigger className="h-8">
            <Select.Value placeholder="Select building" />
          </Select.Trigger>
          <Select.Content>
            {buildings.map((b) => (
              <Select.Item key={b._id} value={b._id}>
                {b.name}
              </Select.Item>
            ))}
          </Select.Content>
        </Select>
      </div>

      <div className="space-y-2">
        <Form.Label>Zone</Form.Label>
        <Select
          value={zoningId}
          onValueChange={setZoningId}
          disabled={!buildingId}
        >
          <Select.Trigger className="h-8">
            <Select.Value placeholder="Select zone" />
          </Select.Trigger>
          <Select.Content>
            {buildingZonings.map((z) => (
              <Select.Item key={z._id} value={z._id}>
                Floor {z.floor}
              </Select.Item>
            ))}
          </Select.Content>
        </Select>
      </div>

      <Form.Field
        control={control}
        name="unit"
        render={({ field }) => (
          <Form.Item>
            <Form.Label>Unit</Form.Label>
            <Select
              value={field.value || ''}
              onValueChange={(unitId) => {
                field.onChange(unitId);
                const selected = units.find((u) => u._id === unitId);
                if (selected?.unitType?.price != null) {
                  setValue('amount', Number(selected.unitType.price));
                }
              }}
              disabled={!zoningId}
            >
              <Form.Control>
                <Select.Trigger className="h-8">
                  <Select.Value placeholder="Select unit" />
                </Select.Trigger>
              </Form.Control>
              <Select.Content>
                {units.map((u) => {
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
            <Form.Message />
          </Form.Item>
        )}
      />
    </div>
  );
};
