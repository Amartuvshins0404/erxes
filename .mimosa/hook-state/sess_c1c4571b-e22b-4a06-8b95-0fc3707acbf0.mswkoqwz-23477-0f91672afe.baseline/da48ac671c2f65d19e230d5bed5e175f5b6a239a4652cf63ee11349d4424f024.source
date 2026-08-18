import { useUpdateOppty } from '@/oppty/hooks/useUpdateOppty';
import { IOppty, IPropertyRow } from '@/oppty/types/opptyTypes';
import { OPPTY_CUSTOMER_SOURCES } from '@/oppty/constants/oppty';
import { useBlockStatusesByType } from '@/status/hooks/useGetBlockStatuses';
import {
  useBuildings,
  useBuildingZonings,
} from '@/building/hooks/useBuildings';
import { useUnits } from '@/unit/hooks/useUnits';
import { useUnit } from '@/unit/hooks/useUnit';
import { Button, DatePicker, Select, Separator, Textarea } from 'erxes-ui';
import { SelectCustomer, SelectMember } from 'ui-modules';
import { useEffect, useRef, useState } from 'react';
import { useDebounce } from 'use-debounce';
import { IconMinus, IconPlus } from '@tabler/icons-react';

const parseDate = (value: any): Date | undefined => {
  if (!value) return undefined;
  const num = Number(value);
  const d = new Date(isNaN(num) ? value : num);
  return isNaN(d.getTime()) ? undefined : d;
};

export const OpptyFields = ({ oppty }: { oppty: IOppty }) => {
  const {
    _id,
    description: _description,
    customerId: _customerId,
    customerSource: _customerSource,
    status: _status,
    assignedUserId: _assignedUserId,
    propertyRows: _propertyRows,
    projectId,
    startDate: _startDate,
    targetDate: _targetDate,
  } = oppty;

  const { updateOppty } = useUpdateOppty();
  const { statuses } = useBlockStatusesByType({ projectId: projectId || '' });

  const [description, setDescription] = useState(_description || '');
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [debouncedDescription] = useDebounce(description, 1000);

  useEffect(() => {
    if (!debouncedDescription || debouncedDescription === _description) return;
    updateOppty({
      variables: { _id, input: { description: debouncedDescription } },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedDescription]);

  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = 'auto';
    textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
  }, [description]);

  const updateField = (field: string, value: any) => {
    updateOppty({
      variables: { _id, input: { [field]: value } },
    });
  };

  return (
    <div className="flex flex-col gap-3">
      <Textarea
        ref={textareaRef}
        className="shadow-none focus-visible:shadow-none p-0"
        style={{ fontSize: '1.25rem', lineHeight: '1.75rem' }}
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <div className="flex items-center gap-2 w-full">
        <FieldSelect
          label="Status"
          value={_status}
          onValueChange={(val) => updateField('status', val)}
          options={(statuses || []).map((s) => ({
            value: s._id,
            label: s.name,
            color: s.color,
          }))}
        />

        <SelectCustomer
          value={_customerId ? [_customerId] : []}
          onValueChange={(val) => {
            const id = Array.isArray(val) ? val[0] : val;
            if (id) updateField('customerId', id);
          }}
          mode="single"
        />

        <FieldSelect
          label="Source"
          value={_customerSource}
          onValueChange={(val) => updateField('customerSource', val)}
          options={Object.entries(OPPTY_CUSTOMER_SOURCES).map(([key, val]) => ({
            value: val,
            label: key
              .replace(/_/g, ' ')
              .toLowerCase()
              .replace(/^\w/, (c) => c.toUpperCase()),
          }))}
        />

        <SelectMember.Detail
          value={_assignedUserId || ''}
          onValueChange={(val: any) => updateField('assignedUserId', val)}
          mode="single"
        />

        <DatePicker
          placeholder="Start date"
          value={parseDate(_startDate)}
          onChange={(date) => updateField('startDate', date)}
        />

        <DatePicker
          placeholder="Target date"
          value={parseDate(_targetDate)}
          onChange={(date) => updateField('targetDate', date)}
        />
      </div>

      <Separator className="my-2" />

      <OpptyPropertyRows
        opptyId={_id}
        propertyRows={_propertyRows || []}
        projectId={projectId || ''}
        updateOppty={updateOppty}
      />
    </div>
  );
};

const FieldSelect = ({
  label,
  value,
  onValueChange,
  options,
}: {
  label: string;
  value: string;
  onValueChange: (val: string) => void;
  options: { value: string; label: string; color?: string }[];
}) => {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <Select.Trigger className="w-auto min-w-28 h-8">
        <Select.Value placeholder={label} />
      </Select.Trigger>
      <Select.Content>
        {options.map((opt) => (
          <Select.Item key={opt.value} value={opt.value}>
            <span className="flex items-center gap-2">
              {opt.color && (
                <span
                  className="rounded-full size-2"
                  style={{ backgroundColor: opt.color }}
                />
              )}
              {opt.label}
            </span>
          </Select.Item>
        ))}
      </Select.Content>
    </Select>
  );
};

const OpptyPropertyRows = ({
  opptyId,
  propertyRows,
  projectId,
  updateOppty,
}: {
  opptyId: string;
  propertyRows: IPropertyRow[];
  projectId: string;
  updateOppty: ReturnType<typeof useUpdateOppty>['updateOppty'];
}) => {
  const { buildings = [] } = useBuildings({ projectId });

  const removeRow = (index: number) => {
    const updated = propertyRows.filter((_, i) => i !== index);
    updateOppty({
      variables: {
        _id: opptyId,
        input: { propertyRows: updated },
      },
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <h4 className="font-medium text-sm">Property</h4>
      </div>

      {propertyRows.length === 0 && (
        <div className="text-muted-foreground text-sm">
          No property assigned
        </div>
      )}

      {propertyRows.map((row, index) => (
        <PropertyRowDisplay
          key={`${row.buildingId}-${row.zoningId}-${row.unitId}-${index}`}
          row={row}
          buildings={buildings}
          onRemove={() => removeRow(index)}
        />
      ))}

      <AddPropertyRow
        opptyId={opptyId}
        projectId={projectId}
        propertyRows={propertyRows}
        updateOppty={updateOppty}
      />
    </div>
  );
};

const PropertyRowDisplay = ({
  row,
  buildings,
  onRemove,
}: {
  row: IPropertyRow;
  buildings: { _id: string; name?: string }[];
  onRemove: () => void;
}) => {
  const { unit } = useUnit(row.unitId || '');
  const building = buildings.find((b) => b._id === row.buildingId);
  const { buildingZonings = [] } = useBuildingZonings({
    buildingId: row.buildingId,
    skip: !row.buildingId,
  });
  const zoning = buildingZonings.find((z) => z._id === row.zoningId);

  return (
    <div className="flex justify-between items-center px-3 py-2 border rounded">
      <div className="flex items-center gap-2 text-sm">
        {row.isMain && (
          <span className="bg-primary/10 px-1.5 py-0.5 rounded font-medium text-primary text-xs">
            Main
          </span>
        )}
        {building && (
          <span className="font-medium">{building.name}</span>
        )}
        {zoning && (
          <span className="text-muted-foreground">· Floor {zoning.floor}</span>
        )}
        {unit && (
          <span className="text-muted-foreground">· Unit {unit.number}</span>
        )}
        {unit?.unitType?.name && (
          <span className="text-muted-foreground">· {unit.unitType.name}</span>
        )}
        {unit?.unitType?.price != null && (
          <span className="text-muted-foreground">
            · {Number(unit.unitType.price).toLocaleString()}
          </span>
        )}
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={onRemove}
        className="p-0 w-6 h-6 text-destructive hover:text-destructive"
      >
        <IconMinus className="size-4" />
      </Button>
    </div>
  );
};

const AddPropertyRow = ({
  opptyId,
  projectId,
  propertyRows,
  updateOppty,
}: {
  opptyId: string;
  projectId: string;
  propertyRows: IPropertyRow[];
  updateOppty: ReturnType<typeof useUpdateOppty>['updateOppty'];
}) => {
  const [adding, setAdding] = useState(false);
  const [buildingId, setBuildingId] = useState('');
  const [zoningId, setZoningId] = useState('');
  const [unitId, setUnitId] = useState('');

  const { buildings = [] } = useBuildings({ projectId });
  const { buildingZonings = [] } = useBuildingZonings({
    buildingId,
    skip: !buildingId,
  });
  const { units = [] } = useUnits({
    variables: { zoning: zoningId },
    skip: !zoningId,
  });

  const existingUnitIds = propertyRows
    .map((r) => r.unitId)
    .filter(Boolean) as string[];

  const handleSave = () => {
    const newRow: IPropertyRow = {
      buildingId,
      zoningId: zoningId || undefined,
      unitId: unitId || undefined,
    };
    updateOppty({
      variables: {
        _id: opptyId,
        input: {
          propertyRows: [...propertyRows, newRow],
        },
      },
    });
    setBuildingId('');
    setZoningId('');
    setUnitId('');
    setAdding(false);
  };

  if (!adding) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={() => setAdding(true)}
      >
        <IconPlus className="size-4" />
        Add property
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-2 px-3 py-2 border rounded">
      <div className="flex items-center gap-2">
        <Select
          value={buildingId}
          onValueChange={(val) => {
            setBuildingId(val);
            setZoningId('');
            setUnitId('');
          }}
        >
          <Select.Trigger className="flex-1 h-8">
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

        <Select
          value={zoningId}
          onValueChange={(val) => {
            setZoningId(val);
            setUnitId('');
          }}
          disabled={!buildingId}
        >
          <Select.Trigger className="flex-1 h-8">
            <Select.Value placeholder="Zone (optional)" />
          </Select.Trigger>
          <Select.Content>
            {buildingZonings.map((z) => (
              <Select.Item key={z._id} value={z._id}>
                Floor {z.floor}
              </Select.Item>
            ))}
          </Select.Content>
        </Select>

        <Select
          value={unitId}
          onValueChange={setUnitId}
          disabled={!zoningId}
        >
          <Select.Trigger className="flex-1 h-8">
            <Select.Value placeholder="Unit (optional)" />
          </Select.Trigger>
          <Select.Content>
            {units
              .filter((u) => !existingUnitIds.includes(u._id))
              .map((u) => (
                <Select.Item key={u._id} value={u._id}>
                  Unit {u.number}
                </Select.Item>
              ))}
          </Select.Content>
        </Select>
      </div>
      <div className="flex justify-end items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setAdding(false);
            setBuildingId('');
            setZoningId('');
            setUnitId('');
          }}
          className="h-8"
        >
          Cancel
        </Button>
        {buildingId && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleSave}
            className="h-8"
          >
            Save property
          </Button>
        )}
      </div>
    </div>
  );
};
