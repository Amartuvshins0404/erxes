import { useCallback, useEffect, useRef, useState } from 'react';
import { UseFormReturn, FieldValues } from 'react-hook-form';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

type Options<T extends FieldValues> = {
  form: UseFormReturn<T>;
  onSave: (data: T) => Promise<void>;
  debounceMs?: number;
};

export const useAutoSave = <T extends FieldValues>({
  form,
  onSave,
  debounceMs = 1500,
}: Options<T>) => {
  const [status, setStatus] = useState<SaveStatus>('idle');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(false);

  const save = useCallback(
    async (data: T) => {
      setStatus('saving');
      try {
        await onSave(data);
        setStatus('saved');
        setTimeout(() => setStatus('idle'), 2500);
      } catch {
        setStatus('error');
      }
    },
    [onSave],
  );

  useEffect(() => {
    const subscription = form.watch((values) => {
      if (!isMountedRef.current) return;
      if (!form.formState.isDirty) return;

      if (timerRef.current) clearTimeout(timerRef.current);
      setStatus('idle');

      timerRef.current = setTimeout(() => {
        form.handleSubmit((data) => save(data as T))();
      }, debounceMs);
    });

    return () => {
      subscription.unsubscribe();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [form, save, debounceMs]);

  // Mark mounted after first render so initial reset doesn't trigger save
  useEffect(() => {
    const t = setTimeout(() => {
      isMountedRef.current = true;
    }, 100);
    return () => clearTimeout(t);
  }, []);

  return { status };
};
