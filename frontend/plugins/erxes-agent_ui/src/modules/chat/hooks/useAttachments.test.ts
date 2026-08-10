/** @jest-environment jsdom */

import { act, renderHook } from '@testing-library/react';
import { useAttachments } from './useAttachments';

jest.mock('erxes-ui', () => ({
  useToast: () => ({ toast: jest.fn() }),
}));

// Staging is pure client state — no upload happens until send — so addFiles can
// be exercised directly. Empty (0-byte) and oversize files must be rejected up
// front with a friendly, chip-level error instead of blocking the whole send.
describe('useAttachments.addFiles guards', () => {
  it('rejects a 0-byte file with a friendly error and does not stage it', () => {
    const { result } = renderHook(() => useAttachments(true));

    act(() => {
      result.current.addFiles([new File([], 'empty.txt', { type: 'text/plain' })]);
    });

    expect(result.current.pendingAtts).toHaveLength(1);
    const att = result.current.pendingAtts[0];
    expect(att.status).toBe('error');
    expect(att.error).toBe('This file is empty');
    // Nothing to upload: the raw File is never held for an empty attachment.
    expect(att.file).toBeUndefined();
  });

  it('stages a non-empty file as ready', () => {
    const { result } = renderHook(() => useAttachments(true));

    act(() => {
      result.current.addFiles([
        new File(['hello'], 'note.txt', { type: 'text/plain' }),
      ]);
    });

    expect(result.current.pendingAtts).toHaveLength(1);
    expect(result.current.pendingAtts[0].status).toBe('ready');
  });

  it('does nothing when attachments are disabled', () => {
    const { result } = renderHook(() => useAttachments(false));

    act(() => {
      result.current.addFiles([new File([], 'empty.txt', { type: 'text/plain' })]);
    });

    expect(result.current.pendingAtts).toHaveLength(0);
  });
});
