import { InfoCard, InfoCardContent } from '@/block/components/card';
import { UploadImage } from '@/block/components/upload';
import { AddBuilding } from '@/building/components/AddBuilding';
import { useBuildings } from '@/building/hooks/useBuildings';
import { useBuildingUpdate } from '@/building/hooks/useBuildingUpdate';
import { IBuilding } from '@/building/types/buildingTypes';
import {
  PROJECT_STATUS_OPTIONS,
  PROJECT_TYPES,
} from '@/project/constants/project';
import { IProject, ProjectStatus } from '@/project/types/projectTypes';
import {
  Badge,
  Combobox,
  Command,
  DatePicker,
  Empty,
  Input,
  Label,
  Popover,
  Select,
  Spinner,
  Textarea,
} from 'erxes-ui';
import { useState } from 'react';

export const BuildingsCard = ({ project }: { project: IProject }) => {
  const { buildings, loading } = useBuildings({ projectId: project._id });
  return (
    <InfoCard title="Buildings" description="Buildings">
      <InfoCardContent className='space-y-3'>
        <div className="gap-3 grid grid-cols-12">
          <Label asChild>
            <div className="col-span-2">Image</div>
          </Label>
          <Label asChild>
            <div className="col-span-4">Information</div>
          </Label>
          <Label asChild>
            <div className="col-span-6">Description</div>
          </Label>
        </div>
        {loading ? (
          <Spinner containerClassName="blk:py-32" />
        ) : buildings?.length === 0 ? (
          <Empty>
            <Empty.Header>
              <Empty.Title>No buildings found</Empty.Title>
              <Empty.Description>
                There seems to be no buildings.
              </Empty.Description>
            </Empty.Header>
          </Empty>
        ) : (
          buildings?.map((building) => (
            <BuildingsCardItem key={building._id} building={building} />
          ))
        )}
        <AddBuilding project={project} />
      </InfoCardContent>
    </InfoCard>
  );
};

export const BuildingsCardItem = ({ building }: { building: IBuilding }) => {
  const { updateBuilding } = useBuildingUpdate({ id: building._id });
  const [name, setName] = useState(building.name);
  const [description, setDescription] = useState(building.description);
  return (
    <div className="gap-3 grid grid-cols-12">
      <div className="col-span-2">
        <UploadImage
          value={building.coverImage}
          onValueChange={(value) => updateBuilding({ coverImage: value })}
        />
      </div>
      <div className="flex flex-col gap-3 col-span-4">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => name !== building.name && updateBuilding({ name })}
          className="font-medium"
        />
        <Popover>
          <Combobox.TriggerBase className="flex-wrap justify-start h-auto min-h-8 text-accent-foreground">
            {building.types?.length ? (
              building.types.map((type: string) => (
                <Badge key={type} variant="secondary">
                  {PROJECT_TYPES.find((t) => t.value === type)?.label?.mn}
                </Badge>
              ))
            ) : (
              <span>Төрөл сонгоно уу</span>
            )}
          </Combobox.TriggerBase>

          <Combobox.Content>
            <Command>
              <Command.Input />
              <Command.List>
                {PROJECT_TYPES.map((type) => (
                  <Command.Item
                    value={type.value}
                    key={type.value}
                    onSelect={() => {
                      const newTypes = building.types?.includes(type.value)
                        ? building.types?.filter(
                            (t: string) => t !== type.value,
                          )
                        : [...(building.types || []), type.value];

                      updateBuilding({ types: newTypes });
                    }}
                  >
                    {type.label?.mn}
                    <Combobox.Check
                      checked={building.types?.includes(type.value)}
                    />
                  </Command.Item>
                ))}
              </Command.List>
            </Command>
          </Combobox.Content>
        </Popover>

        <Select
          value={building.status}
          onValueChange={(value) =>
            updateBuilding({ status: value as ProjectStatus })
          }
        >
          <Select.Trigger className="h-8">
            <Select.Value placeholder="Select status" />
          </Select.Trigger>
          <Select.Content>
            {PROJECT_STATUS_OPTIONS.map((option) => (
              <Select.Item key={option.value} value={option.value}>
                {option.label}
              </Select.Item>
            ))}
          </Select.Content>
        </Select>
        <div className="flex gap-2">
          <DatePicker
            mode="single"
            placeholder="Start date"
            value={
              building.startDate ? new Date(building.startDate) : undefined
            }
            onChange={(date) => {
              const dateValue = Array.isArray(date) ? date[0] : date;

              const newStart = dateValue ? new Date(dateValue) : undefined;

              updateBuilding({
                startDate: newStart,
              });
            }}
          />
          <DatePicker
            mode="single"
            placeholder="End date"
            value={building.endDate ? new Date(building.endDate) : undefined}
            onChange={(date) => {
              const dateValue = Array.isArray(date) ? date[0] : date;

              const newEnd = dateValue ? new Date(dateValue) : undefined;

              updateBuilding({
                endDate: newEnd,
              });
            }}
          />
        </div>
      </div>
      <div className="flex col-span-6">
        <Textarea
          className="flex-1"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onBlur={() =>
            description !== building.description &&
            updateBuilding({ description })
          }
        />
      </div>
    </div>
  );
};
