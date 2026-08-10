const mockUploadFileToStorage = jest.fn();
const mockFetch = jest.fn();
const realFetch = global.fetch;
const mockAuth = {
  subdomain: 'test',
  erxesApiUrl: 'http://core:4000',
  preferCoreFileUpload: false,
};

jest.mock('erxes-api-shared/utils', () => ({
  uploadFileToStorage: (...args: unknown[]) => mockUploadFileToStorage(...args),
}));

jest.mock('~/mastra/requestContext', () => ({
  getCurrentAuth: () => mockAuth,
}));

import { persistGeneratedFile } from './persist';

const params = {
  buffer: Buffer.from('preview'),
  fileName: 'preview.txt',
  mimeType: 'text/plain',
};

describe('persistGeneratedFile', () => {
  beforeEach(() => {
    mockUploadFileToStorage.mockReset();
    mockUploadFileToStorage.mockRejectedValue(
      new Error('direct storage unavailable'),
    );
    mockAuth.erxesApiUrl = 'http://core:4000';
    mockAuth.preferCoreFileUpload = false;
    mockFetch.mockReset();
    mockFetch.mockRejectedValue(new Error('core unavailable'));
    global.fetch = mockFetch as unknown as typeof fetch;
  });

  afterAll(() => {
    global.fetch = realFetch;
  });

  it('returns a private cloud key without calling core when direct storage succeeds', async () => {
    mockUploadFileToStorage.mockResolvedValue('private/preview.txt');

    await expect(
      persistGeneratedFile({ ...params, allowInlineFallback: false }),
    ).resolves.toEqual({
      fileKey: 'private/preview.txt',
      size: params.buffer.length,
      inline: false,
    });
    expect(mockFetch).not.toHaveBeenCalled();
    expect(mockUploadFileToStorage).toHaveBeenCalledWith(
      expect.objectContaining({
        subdomain: 'test',
        forcePrivate: true,
      }),
    );
  });

  it('returns a private key through core when local storage rejects direct upload', async () => {
    mockUploadFileToStorage.mockRejectedValue(
      new Error(
        'Local storage cannot be accessed from shared utilities. Use server-side file upload instead.',
      ),
    );
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => ' uploads/local-preview.txt \n',
    });

    await expect(
      persistGeneratedFile({ ...params, allowInlineFallback: false }),
    ).resolves.toEqual({
      fileKey: 'uploads/local-preview.txt',
      size: params.buffer.length,
      inline: false,
    });

    expect(mockUploadFileToStorage).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [target, request] = mockFetch.mock.calls[0];
    expect(String(target)).toBe(
      'http://core:4000/upload-file?forcePrivate=true',
    );
    expect(request).toEqual(
      expect.objectContaining({
        method: 'POST',
        headers: { 'x-subdomain': 'test' },
        redirect: 'error',
      }),
    );
    expect(request.signal).toBeInstanceOf(AbortSignal);
    expect(request.body).toBeInstanceOf(FormData);
    if (!(request.body instanceof FormData)) {
      throw new Error('Expected a multipart form body');
    }
    const uploaded = request.body.get('file');
    expect(uploaded).toBeInstanceOf(Blob);
    if (!(uploaded instanceof Blob)) {
      throw new Error('Expected the multipart file field to contain bytes');
    }
    expect(uploaded).toEqual(
      expect.objectContaining({
        name: params.fileName,
        size: params.buffer.length,
        type: params.mimeType,
      }),
    );
    await expect(uploaded.text()).resolves.toBe('preview');
  });

  it('reuses core as the storage authority after direct storage fails once', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => 'uploads/private-preview.txt',
    });

    await persistGeneratedFile({ ...params, allowInlineFallback: false });
    await persistGeneratedFile({ ...params, allowInlineFallback: false });

    expect(mockUploadFileToStorage).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockAuth.preferCoreFileUpload).toBe(true);
  });

  it('refuses a non-HTTP core endpoint before making a storage request', async () => {
    mockAuth.erxesApiUrl = 'file:///tmp';

    await expect(
      persistGeneratedFile({ ...params, allowInlineFallback: false }),
    ).rejects.toThrow('Could not save the generated file to private storage');
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it.each([
    { label: 'empty', result: '   ' },
    { label: 'public URL', result: 'https://public.example/preview.txt' },
  ])('rejects $label core result as a private key', async ({ result }) => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => result,
    });

    await expect(
      persistGeneratedFile({ ...params, allowInlineFallback: false }),
    ).rejects.toThrow('Could not save the generated file to private storage');
  });

  it('preserves bounded inline data for documents when both storage paths fail', async () => {
    await expect(persistGeneratedFile(params)).resolves.toEqual({
      fileKey: `data:text/plain;base64,${params.buffer.toString('base64')}`,
      size: params.buffer.length,
      inline: true,
    });
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('rejects strict persistence when both storage paths fail', async () => {
    await expect(
      persistGeneratedFile({ ...params, allowInlineFallback: false }),
    ).rejects.toThrow('Could not save the generated file to private storage');
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});
