import { useState } from 'react';
import { IconDownload, IconPhotoOff } from '@tabler/icons-react';
import { Button } from 'erxes-ui';
import { documentUrl, type ImageArtifact } from '~/modules/chat/lib/artifacts';
import { CHECKERBOARD_STYLE } from '~/modules/chat/preview/checkerboard';

// Renders an image artifact (a background-removed transparent PNG) in the
// Preview panel. A plain <img> at the /read-file URL is fine here — same-origin
// with cookies, the pattern SlideImageDeck already proved for pptx slides.
export const ImageViewer = ({ artifact }: { artifact: ImageArtifact }) => {
  const [failed, setFailed] = useState(false);
  const url = documentUrl(artifact);

  if (failed) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-muted-foreground">
        <IconPhotoOff className="size-8 opacity-40" />
        <p className="text-sm">The image preview could not be loaded.</p>
        <Button asChild variant="secondary" size="sm">
          <a
            href={url}
            download={artifact.fileName}
            target="_blank"
            rel="noreferrer"
          >
            <IconDownload className="size-3.5" />
            Download
          </a>
        </Button>
      </div>
    );
  }

  return (
    <div
      className="ea-scroll flex h-full w-full items-center justify-center overflow-auto p-4"
      style={CHECKERBOARD_STYLE}
    >
      <img
        src={url}
        alt={artifact.title}
        className="max-h-full max-w-full object-contain"
        onError={() => setFailed(true)}
      />
    </div>
  );
};
