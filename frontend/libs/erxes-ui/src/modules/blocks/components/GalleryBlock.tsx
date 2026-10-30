import {
  DefaultInlineContentSchema,
  DefaultStyleSchema,
} from '@blocknote/core';
import {
  createReactBlockSpec,
  ReactCustomBlockRenderProps,
  useResolveUrl,
} from '@blocknote/react';
import {
  IconLayoutGrid,
  IconPhoto,
  IconPlus,
  IconX,
  IconLoader2,
} from '@tabler/icons-react';
import { FC, useRef, useState } from 'react';
import { cn } from 'erxes-ui/lib';
import { readImage } from 'erxes-ui/utils';
import { Button, Spinner } from 'erxes-ui/components';
import { Attachments } from 'erxes-ui/modules/attachments';
import { useToast } from 'erxes-ui/hooks';

export interface GalleryImage {
  url: string;
  caption?: string;
}

const COLUMN_OPTIONS = [2, 3, 4] as const;

const galleryBlockConfig = {
  type: 'gallery' as const,
  propSchema: {
    images: {
      default: '[]' as string,
    },
    columns: {
      default: '3' as string,
    },
  },
  content: 'none' as const,
};

type GalleryRenderProps = ReactCustomBlockRenderProps<
  typeof galleryBlockConfig,
  DefaultInlineContentSchema,
  DefaultStyleSchema
>;

const parseImages = (raw: string): GalleryImage[] => {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const GalleryItem: FC<{
  image: GalleryImage;
  readonly: boolean;
  onRemove: () => void;
  onPreview: () => void;
}> = ({ image, readonly, onRemove, onPreview }) => {
  const { loadingState, downloadUrl } = useResolveUrl(image.url);
  const isResolving = loadingState === 'loading';
  const src = downloadUrl ?? image.url;

  return (
    <div className="group relative aspect-square overflow-hidden rounded-xl bg-muted">
      {isResolving ? (
        <div className="flex h-full w-full items-center justify-center">
          <Spinner size="sm" />
        </div>
      ) : (
        <Button
          variant="ghost"
          aria-label="Preview image"
          className="h-full w-full p-0 rounded-none"
          onClick={onPreview}
        >
          <img
            src={src}
            alt={image.caption ?? ''}
            className="block size-full object-cover"
            draggable={false}
          />
        </Button>
      )}

      {!readonly && (
        <Button
          variant="ghost"
          aria-label="Remove image"
          className="absolute top-1.5 right-1.5 size-6 rounded-full bg-background/80 p-0 text-foreground opacity-0 shadow-sm backdrop-blur-sm transition-opacity hover:bg-background group-hover:opacity-100 focus-visible:opacity-100 [&>svg]:size-3.5"
          onMouseDown={(e) => e.preventDefault()}
          onClick={onRemove}
        >
          <IconX />
        </Button>
      )}
      {image.caption && (
        <div className="absolute inset-x-1.5 bottom-1.5 truncate rounded-full bg-background/80 px-2 py-0.5 text-xs text-foreground backdrop-blur-sm">
          {image.caption}
        </div>
      )}
    </div>
  );
};

const GalleryBlockContent: FC<GalleryRenderProps> = ({ block, editor }) => {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  const images = parseImages(block.props.images);
  const columns = Math.max(2, Math.min(4, parseInt(block.props.columns) || 3));
  const readonly = !editor.isEditable;
  const uploadFile = editor.uploadFile;
  const canUpload = Boolean(uploadFile);

  const updateBlock = (patch: Partial<typeof block.props>) => {
    editor.updateBlock(block, { props: patch });
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length || !uploadFile) return;
    setUploading(true);
    try {
      const results = await Promise.allSettled(
        Array.from(files).map(async (file) => {
          const uploadedFile = await uploadFile(file);
          const url =
            typeof uploadedFile === 'string'
              ? uploadedFile
              : uploadedFile.props?.url;
          if (typeof url !== 'string' || !url) {
            throw new Error(`Failed to upload ${file.name}`);
          }
          return { url };
        }),
      );
      const uploaded = results.flatMap((result) =>
        result.status === 'fulfilled' ? [result.value] : [],
      );
      const currentBlock = editor.getBlock(block.id);
      if (uploaded.length && currentBlock) {
        updateBlock({
          images: JSON.stringify([
            ...parseImages(currentBlock.props.images),
            ...uploaded,
          ]),
        });
      }
      const failedNames = Array.from(files)
        .filter((_, index) => results[index].status === 'rejected')
        .map((file) => file.name);
      if (failedNames.length) {
        toast({
          title: 'Failed to upload gallery images',
          description: failedNames.join(', '),
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Failed to upload gallery images',
        description:
          error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    updateBlock({
      images: JSON.stringify(images.filter((_, i) => i !== index)),
    });
  };

  const setColumns = (n: number) => {
    updateBlock({ columns: String(n) });
  };

  let uploadButtonLabel = 'Add more';
  let uploadButtonIcon = <IconPlus size={15} />;
  if (uploading) {
    uploadButtonLabel = 'Uploading...';
    uploadButtonIcon = <IconLoader2 size={15} className="animate-spin" />;
  } else if (images.length === 0) {
    uploadButtonLabel = 'Add images to gallery';
    uploadButtonIcon = <IconPhoto size={15} />;
  }

  if (readonly && images.length === 0) return null;

  return (
    <div className="w-full my-1 select-none" contentEditable={false}>
      {images.length > 0 && (
        <Attachments.Root
          initialAttachments={images.map((image) => ({
            url: image.url,
            name: image.caption ?? '',
            type: 'image/*',
            size: 0,
          }))}
        >
          <Attachments.Preview
            heading=""
            className="p-0"
            renderThumbnails={(openPreview) => (
              <div
                className="grid gap-2"
                style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
              >
                {images.map((img, i) => (
                  <GalleryItem
                    key={`${img.url}-${i}`}
                    image={img}
                    readonly={readonly}
                    onRemove={() => removeImage(i)}
                    onPreview={() => openPreview(i)}
                  />
                ))}
              </div>
            )}
          />
        </Attachments.Root>
      )}

      {!readonly && (
        <div className="flex items-center gap-2 mt-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />

          {canUpload ? (
            <Button
              variant="ghost"
              disabled={uploading}
              className="h-auto flex-1 gap-1.5 rounded-xl border border-dashed py-2.5 text-muted-foreground hover:bg-accent"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => inputRef.current?.click()}
            >
              {uploadButtonIcon}
              <span>{uploadButtonLabel}</span>
            </Button>
          ) : (
            images.length === 0 && (
              <div className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-dashed px-3 py-2.5 text-sm text-muted-foreground">
                <IconPhoto size={15} />
                <span>No upload handler configured</span>
              </div>
            )
          )}

          {images.length > 0 && (
            <div className="flex shrink-0 items-center gap-0.5 rounded-full bg-muted p-0.5">
              <IconLayoutGrid
                size={14}
                className="mx-1.5 text-muted-foreground"
              />
              {COLUMN_OPTIONS.map((n) => (
                <Button
                  key={n}
                  variant="ghost"
                  aria-label={`${n} columns`}
                  aria-pressed={columns === n}
                  className={cn(
                    'size-6 rounded-full p-0 text-xs',
                    columns === n
                      ? 'bg-card text-foreground shadow-xs hover:bg-card'
                      : 'text-muted-foreground hover:bg-accent',
                  )}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setColumns(n)}
                >
                  {n}
                </Button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const GalleryExternalHTML: FC<GalleryRenderProps> = ({ block }) => {
  const images = parseImages(block.props.images);
  const columns = Math.max(2, Math.min(4, parseInt(block.props.columns) || 3));

  return (
    <div
      className="erxes-editor-gallery"
      data-columns={String(columns)}
      style={
        images.length > 0
          ? {
              display: 'grid',
              gridTemplateColumns: `repeat(${columns}, 1fr)`,
              gap: '8px',
            }
          : { display: 'none' }
      }
    >
      {images.map((img, i) =>
        img.caption ? (
          <figure key={`${img.url}-${i}`} style={{ margin: 0 }}>
            <img
              src={readImage(img.url)}
              alt={img.caption}
              style={{
                width: '100%',
                aspectRatio: '1 / 1',
                objectFit: 'cover',
                display: 'block',
              }}
            />
            <figcaption>{img.caption}</figcaption>
          </figure>
        ) : (
          <img
            key={`${img.url}-${i}`}
            src={readImage(img.url)}
            alt=""
            style={{
              width: '100%',
              aspectRatio: '1 / 1',
              objectFit: 'cover',
              display: 'block',
            }}
          />
        ),
      )}
    </div>
  );
};

export const galleryBlock = createReactBlockSpec(galleryBlockConfig, {
  render: GalleryBlockContent,
  toExternalHTML: GalleryExternalHTML,
  parse: (element) => {
    if (
      element.tagName === 'DIV' &&
      element.classList.contains('erxes-editor-gallery')
    ) {
      const columns = element.getAttribute('data-columns') ?? '3';
      const images: GalleryImage[] = [];

      element.querySelectorAll('figure, img').forEach((el) => {
        if (el.closest('figure') && el.tagName !== 'FIGURE') return;
        if (el.tagName === 'FIGURE') {
          const img = el.querySelector('img') as HTMLImageElement | null;
          if (img?.src)
            images.push({
              url: img.src,
              caption: el.querySelector('figcaption')?.textContent ?? undefined,
            });
        } else {
          const img = el as HTMLImageElement;
          if (img.src) images.push({ url: img.src });
        }
      });

      return { images: JSON.stringify(images), columns };
    }
    return undefined;
  },
});
