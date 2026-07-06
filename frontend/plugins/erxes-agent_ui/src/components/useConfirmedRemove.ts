import { useCallback } from 'react';
import { useConfirm } from 'erxes-ui';

export type ConfirmRemoveOptions = {
  message: string;
  okLabel?: string;
  cancelLabel?: string;
  description?: string;
  confirmationValue?: string;
};

/**
 * Confirm-then-remove for every row/entity delete in the plugin.
 *
 * `useConfirm().confirm()` resolves only when the user confirms and never
 * rejects on cancel (cancel just never resolves), so the common
 * `confirm(...).then(() => removeX())` shape leaves the remove mutation's own
 * promise unhandled — a rejected mutation becomes an unhandled rejection even
 * though its `onError`/toast already fired. This hook wraps that pattern once:
 * it prompts, then on confirm runs `remove` and swallows its rejection (the
 * mutation still reports failures through its Apollo `onError`).
 *
 * `remove` returns the mutation's promise; the caller keeps ownership of the
 * mutation (variables, cache updates, toasts) and passes only the invocation.
 */
export const useConfirmedRemove = () => {
  const { confirm } = useConfirm();

  const confirmRemove = useCallback(
    (options: ConfirmRemoveOptions, remove: () => Promise<unknown>): void => {
      const {
        message,
        okLabel = 'Delete',
        cancelLabel = 'Cancel',
        description,
        confirmationValue,
      } = options;

      void confirm({
        message,
        options: { okLabel, cancelLabel, description, confirmationValue },
      }).then(() => {
        void Promise.resolve(remove()).catch(() => undefined);
      });
    },
    [confirm],
  );

  return { confirmRemove };
};
