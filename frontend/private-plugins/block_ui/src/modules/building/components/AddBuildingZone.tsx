import {
  buildingZoneSchema,
  generateByFloorRangeSchema,
} from '@/building/constants/buildingSchema';
import { BLOCK_GET_BUILDING_ZONINGS } from '@/building/graphql/buildingQueries';
import { useBuildingsCreateZone } from '@/building/hooks/useBuildingsCreate';
import { IBuilding } from '@/building/types/buildingTypes';
import { SelectTenureType } from '@/unit/components/SelectTenureType';
import { SelectUsageTypes } from '@/unit/components/SelectUsageType';
import { zodResolver } from '@hookform/resolvers/zod';
import { IconPlus } from '@tabler/icons-react';
import { Button, Form, Input, Separator, Sheet, Spinner } from 'erxes-ui';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

export const AddBuildingZone = ({ building }: { building: IBuilding }) => {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <Sheet.Trigger asChild>
        <Button variant="secondary">
          <IconPlus />
          Add building zone
        </Button>
      </Sheet.Trigger>
      <Sheet.View>
        <Sheet.Header>
          <Sheet.Title className="flex items-center gap-2 text-base">
            {building?.name} <Separator.Inline /> Add Building Zone
          </Sheet.Title>
          <Sheet.Close />
        </Sheet.Header>

        <AddBuildingZoneForm
          building={building}
          onClose={() => setOpen(false)}
        />
      </Sheet.View>
    </Sheet>
  );
};

export const AddBuildingZoneForm = ({
  building,
  onClose,
}: {
  building: IBuilding;
  onClose?: () => void;
}) => {
  const form = useForm<z.infer<typeof buildingZoneSchema>>({
    resolver: zodResolver(buildingZoneSchema),
    defaultValues: {
      floor: 0,
      areaType: '',
      tenureTypes: [],
      usageTypes: [],
    },
  });

  const areaType = form.watch('areaType');
  const tenureTypes = form.watch('tenureTypes');

  const { createBuildingZone, loading } = useBuildingsCreateZone();

  const onSubmit = (data: z.infer<typeof buildingZoneSchema>) => {
    if (areaType === 'private' && tenureTypes?.length) {
      data['tenureTypes'] = [];
    }

    createBuildingZone({
      variables: { input: { ...data, building: building._id } },
      refetchQueries: [
        {
          query: BLOCK_GET_BUILDING_ZONINGS,
          variables: { building: building._id },
        },
      ],
    });

    onClose?.();
  };

  return (
    <Form {...form}>
      <form
        className="flex flex-col flex-auto"
        onSubmit={form.handleSubmit(onSubmit, (error) => console.log(error))}
      >
        <Sheet.Content className="blk:space-y-5 p-6">
          <Form.Field
            name="floor"
            render={({ field }) => (
              <Form.Item>
                <Form.Label>Floor</Form.Label>
                <Form.Control>
                  <Input
                    value={field.value}
                    onChange={(e) =>
                      field.onChange(Number(e.target.value || '0'))
                    }
                    type="number"
                  />
                </Form.Control>
                <Form.Message />
              </Form.Item>
            )}
          />
          <Form.Field
            name="tenureType"
            render={({ field }) => (
              <Form.Item>
                <Form.Label>Tenure type</Form.Label>
                <Form.Control>
                  <SelectTenureType
                    value={{ areaType, tenureTypes }}
                    onValueChange={(areaType, tenureTypes) => {
                      form.setValue('areaType', areaType);
                      form.setValue('tenureTypes', tenureTypes);
                    }}
                    inForm
                  />
                </Form.Control>
              </Form.Item>
            )}
          />
          <Form.Field
            name="usageTypes"
            render={({ field }) => (
              <Form.Item>
                <Form.Label>Usage type</Form.Label>
                <SelectUsageTypes
                  value={field.value}
                  onValueChange={field.onChange}
                  inForm
                />
              </Form.Item>
            )}
          />
          <Form.Field
            name="size"
            render={({ field }) => (
              <Form.Item className="col-span-2">
                <Form.Label>Size</Form.Label>
                <Form.Control>
                  <Input
                    value={field.value}
                    onChange={(e) =>
                      field.onChange(Number(e.target.value || '0'))
                    }
                    type="number"
                  />
                </Form.Control>
                <Form.Message />
              </Form.Item>
            )}
          />
        </Sheet.Content>
        <Sheet.Footer>
          <Sheet.Close asChild>
            <Button
              variant="ghost"
              className="bg-border"
              onClick={() => form.reset()}
            >
              Cancel
            </Button>
          </Sheet.Close>
          <Button type="submit" disabled={loading}>
            <Spinner show={loading} />
            Add building zone
          </Button>
        </Sheet.Footer>
      </form>
    </Form>
  );
};

export const GenerateByFloorRange = ({ building }: { building: IBuilding }) => {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <Sheet.Trigger asChild>
        <Button variant="secondary">
          <IconPlus />
          Generate by floor range
        </Button>
      </Sheet.Trigger>
      <Sheet.View>
        <Sheet.Header>
          <Sheet.Title>Generate by floor range</Sheet.Title>
          <Sheet.Close />
        </Sheet.Header>
        <GenerateByFloorRangeForm
          building={building}
          onClose={() => setOpen(false)}
        />
      </Sheet.View>
    </Sheet>
  );
};

export const GenerateByFloorRangeForm = ({
  building,
  onClose,
}: {
  building: IBuilding;
  onClose?: () => void;
}) => {
  const form = useForm<z.infer<typeof generateByFloorRangeSchema>>({
    resolver: zodResolver(generateByFloorRangeSchema),
    defaultValues: {
      minFloor: 0,
      maxFloor: 0,
      size: 0,
      areaType: '',
      tenureTypes: [],
      usageTypes: building.types,
    },
  });

  const areaType = form.watch('areaType');
  const tenureTypes = form.watch('tenureTypes');

  const { createBuildingZone, loading } = useBuildingsCreateZone();

  const handleSubmit = async (
    data: z.infer<typeof generateByFloorRangeSchema>,
  ) => {
    const { minFloor, maxFloor } = data;

    if (areaType === 'private' && tenureTypes?.length) {
      data['tenureTypes'] = [];
    }

    for (let floor = minFloor; floor <= maxFloor; floor++) {
      if (floor === 0) continue;
      await createBuildingZone({
        variables: {
          input: {
            building: building._id,
            floor,
            areaType: data.areaType,
            usageTypes: data.usageTypes,
            tenureTypes: data.tenureTypes,
            size: data.size,
          },
        },
        refetchQueries: [
          {
            query: BLOCK_GET_BUILDING_ZONINGS,
            variables: { building: building._id },
          },
        ],
      });
    }
    form.reset();
    onClose?.();
  };

  return (
    <Form {...form}>
      <form
        className="flex flex-col flex-auto"
        onSubmit={form.handleSubmit(handleSubmit)}
      >
        <Sheet.Content className="p-6">
          <div className="gap-4 grid grid-cols-2">
            <Form.Field
              name="minFloor"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>Min floor</Form.Label>
                  <Form.Control>
                    <Input
                      value={field.value}
                      onChange={(e) =>
                        field.onChange(Number(e.target.value || '0'))
                      }
                      type="number"
                    />
                  </Form.Control>
                  <Form.Description>
                    use negative numbers for basement floors
                  </Form.Description>
                  <Form.Message />
                </Form.Item>
              )}
            />
            <Form.Field
              name="maxFloor"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>Max floor</Form.Label>
                  <Form.Control>
                    <Input
                      value={field.value}
                      onChange={(e) =>
                        field.onChange(Number(e.target.value || '0'))
                      }
                      type="number"
                    />
                  </Form.Control>
                  <Form.Message />
                </Form.Item>
              )}
            />
            <Form.Field
              name="tenureType"
              render={() => (
                <Form.Item>
                  <Form.Label>Tenure type</Form.Label>
                  <Form.Control>
                    <SelectTenureType
                      value={{ areaType, tenureTypes }}
                      onValueChange={(areaType, tenureTypes) => {
                        form.setValue('areaType', areaType);
                        form.setValue('tenureTypes', tenureTypes);
                      }}
                      inForm
                    />
                  </Form.Control>
                </Form.Item>
              )}
            />
            <Form.Field
              name="usageTypes"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>Usage type</Form.Label>
                  <Form.Control>
                    <SelectUsageTypes
                      value={field.value}
                      onValueChange={field.onChange}
                      inForm
                    />
                  </Form.Control>
                </Form.Item>
              )}
            />
            <Form.Field
              name="size"
              render={({ field }) => (
                <Form.Item className="col-span-2">
                  <Form.Label>Size</Form.Label>
                  <Form.Control>
                    <Input
                      value={field.value}
                      onChange={(e) =>
                        field.onChange(Number(e.target.value || '0'))
                      }
                      type="number"
                    />
                  </Form.Control>
                  <Form.Message />
                </Form.Item>
              )}
            />
          </div>
        </Sheet.Content>
        <Sheet.Footer>
          <Sheet.Close asChild>
            <Button variant="ghost" className="bg-border">
              Cancel
            </Button>
          </Sheet.Close>
          <Button type="submit" disabled={loading}>
            <Spinner show={loading} />
            Generate
          </Button>
        </Sheet.Footer>
      </form>
    </Form>
  );
};
