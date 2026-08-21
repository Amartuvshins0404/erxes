import { IconPhotoCirclePlus, IconUpload, IconX } from '@tabler/icons-react';
import {
  Button,
  Dialog,
  Form,
  InfoCard,
  Input,
  Spinner,
  Upload,
  readImage,
} from 'erxes-ui';
import { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import {
  RemoveButton,
  UploadButton,
  UploadCard,
} from '@/events/components/UploadCard';
import { EventFormValues } from '@/events/components/eventFormSchema';

const CoverCard = ({ form }: { form: UseFormReturn<EventFormValues> }) => (
  <Form.Field
    control={form.control}
    name="coverImage"
    render={({ field }) => (
      <UploadCard
        title="Event cover"
        value={field.value}
        onValueChange={field.onChange}
        fit="cover"
      >
        <div className="gap-2 grid grid-cols-2">
          <UploadButton value={field.value} />
          <RemoveButton value={field.value} />
        </div>
      </UploadCard>
    )}
  />
);

const GalleryCard = ({ form }: { form: UseFormReturn<EventFormValues> }) => {
  const [uploading, setUploading] = useState(false);

  return (
    <Form.Field
      control={form.control}
      name="images"
      render={({ field }) => {
        const images = field.value ?? [];

        return (
          <InfoCard title="Event images">
            <InfoCard.Content>
              <Upload.Root
                value=""
                multiple
                onChange={(fileInfo: { url?: string } | string) => {
                  const url =
                    typeof fileInfo === 'string' ? fileInfo : fileInfo?.url;

                  if (url) {
                    field.onChange([...(form.getValues('images') ?? []), url]);
                  }
                }}
                className="w-full flex-col items-stretch gap-3"
              >
                <div className="grid grid-cols-6 gap-3">
                  {images.length > 0 ? (
                    images.map((image) => (
                      <div
                        key={image}
                        className="group relative flex aspect-square items-center justify-center rounded-lg bg-muted"
                      >
                        <Dialog>
                          <Dialog.Trigger asChild>
                            <img
                              src={readImage(image)}
                              alt="Event"
                              className="absolute inset-0 size-full cursor-zoom-in rounded-lg object-cover"
                              loading="lazy"
                            />
                          </Dialog.Trigger>
                          <Dialog.Content className="w-auto max-w-7xl border-0 bg-transparent p-0">
                            <img
                              src={readImage(image)}
                              alt="Event"
                              className="mx-auto max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
                            />
                          </Dialog.Content>
                        </Dialog>
                        <div className="pointer-events-none absolute inset-0 rounded-lg border border-foreground/10" />
                        <Button
                          type="button"
                          variant="secondary"
                          size="icon"
                          aria-label="Remove image"
                          className="absolute -right-2 -top-2 size-6 opacity-0 transition-opacity group-hover:opacity-100"
                          onClick={() =>
                            field.onChange(images.filter((url) => url !== image))
                          }
                        >
                          <IconX />
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="flex aspect-square items-center justify-center overflow-hidden rounded-lg bg-muted">
                      <IconPhotoCirclePlus className="size-8 text-muted-foreground" />
                    </div>
                  )}
                </div>

                <Upload.Preview
                  className="hidden"
                  onUploadStart={() => setUploading(true)}
                  onAllUploadsComplete={() => setUploading(false)}
                />
                <Upload.Button variant="secondary" className="w-full">
                  {uploading ? (
                    <Spinner containerClassName="flex-none" />
                  ) : (
                    <IconUpload />
                  )}
                  Add images
                </Upload.Button>
              </Upload.Root>
              <Form.Message />
            </InfoCard.Content>
          </InfoCard>
        );
      }}
    />
  );
};

const VideoCard = ({ form }: { form: UseFormReturn<EventFormValues> }) => (
  <Form.Field
    control={form.control}
    name="videoUrl"
    render={({ field }) => (
      <InfoCard title="Event video">
        <InfoCard.Content className="flex flex-col gap-3">
          <Form.Control>
            <Input placeholder="Video URL" {...field} />
          </Form.Control>
          <Dialog>
            <Dialog.Trigger asChild>
              <Button type="button" variant="secondary" disabled={!field.value}>
                Preview
              </Button>
            </Dialog.Trigger>
            <Dialog.Content className="overflow-hidden border-0 p-4">
              <iframe
                src={field.value}
                title="Event video"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
                className="aspect-video h-full w-full overflow-hidden rounded-lg"
              />
              <Dialog.Close asChild>
                <Button variant="secondary" className="w-full">
                  Close preview
                </Button>
              </Dialog.Close>
            </Dialog.Content>
          </Dialog>
          <Form.Message />
        </InfoCard.Content>
      </InfoCard>
    )}
  />
);

export const EventMediaFields = ({
  form,
}: {
  form: UseFormReturn<EventFormValues>;
}) => (
  <div className="grid gap-6 md:grid-cols-2">
    <CoverCard form={form} />
    <VideoCard form={form} />
    <div className="md:col-span-2">
      <GalleryCard form={form} />
    </div>
  </div>
);
