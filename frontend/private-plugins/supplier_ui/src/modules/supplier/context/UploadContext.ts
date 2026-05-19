import { createContext, useContext } from 'react';

type IUploadContext = {
  urls: string[] | undefined;
  mode: 'single' | 'multiple';
  onValueChange: (value: string | string[]) => void;
  setPreviewUrls: (previewUrl: string[] | undefined) => void;
  handleFileChange: (files: FileList | null) => void;
  remove: (url?: string) => void;
  isLoading: boolean;
  loadingCount: number;
  finishedCount: number;
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

