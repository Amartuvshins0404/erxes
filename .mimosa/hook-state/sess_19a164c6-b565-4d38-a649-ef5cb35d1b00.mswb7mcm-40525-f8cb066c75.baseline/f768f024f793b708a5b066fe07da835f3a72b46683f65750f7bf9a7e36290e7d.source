import { InfoCard, InfoCardContent } from '@/block/components/card';
import { UploadProvider } from '@/block/components/upload';
import { UploadButton } from '@/block/components/UploadCard';
import { zodResolver } from '@hookform/resolvers/zod';
import { IconTrash } from '@tabler/icons-react';
import { Button, Form, Input, Label, Select, Sheet } from 'erxes-ui';
import { useState } from 'react';
import { useForm, UseFormReturn } from 'react-hook-form';
import { MembersInline } from 'ui-modules';
import { z } from 'zod';

export const ProjectDetailDocument = () => {
  return (
    <div className="p-8">
      <InfoCard title="Document">
        <InfoCardContent>
          <div className="grid grid-cols-12 gap-3">
            <Label className="col-span-3" asChild>
              <span>Name</span>
            </Label>
            <Label className="col-span-2" asChild>
              <span>type</span>
            </Label>
            <Label className="col-span-2" asChild>
              <span>visibility</span>
            </Label>
            <Label className="col-span-2" asChild>
              <span>uploaded By</span>
            </Label>
            <Label className="col-span-2" asChild>
              <span>date</span>
            </Label>
            <Label className="col-span-1" asChild>
              <span>actions</span>
            </Label>
          </div>
          <div className="grid grid-cols-12 gap-3">
            <div className="col-span-3">
              <Input />
            </div>
            <div className="col-span-2">
              <Select>
                <Select.Trigger className="h-8">
                  <Select.Value />
                </Select.Trigger>
                <Select.Content>
                  <Select.Item value="brochure">Brochure</Select.Item>
                  <Select.Item value="price-list">Price List</Select.Item>
                  <Select.Item value="floor-book">Floor book</Select.Item>
                </Select.Content>
              </Select>
            </div>
            <div className="col-span-2">
              <Select>
                <Select.Trigger className="h-8">
                  <Select.Value />
                </Select.Trigger>
                <Select.Content>
                  <Select.Item value="public">Public</Select.Item>
                  <Select.Item value="private">Private</Select.Item>
                  <Select.Item value="agents-only">Agents only</Select.Item>
                </Select.Content>
              </Select>
            </div>
            <div className="col-span-2 flex items-center">
              <MembersInline />
            </div>
            <div className="col-span-2">
              <Input />
            </div>
            <div className="col-span-1">
              <Button
                variant="secondary"
                size="icon"
                className="bg-destructive/10 hover:bg-destructive/20 text-destructive size-8"
              >
                <IconTrash />
              </Button>
            </div>
          </div>
        </InfoCardContent>
      </InfoCard>
    </div>
  );
};

export const ProjectDocumentSheet = () => {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <Sheet.Trigger asChild>
        <Button variant="secondary">Add Document</Button>
      </Sheet.Trigger>
      <Sheet.View>
        <Sheet.Header>
          <Sheet.Title>Add Document</Sheet.Title>
          <Sheet.Close />
        </Sheet.Header>
        <ProjectDetailDocumentForm onClose={() => setOpen(false)} />
      </Sheet.View>
    </Sheet>
  );
};

export const ProjectDetailDocumentForm = ({
  onClose,
}: {
  onClose: () => void;
}) => {
  const form = useForm({
    defaultValues: {
      name: '',
      type: '',
      visibility: 'private',
      file: '',
    },
    resolver: zodResolver(
      z.object({
        name: z.string().min(1),
        type: z.string().min(1),
        visibility: z.string().min(1),
      }),
    ),
  });

  return (
    <Form {...form}>
      <form className="flex flex-col flex-auto">
        <Sheet.Content className="p-6 space-y-6">
          <Form.Field
            name="name"
            control={form.control}
            render={({ field }) => (
              <Form.Item>
                <Form.Label>Name</Form.Label>
                <Form.Control>
                  <Input {...field} />
                </Form.Control>
                <Form.Message />
              </Form.Item>
            )}
          />
          <Form.Field
            name="type"
            control={form.control}
            render={({ field }) => (
              <Form.Item>
                <Form.Label>Type</Form.Label>
                <Form.Control>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <Form.Control>
                      <Select.Trigger className="h-8">
                        <Select.Value />
                      </Select.Trigger>
                    </Form.Control>
                    <Select.Content>
                      <Select.Item value="brochure">Brochure</Select.Item>
                      <Select.Item value="price-list">Price List</Select.Item>
                      <Select.Item value="floor-book">Floor book</Select.Item>
                    </Select.Content>
                  </Select>
                </Form.Control>
                <Form.Message />
              </Form.Item>
            )}
          />
          <Form.Field
            name="visibility"
            control={form.control}
            render={({ field }) => (
              <Form.Item>
                <Form.Label>Visibility</Form.Label>
                <Form.Control>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <Form.Control>
                      <Select.Trigger className="h-8">
                        <Select.Value />
                      </Select.Trigger>
                    </Form.Control>
                    <Select.Content>
                      <Select.Item value="brochure">Brochure</Select.Item>
                      <Select.Item value="price-list">Price List</Select.Item>
                      <Select.Item value="floor-book">Floor book</Select.Item>
                    </Select.Content>
                  </Select>
                </Form.Control>
                <Form.Message />
              </Form.Item>
            )}
          />

          <Form.Field
            name="file"
            control={form.control}
            render={({ field }) => (
              <Form.Item>
                <Form.Label>Content</Form.Label>
                <Form.Control>
                  <UploadProvider value={field.value}>
                    <div className="flex items-center gap-4">
                      <UploadButton />
                      <FileName form={form} />
                    </div>
                  </UploadProvider>
                </Form.Control>
              </Form.Item>
            )}
          />
        </Sheet.Content>
        <Sheet.Footer>
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="bg-border"
          >
            Cancel
          </Button>
          <Button type="submit">Save</Button>
        </Sheet.Footer>
      </form>
    </Form>
  );
};

const FileName = ({ form }: { form: UseFormReturn<any> }) => {
  const { value } = form.watch('file');
  return <div>{value?.name}</div>;
};
