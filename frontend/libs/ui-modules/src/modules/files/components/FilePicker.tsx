import { IconFolder, IconUpload } from '@tabler/icons-react';
import {
  Button,
  Checkbox,
  Command,
  Dialog,
  Empty,
  formatBytes,
  Input,
  Spinner,
} from 'erxes-ui';
import { ReactNode, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useFilePicker } from '../hooks/useFilePicker';
import { IFile } from '../types';
import { FilesBreadcrumb } from './FilesBreadcrumb';
import { FilesSpaceTabs } from './FilesSpaceTabs';
import { FileTypeIcon } from './FileTypeIcon';
import { LoadMoreSentinel } from '../../shared/components/LoadMoreSentinel';

type TFilePickerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (files: IFile[]) => void;
  multiple?: boolean;
  accept?: (file: IFile) => boolean;
  title?: ReactNode;
};

export const FilePicker = (props: TFilePickerProps) => {
  const { t } = useTranslation('files');
  const inputRef = useRef<HTMLInputElement>(null);
  const picker = useFilePicker(props);

  return (
    <Dialog open={props.open} onOpenChange={picker.close}>
      <Dialog.Content className="max-w-2xl">
        <Dialog.Header>
          <Dialog.Title>{props.title || t('choose-files')}</Dialog.Title>
          <Dialog.Description className="sr-only">
            {t('choose-files')}
          </Dialog.Description>
        </Dialog.Header>

        <div className="flex items-center gap-2">
          <Input
            placeholder={t('search-files')}
            value={picker.searchValue}
            onChange={(e) => picker.setSearchValue(e.target.value)}
          />
          <Button
            variant="secondary"
            disabled={!picker.canUpload}
            onClick={() => inputRef.current?.click()}
          >
            <IconUpload />
            {t('upload')}
          </Button>
          <input
            ref={inputRef}
            type="file"
            multiple
            hidden
            onChange={(e) => {
              picker.uploadHere(Array.from(e.target.files || []));
              e.target.value = '';
            }}
          />
        </div>

        <FilesSpaceTabs value={picker.space} onChange={picker.changeSpace} />
        <FilesBreadcrumb
          space={picker.space}
          path={picker.path}
          onOpen={picker.openFolder}
          size="sm"
        />

        <Command
          shouldFilter={false}
          className="h-80 rounded-xl border bg-background"
        >
          <Command.List className="m-0 h-full max-h-none p-1">
            {picker.loading && !picker.files.length && !picker.folders.length && (
              <div className="flex h-full items-center justify-center">
                <Spinner />
              </div>
            )}

            {!picker.loading &&
              !picker.folders.length &&
              !picker.files.length && (
                <Empty className="h-full">
                  <Empty.Header>
                    <Empty.Title>
                      {picker.isSharedList
                        ? t('shared-empty-title')
                        : t('empty-title')}
                    </Empty.Title>
                    <Empty.Description>
                      {picker.isSharedList
                        ? t('shared-empty-description')
                        : t('empty-picker-description')}
                    </Empty.Description>
                  </Empty.Header>
                </Empty>
              )}

            {picker.folders.map((folder) => (
              <Command.Item
                key={folder._id}
                value={`folder-${folder._id}`}
                className="h-9 cursor-pointer rounded-lg px-3"
                onSelect={() => picker.openFolder(folder._id)}
              >
                <IconFolder className="text-muted-foreground" />
                <span className="truncate">{folder.name}</span>
              </Command.Item>
            ))}

            {picker.files.map((file) => (
              <Command.Item
                key={file._id}
                value={`file-${file._id}`}
                className="h-9 cursor-pointer rounded-lg px-3"
                onSelect={() => picker.toggle(file)}
              >
                <Checkbox
                  checked={picker.isSelected(file)}
                  tabIndex={-1}
                  aria-hidden
                  className="pointer-events-none"
                />
                <FileTypeIcon
                  mimeType={file.mimeType}
                  className="size-4 text-muted-foreground"
                />
                <span className="flex-1 truncate">{file.name}</span>
                <span className="text-xs text-muted-foreground">
                  {formatBytes(file.size, 1)}
                </span>
              </Command.Item>
            ))}

            <LoadMoreSentinel
              hasMore={picker.hasMore}
              loading={picker.fetchingMore}
              onLoadMore={picker.loadMore}
            />
          </Command.List>
        </Command>

        {picker.error && (
          <div className="text-sm text-destructive">{picker.error.message}</div>
        )}

        <Dialog.Footer>
          <Button variant="secondary" onClick={() => picker.close(false)}>
            {t('cancel')}
          </Button>
          <Button disabled={!picker.selected.length} onClick={picker.confirm}>
            {t('select-count', { count: picker.selected.length })}
          </Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  );
};
