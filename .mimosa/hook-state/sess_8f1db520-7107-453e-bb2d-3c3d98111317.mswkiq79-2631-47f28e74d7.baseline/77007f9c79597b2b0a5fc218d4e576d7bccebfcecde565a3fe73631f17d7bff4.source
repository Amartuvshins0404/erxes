import { createContext, useContext } from 'react';

type IUploadContext = {
  urls: string[] | undefined;
  mode: 'single' | 'multiple';
  setPreviewUrls: (previewUrl: string[] | undefined) => void;
  acceptedFileTypes: string[];
};

export const UploadContext = createContext<IUploadContext | null>(null);

export const useUploadContext = () => {
  const context = useContext(UploadContext);
  if (!context) {
    throw new Error(
      'UploadContext must be used within an UploadContextProvider',
    );
  }
  return context;
};
