import { Button, Dialog } from 'erxes-ui';
import { createContext, useContext, useState } from 'react';
import { AgencyAttachment } from '~/modules/agency/types/form';
import { FileRenderer } from './file-renderer';
import { IconX } from '@tabler/icons-react';

type FileViewerContextType = {
  openViewer: (attachment: AgencyAttachment) => void;
  closeViewer: () => void;
};

const FileViewerContext = createContext<FileViewerContextType | null>(null);

export const useFileViewer = () => {
  const context = useContext(FileViewerContext);
  if (!context)
    throw new Error('useFileViewer must be used within FileViewerProvider');
  return context;
};

export const FileViewerProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [activeFile, setActiveFile] = useState<AgencyAttachment | null>(null);

  return (
    <FileViewerContext.Provider
      value={{
        openViewer: (file) => setActiveFile(file),
        closeViewer: () => setActiveFile(null),
      }}
    >
      {children}

      {/* The Global Modal */}
      <Dialog
        open={!!activeFile}
        onOpenChange={(open) => !open && setActiveFile(null)}
      >
        <Dialog.Content className="max-w-4xl w-full p-2 bg-transparent border-0 shadow-none">
          {activeFile && (
            <div className="relative flex flex-col bg-background rounded-lg overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between p-3 border-b">
                <h3 className="text-sm font-medium truncate">
                  {activeFile.name}
                </h3>
                <Dialog.Close asChild>
                  <Button variant="ghost" size="icon">
                    <IconX />
                  </Button>
                </Dialog.Close>
              </div>
              <div className="p-4 flex justify-center bg-muted/30">
                <FileRenderer attachment={activeFile} />
              </div>
            </div>
          )}
        </Dialog.Content>
      </Dialog>
    </FileViewerContext.Provider>
  );
};
