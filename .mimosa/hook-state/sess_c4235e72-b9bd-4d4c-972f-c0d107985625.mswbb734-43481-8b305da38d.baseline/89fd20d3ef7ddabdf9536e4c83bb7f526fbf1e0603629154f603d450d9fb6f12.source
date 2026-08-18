import { readImage } from 'erxes-ui';

interface ImageUrlOptions {
  isSlaveMode: boolean;
  masterUrl?: string;
}


export function getImageReadUrl(
  imageKey: string | undefined,
  options: ImageUrlOptions,
): string {
  if (!imageKey) {
    return '';
  }

  const { isSlaveMode, masterUrl } = options;

  if (isSlaveMode && masterUrl) {
    const encodedKey = encodeURIComponent(imageKey);
    const url = readImage(`${masterUrl}/read-file?key=${encodedKey}`);
    return url;
  }

  const url = readImage(`${imageKey}`);
  return url;
}

export function extractImageKey(url: string, options: ImageUrlOptions): string {
  const { isSlaveMode, masterUrl } = options;

  if (isSlaveMode && masterUrl && url.startsWith(masterUrl)) {
    return url.replace(masterUrl, '').replace(/^\//, '');
  }

  return url;
}
