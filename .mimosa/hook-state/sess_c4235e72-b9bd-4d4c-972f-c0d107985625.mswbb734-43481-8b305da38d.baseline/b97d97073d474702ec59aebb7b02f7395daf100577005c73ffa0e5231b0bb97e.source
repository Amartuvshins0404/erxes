import { InfoCard, InfoCardContent } from '@/block/components/card';
import {
  Upload,
  UploadProvider,
  UploadRemoveButton,
} from '@/block/components/upload';
import {
  RemoveButton,
  UploadButton,
  UploadCard,
} from '@/block/components/UploadCard';
import { useProjectDetail } from '@/project/hooks/useProjectDetail';
import { useUpdateProjectGeneralInfo } from '@/project/hooks/useUpdateProject';
import { IconPhotoCirclePlus, IconUpload, IconX } from '@tabler/icons-react';
import { Button, Dialog, Input, readImage } from 'erxes-ui';
import { useState } from 'react';

export const ProjectDetailMedia = () => {
  return (
    <div className="gap-6 grid blk:lg:grid-cols-2 p-8">
      <ProjectImage field="coverImage" />
      <ProjectImage field="logo" />
      <ProjectImages />
      <ProjectVideo />
    </div>
  );
};

export const ProjectImage = ({ field }: { field: 'coverImage' | 'logo' }) => {
  const { project } = useProjectDetail();
  const [imageValue, setImageValue] = useState<string | undefined>(
    project?.[field],
  );
  const { updateProjectGeneralInfo } = useUpdateProjectGeneralInfo();
  const onValueChange = (value?: string) => {
    setImageValue(value as string);
    updateProjectGeneralInfo(project?._id || '', {
      [field]: (value as string) || null,
    });
  };
  // office-erxes-io/SNc1to8A4Own6pBaeSmzOScreenshot 2025-09-07 at 20.03.28.png
  return (
    <UploadCard
      title={field === 'coverImage' ? 'Project cover' : 'Project logo'}
      value={imageValue}
      onValueChange={onValueChange}
      fit="cover"
    >
      <div className="gap-2 grid grid-cols-2">
        <UploadButton value={imageValue} />
        <RemoveButton value={imageValue} />
      </div>
    </UploadCard>
  );
};

export const ProjectImages = () => {
  const { project } = useProjectDetail();
  const [images, setImages] = useState<string[]>(project?.images || []);

  const { updateProjectGeneralInfo } = useUpdateProjectGeneralInfo();

  const onValueChange = (value?: string[] | string) => {
    if (Array.isArray(value)) {
      setImages(value);
    } else if (typeof value === 'string') {
      setImages((prev) => [...prev, value]);
    }
  };

  return (
    <InfoCard title="Project images">
      <InfoCardContent>
        <UploadProvider
          mode="multiple"
          value={images}
          onValueChange={onValueChange}
          onUploadsFinished={(value) => {
            if (!value) return;

            updateProjectGeneralInfo(project?._id || '', {
              images: typeof value === 'string' ? [value] : value,
            });
          }}
        >
          <div className="flex flex-col gap-3 w-full">
            <div className="gap-3 grid grid-cols-6">
              {images.length > 0 ? (
                images.map((image) => (
                  <div
                    key={image}
                    className="group relative flex justify-center items-center bg-muted rounded-lg aspect-square"
                  >
                    <img
                      src={readImage(image)}
                      className="absolute inset-0 rounded-lg size-full object-cover"
                      alt="project"
                    />
                    <Dialog>
                      <Dialog.Trigger asChild>
                        <div className="absolute inset-0 border border-foreground/10 rounded-lg" />
                      </Dialog.Trigger>
                      <Dialog.Content className="bg-transparent p-0 border-0 w-auto max-w-screen-xl">
                        <img
                          src={readImage(image)}
                          alt="project"
                          className="mx-auto rounded-lg max-w-[90vw] max-h-[90vh] object-contain"
                        />
                        <div className="absolute inset-0 border border-foreground/10 rounded-lg" />
                      </Dialog.Content>
                    </Dialog>
                    <UploadRemoveButton url={image}>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="-top-2 -right-2 absolute opacity-0 group-hover:opacity-100 size-6 transition-opacity"
                      >
                        <IconX />
                      </Button>
                    </UploadRemoveButton>
                  </div>
                ))
              ) : (
                <div className="relative flex justify-center items-center bg-muted rounded-lg aspect-square overflow-hidden">
                  <IconPhotoCirclePlus className="size-8 text-scroll" />
                </div>
              )}
            </div>

            <Upload className='w-full'>
              <Button asChild className="w-full" variant="secondary">
                <div>
                  <IconUpload />
                  Add images
                </div>
              </Button>
            </Upload>
          </div>
        </UploadProvider>
      </InfoCardContent>
    </InfoCard>
  );
};

export const ProjectVideo = () => {
  const { project } = useProjectDetail();
  const [videoValue, setVideoValue] = useState<string | undefined>(
    project?.links?.video,
  );

  const { updateProjectGeneralInfo } = useUpdateProjectGeneralInfo();

  return (
    <div>
      <InfoCard title="Project video">
        <InfoCardContent className='flex flex-col gap-3'>
          <Input
            type="text"
            placeholder="Video URL"
            value={videoValue}
            onChange={(e) => {
              setVideoValue(e.target.value);
            }}
            onBlur={() => {
              updateProjectGeneralInfo(project?._id || '', {
                links: { ...project?.links, video: videoValue || '' },
              });
            }}
          />
          <Dialog>
            <Dialog.Trigger asChild>
              <Button variant="secondary" disabled={!videoValue}>
                Preview
              </Button>
            </Dialog.Trigger>
            <Dialog.Content className="p-4 border-0 overflow-hidden">
              <iframe
                src={videoValue}
                title="Project video"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
                className="rounded-lg w-full h-full aspect-video overflow-hidden"
              />
              <div className="w-full">
                <Dialog.Close asChild>
                  <Button variant="secondary" className="w-full">
                    Close preview
                  </Button>
                </Dialog.Close>
              </div>
            </Dialog.Content>
          </Dialog>
        </InfoCardContent>
      </InfoCard>
    </div>
  );
};
