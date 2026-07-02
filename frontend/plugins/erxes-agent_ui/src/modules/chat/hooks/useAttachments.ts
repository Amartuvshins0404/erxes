import { useEffect, useRef, useState } from 'react';
import { ChatAttachment, PendingAttachment } from '~/modules/chat/types';
import { randomIdSuffix } from '~/modules/chat/lib/ids';
import { uploadToStorage } from '~/modules/chat/lib/attachments';

// Reject files larger than this before uploading — the round trip to storage
// would only fail (or be slow) for oversize files.
const MAX_ATTACHMENT_MB = 25;
const MAX_ATTACHMENT_BYTES = MAX_ATTACHMENT_MB * 1024 * 1024;

// Composer attachment state + upload lifecycle. Shared by the composer chips
// and the chat-area drop overlay.
export const useAttachments = (enabled: boolean) => {
  const [pendingAtts, setPendingAtts] = useState<PendingAttachment[]>([]);

  // Revoke every outstanding preview object URL when the composer unmounts
  // (navigate away mid-compose) — removeAttachment/clear only cover explicit
  // removals.
  const pendingRef = useRef<PendingAttachment[]>([]);
  useEffect(() => {
    pendingRef.current = pendingAtts;
  });
  useEffect(
    () => () => {
      pendingRef.current.forEach(
        (a) => a.previewUrl && URL.revokeObjectURL(a.previewUrl),
      );
    },
    [],
  );

  // Stage selected files in the composer WITHOUT uploading — the upload is
  // deferred to send (uploadAll). Picking a file (or hitting a transient upload
  // error) therefore never costs a round-trip until the user commits to sending.
  const addFiles = (files: FileList | File[]) => {
    if (!enabled) return;
    const list = Array.from(files).slice(0, 10 - pendingAtts.length);

    const staged: PendingAttachment[] = [];
    for (let file of list) {
      // Clipboard screenshots all arrive as "image.png" — give each a distinct,
      // readable name before it becomes the stored file name.
      if (/^image\.\w+$/i.test(file.name || '') || !file.name) {
        const ext = (file.type.split('/')[1] || 'png').replace('jpeg', 'jpg');
        const stamp = new Date()
          .toISOString()
          .replace(/[:T]/g, '-')
          .slice(0, 19);
        file = new File([file], `screenshot-${stamp}.${ext}`, {
          type: file.type,
        });
      }

      const id = `att-${Date.now()}-${randomIdSuffix(6)}`;

      // Reject oversize files up front — mark them errored without staging the
      // file (nothing to upload) or a preview URL that would need cleanup.
      if (file.size > MAX_ATTACHMENT_BYTES) {
        staged.push({
          id,
          name: file.name,
          type: file.type || 'application/octet-stream',
          size: file.size,
          status: 'error',
          error: `File exceeds the ${MAX_ATTACHMENT_MB} MB limit`,
        });
        continue;
      }

      // Hold the File for the deferred upload; 'ready' = staged, not yet sent.
      staged.push({
        id,
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        file,
        previewUrl: file.type.startsWith('image/')
          ? URL.createObjectURL(file)
          : undefined,
        status: 'ready',
      });
    }
    if (staged.length) setPendingAtts((prev) => [...prev, ...staged]);
  };

  const removeAttachment = (id: string) => {
    setPendingAtts((prev) => {
      const target = prev.find((a) => a.id === id);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((a) => a.id !== id);
    });
  };

  const clear = () => {
    pendingAtts.forEach(
      (a) => a.previewUrl && URL.revokeObjectURL(a.previewUrl),
    );
    setPendingAtts([]);
  };

  const uploadsInFlight = pendingAtts.some((a) => a.status === 'uploading');

  // Upload everything staged, then report whether the batch is safe to send.
  // Called on send (not on select): every staged file (and any that failed a
  // prior attempt) is uploaded now. Success marks it done; failure marks it
  // errored and keeps it in the composer so the user can retry (send again) or
  // remove it. Returns the uploaded attachments and `ok` — false if any failed,
  // so the caller can abort the send without dropping the file silently.
  const uploadAll = async (): Promise<{
    attachments: ChatAttachment[];
    ok: boolean;
  }> => {
    const current = pendingRef.current;
    // Entries already uploaded in a prior (partial) send carry straight through.
    const alreadyDone: ChatAttachment[] = current
      .filter((a) => a.status === 'done' && a.url)
      .map((a) => ({ url: a.url!, name: a.name, type: a.type, size: a.size }));

    const targets = current.filter((a) => a.file && a.status !== 'done');
    if (!targets.length) return { attachments: alreadyDone, ok: true };

    // Flip targets to uploading so their chips show the spinner.
    const ids = new Set(targets.map((t) => t.id));
    setPendingAtts((prev) =>
      prev.map((a) =>
        ids.has(a.id)
          ? { ...a, status: 'uploading' as const, error: undefined }
          : a,
      ),
    );

    // Build the result from the upload outcomes (the React state set above isn't
    // readable synchronously here), so the returned list is always accurate.
    const uploaded: ChatAttachment[] = [];
    let ok = true;
    await Promise.all(
      targets.map(async (t) => {
        try {
          const key = await uploadToStorage(t.file!);
          uploaded.push({ url: key, name: t.name, type: t.type, size: t.size });
          setPendingAtts((prev) =>
            prev.map((a) =>
              a.id === t.id
                ? { ...a, url: key, file: undefined, status: 'done' as const }
                : a,
            ),
          );
        } catch (err: unknown) {
          ok = false;
          setPendingAtts((prev) =>
            prev.map((a) =>
              a.id === t.id
                ? {
                    ...a,
                    status: 'error' as const,
                    error: (err as Error)?.message || 'Upload failed',
                  }
                : a,
            ),
          );
        }
      }),
    );

    return { attachments: [...alreadyDone, ...uploaded], ok };
  };

  // Whole-chat-area drop target + clipboard ingestion. `dragDepth` guards against
  // the flicker from dragenter/dragleave firing on every child; `isDragging`
  // drives the drop overlay in the view.
  const [isDragging, setIsDragging] = useState(false);
  const dragDepth = useRef(0);

  const onPaste = (e: React.ClipboardEvent) => {
    if (!enabled) return;
    const files = Array.from(e.clipboardData?.files || []);
    if (files.length) {
      e.preventDefault();
      addFiles(files);
    }
  };

  const onDragEnter = (e: React.DragEvent) => {
    if (!enabled || !e.dataTransfer?.types?.includes('Files')) return;
    e.preventDefault();
    dragDepth.current += 1;
    setIsDragging(true);
  };
  const onDragOver = (e: React.DragEvent) => {
    if (enabled) e.preventDefault();
  };
  const onDragLeave = (e: React.DragEvent) => {
    if (!enabled) return;
    e.preventDefault();
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0) setIsDragging(false);
  };
  const onDrop = (e: React.DragEvent) => {
    if (!enabled) return;
    e.preventDefault();
    dragDepth.current = 0;
    setIsDragging(false);
    if (e.dataTransfer?.files?.length) addFiles(e.dataTransfer.files);
  };

  return {
    pendingAtts,
    addFiles,
    removeAttachment,
    clear,
    uploadsInFlight,
    uploadAll,
    isDragging,
    onPaste,
    onDragEnter,
    onDragOver,
    onDragLeave,
    onDrop,
  };
};
