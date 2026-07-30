import { useEffect, useRef, useState } from 'react';
import { IconHistory, IconRestore } from '@tabler/icons-react';
import {
  Badge,
  Button,
  Dialog,
  RelativeDateDisplay,
  Spinner,
} from 'erxes-ui';
import { useConfirmedRemove } from '~/components/useConfirmedRemove';
import { useSkillVersions } from '../hooks/useSkillVersions';
import { useSkillMutations } from '../hooks/useSkillMutations';

// Version history + rollback for a skill. The list is newest-first; selecting a
// row loads that version's full body, and "Restore" points the active version
// at it (mastraSkillActivateVersion) — the documented rollback path.
export const SkillVersionHistoryDialog = ({
  skillId,
  open,
  onOpenChange,
  activeVersionId,
  canRestore,
}: {
  skillId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeVersionId: string | null;
  canRestore: boolean;
}) => {
  const { confirmRemove } = useConfirmedRemove();
  const { versions, loading, loadVersion, version, versionLoading } =
    useSkillVersions(skillId, !open);
  // The shared hook toasts "Version restored" on success; close the dialog then
  // (the cache eviction refreshes the editor's active version).
  const { activateVersion, loading: restoring } = useSkillMutations(() =>
    onOpenChange(false),
  );

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [wasOpen, setWasOpen] = useState(open);

  // Clear the pick when the dialog closes so reopening (possibly for a different
  // skill) starts from that skill's active version rather than a stale id.
  if (open !== wasOpen) {
    setWasOpen(open);
    if (!open) setSelectedId(null);
  }

  // The active (or newest) version is the default preview until the user picks a
  // row — derive it during render instead of copying it into state.
  const effectiveSelectedId =
    selectedId ?? (versions.length > 0 ? activeVersionId ?? versions[0]._id : null);

  // Fetch the default version's body once it's known. The ref guards the lazy
  // query so it fires once per id (on open and when versions arrive), not on
  // every render; user picks fetch directly from handleSelect.
  const loadedRef = useRef<string | null>(null);
  useEffect(() => {
    if (!open) {
      loadedRef.current = null;
      return;
    }
    if (effectiveSelectedId && loadedRef.current !== effectiveSelectedId) {
      loadedRef.current = effectiveSelectedId;
      loadVersion(effectiveSelectedId);
    }
  }, [open, effectiveSelectedId, loadVersion]);

  const handleSelect = (versionId: string) => {
    loadedRef.current = versionId;
    setSelectedId(versionId);
    loadVersion(versionId);
  };

  const handleRestore = (versionId: string) =>
    confirmRemove(
      {
        message:
          'Restore this version? It becomes the active version that agents use.',
        okLabel: 'Restore',
      },
      () => activateVersion(skillId, versionId),
    );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Dialog.Content className="max-w-4xl gap-0 p-0">
        <Dialog.Header className="border-b px-5 py-3.5">
          <Dialog.Title className="flex items-center gap-2">
            <IconHistory className="size-4" /> Version history
          </Dialog.Title>
          <Dialog.Description>
            Review past versions and roll back to one. Restoring sets it as the
            active version.
          </Dialog.Description>
        </Dialog.Header>

        <div className="flex min-h-[24rem] max-h-[70vh]">
          <div className="w-64 shrink-0 overflow-auto border-r">
            {loading && versions.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <Spinner />
              </div>
            ) : versions.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">
                No versions yet.
              </p>
            ) : (
              <ul className="divide-y">
                {versions.map((v) => {
                  const isActive = v._id === activeVersionId;
                  const isSelected = v._id === effectiveSelectedId;
                  return (
                    <li key={v._id}>
                      <button
                        type="button"
                        onClick={() => handleSelect(v._id)}
                        className={`flex w-full flex-col items-start gap-0.5 px-4 py-2.5 text-left transition-colors hover:bg-accent/50 ${
                          isSelected ? 'bg-accent' : ''
                        }`}
                      >
                        <span className="flex items-center gap-2 text-sm font-medium">
                          v{v.versionNumber}
                          {isActive && (
                            <Badge variant="success" className="h-4 px-1.5">
                              Active
                            </Badge>
                          )}
                        </span>
                        {v.changeMessage && (
                          <span className="line-clamp-1 text-xs text-muted-foreground">
                            {v.changeMessage}
                          </span>
                        )}
                        {v.createdAt && (
                          <span className="text-[11px] text-muted-foreground">
                            <RelativeDateDisplay.Value value={v.createdAt} />
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="flex-1 overflow-auto p-5">
            {versionLoading && !version ? (
              <div className="flex h-full items-center justify-center">
                <Spinner />
              </div>
            ) : version ? (
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-mono text-sm font-medium">
                      {version.name}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {version.description}
                    </p>
                  </div>
                  {canRestore && version._id !== activeVersionId && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleRestore(version._id)}
                      disabled={restoring}
                    >
                      <IconRestore className="size-4" /> Restore
                    </Button>
                  )}
                </div>
                {version.changedFields?.length ? (
                  <div className="flex flex-wrap gap-1">
                    {version.changedFields.map((f) => (
                      <Badge key={f} variant="secondary" className="h-5">
                        {f}
                      </Badge>
                    ))}
                  </div>
                ) : null}
                <pre className="whitespace-pre-wrap break-words rounded-md border bg-muted/40 p-3 font-mono text-xs">
                  {version.instructions || '—'}
                </pre>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Select a version to preview.
              </div>
            )}
          </div>
        </div>

        <Dialog.Footer className="border-t px-5 py-3.5">
          <Dialog.Close asChild>
            <Button variant="outline" size="sm">
              Close
            </Button>
          </Dialog.Close>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  );
};
