import { IconFolder, IconFolderOff } from '@tabler/icons-react';
import { Button, Command, Dialog, Empty, Spinner } from 'erxes-ui';
import { useTranslation } from 'react-i18next';
import { FilesBreadcrumb, FilesSpaceTabs } from 'ui-modules';
import { useFilesMoveDialog } from '../hooks/useFilesMoveDialog';

export const FilesMoveDialog = () => {
  const { t } = useTranslation('files');
  const dialog = useFilesMoveDialog();

  return (
    <Dialog open={dialog.open} onOpenChange={(next) => !next && dialog.close()}>
      <Dialog.Content className="max-w-md">
        <Dialog.Header>
          <Dialog.Title>{t('move-item', { name: dialog.label })}</Dialog.Title>
          <Dialog.Description>{t('move-description')}</Dialog.Description>
        </Dialog.Header>

        <FilesSpaceTabs value={dialog.space} onChange={dialog.changeSpace} />
        <FilesBreadcrumb
          space={dialog.space}
          path={dialog.path}
          onOpen={dialog.setBrowseId}
          size="sm"
        />

        <Command
          shouldFilter={false}
          className="h-64 rounded-xl border bg-background"
        >
          <Command.List className="m-0 h-full max-h-none p-1">
            {dialog.loading && (
              <div className="flex h-full items-center justify-center">
                <Spinner />
              </div>
            )}
            {!dialog.loading && !dialog.folders.length && (
              <Empty className="h-full p-6 md:p-6">
                <Empty.Header>
                  <Empty.Media variant="icon">
                    <IconFolderOff />
                  </Empty.Media>
                  <Empty.Description>{t('no-subfolders')}</Empty.Description>
                </Empty.Header>
              </Empty>
            )}
            {dialog.folders.map((folder) => (
              <Command.Item
                key={folder._id}
                value={folder._id}
                className="h-9 cursor-pointer rounded-lg px-3"
                onSelect={() => dialog.setBrowseId(folder._id)}
              >
                <IconFolder className="text-muted-foreground" />
                <span className="truncate">{folder.name}</span>
              </Command.Item>
            ))}
          </Command.List>
        </Command>

        <Dialog.Footer>
          <Button variant="secondary" onClick={dialog.close}>
            {t('cancel')}
          </Button>
          <Button
            onClick={dialog.confirm}
            disabled={dialog.moving || !dialog.canMoveHere}
          >
            {t('move-here')}
          </Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  );
};
