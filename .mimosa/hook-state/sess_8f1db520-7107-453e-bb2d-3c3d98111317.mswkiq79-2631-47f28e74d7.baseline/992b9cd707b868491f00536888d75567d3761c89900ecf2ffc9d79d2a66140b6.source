import { UploadImage } from '@/block/components/upload';
import { buildingSchema } from '@/building/constants/buildingSchema';
import { BLOCK_GET_BUILDING_LIST } from '@/building/graphql/buildingQueries';
import { useBuildingsCreate } from '@/building/hooks/useBuildingsCreate';
import {
  PROJECT_STATUS_OPTIONS,
  PROJECT_TYPES,
} from '@/project/constants/project';
import { IProject } from '@/project/types/projectTypes';
import { zodResolver } from '@hookform/resolvers/zod';
import { IconPlus } from '@tabler/icons-react';
import {
  Badge,
  Button,
  Combobox,
  Command,
  DatePicker,
  Form,
  Input,
  Popover,
  Select,
  Sheet,
  Spinner,
  Textarea,
  toast,
} from 'erxes-ui';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

export const AddBuilding = ({ project }: { project: IProject }) => {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <Sheet.Trigger asChild>
        <Button variant="secondary">
          <IconPlus />
          Add Building
        </Button>
      </Sheet.Trigger>
      <Sheet.View>
        <Sheet.Header>
          <Sheet.Title>Add Building</Sheet.Title>
          <Sheet.Close />
        </Sheet.Header>
        <AddBuildingForProject
          project={project}
          onClose={() => setOpen(false)}
        />
      </Sheet.View>
    </Sheet>
  );
};

export const AddBuildingForProject = ({
  project,
  onClose,
}: {
  project: IProject;
  onClose: () => void;
}) => {
  const form = useForm<z.infer<typeof buildingSchema>>({
    resolver: zodResolver(buildingSchema),
    defaultValues: {
      types: project.types || [],
    },
  });
  const { createBuilding, loading } = useBuildingsCreate();
  const onSubmit = (data: z.infer<typeof buildingSchema>) => {
    createBuilding({
      variables: {
        input: {
          ...data,
          project: project._id,
        },
      },
      refetchQueries: [BLOCK_GET_BUILDING_LIST],
      onCompleted: () => {
        onClose();
        form.reset();
      },
      onError: (error) => {
        toast({
          title: 'Error',
          description: error.message,
        });
      },
    });
  };
  return (
    <Form {...form}>
      <form
        className="flex flex-col flex-auto"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <Sheet.Content className="blk:space-y-5 p-5">
          <Form.Field
            name="coverImage"
            render={({ field }) => (
              <Form.Item>
                <Form.Label>Cover Image</Form.Label>
                <UploadImage
                  className="size-16"
                  value={field.value}
                  onValueChange={(value) => field.onChange(value)}
                />
              </Form.Item>
            )}
          />
          <Form.Field
            name="name"
            render={({ field }) => (
              <Form.Item>
                <Form.Label>Name</Form.Label>
                <Form.Control>
                  <Input {...field} />
                </Form.Control>
              </Form.Item>
            )}
          />
          <Form.Field
            name="types"
            render={({ field }) => (
              <Form.Item>
                <Form.Label>Type</Form.Label>
                <Popover>
                  <Form.Control>
                    <Combobox.TriggerBase className="flex-wrap justify-start h-auto min-h-8 text-accent-foreground">
                      {field.value?.length ? (
                        field.value.map((type: string) => (
                          <Badge key={type} variant="secondary">
                            {PROJECT_TYPES.find((t) => t.value === type)?.label?.mn}
                          </Badge>
                        ))
                      ) : (
                        <span>Төрөл сонгоно уу</span>
                      )}
                    </Combobox.TriggerBase>
                  </Form.Control>

                  <Combobox.Content>
                    <Command>
                      <Command.Input />
                      <Command.List>
                        {PROJECT_TYPES.map((type) => (
                          <Command.Item
                            value={type.value}
                            key={type.value}
                            onSelect={() => {
                              const newTypes = field.value?.includes(type.value)
                                ? field.value?.filter(
                                    (t: string) => t !== type.value,
                                  )
                                : [...(field.value || []), type.value];

                              field.onChange(newTypes);
                            }}
                          >
                            {type.label?.mn}
                            <Combobox.Check
                              checked={field.value?.includes(type.value)}
                            />
                          </Command.Item>
                        ))}
                      </Command.List>
                    </Command>
                  </Combobox.Content>
                </Popover>
              </Form.Item>
            )}
          />
          <Form.Field
            name="status"
            render={({ field }) => (
              <Form.Item>
                <Form.Label>Status</Form.Label>
                <Select value={field.value} onValueChange={field.onChange}>
                  <Form.Control>
                    <Select.Trigger className="h-8">
                      <Select.Value placeholder="Select status" />
                    </Select.Trigger>
                  </Form.Control>
                  <Select.Content>
                    {PROJECT_STATUS_OPTIONS.map((type) => (
                      <Select.Item key={type.value} value={type.value}>
                        {type.label}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select>
              </Form.Item>
            )}
          />
          <div className="gap-3 grid grid-cols-2 w-full">
            <Form.Field
              name="startDate"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>Start Date</Form.Label>
                  <DatePicker
                    mode="single"
                    placeholder="Select date"
                    value={field.value ? new Date(field.value) : undefined}
                    onChange={(date) => {
                      field.onChange(date);
                    }}
                  />
                </Form.Item>
              )}
            />
            <Form.Field
              name="endDate"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>End Date</Form.Label>
                  <DatePicker
                    mode="single"
                    placeholder="Select date"
                    value={field.value ? new Date(field.value) : undefined}
                    onChange={(date) => {
                      field.onChange(date);
                    }}
                  />
                </Form.Item>
              )}
            />
          </div>
          <Form.Field
            name="description"
            render={({ field }) => (
              <Form.Item>
                <Form.Label>Description</Form.Label>
                <Form.Control>
                  <Textarea {...field} />
                </Form.Control>
              </Form.Item>
            )}
          />
        </Sheet.Content>
        <Sheet.Footer>
          <Sheet.Close asChild>
            <Button variant="secondary" className="bg-border">
              Cancel
            </Button>
          </Sheet.Close>
          <Button type="submit" disabled={loading}>
            <Spinner show={loading} />
            Save
          </Button>
        </Sheet.Footer>
      </form>
    </Form>
  );
};
