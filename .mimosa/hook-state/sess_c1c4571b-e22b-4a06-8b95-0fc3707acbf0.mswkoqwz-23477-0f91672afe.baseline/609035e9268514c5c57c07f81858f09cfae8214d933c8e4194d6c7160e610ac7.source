import { REACT_APP_API_URL } from 'erxes-ui/utils';

export type DecodeQrResult =
  | { value: string }
  | { error: string };

export async function decodeQrFromImage(
  file: File | Blob,
): Promise<DecodeQrResult> {
  const url = `${REACT_APP_API_URL}/pl:onefit/decode-qr`;
  const formData = new FormData();
  const blob = file instanceof File ? file : new File([file], 'image.jpg', { type: 'image/jpeg' });
  formData.append('file', blob);

  const response = await fetch(url, {
    method: 'POST',
    body: formData,
    credentials: 'include',
  });

  const data = (await response.json()) as DecodeQrResult;

  if (!response.ok) {
    return { error: 'error' in data ? data.error : 'Failed to decode QR code' };
  }

  if ('error' in data) {
    return data;
  }

  return data;
}
