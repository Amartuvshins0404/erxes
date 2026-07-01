import { FieldValues, useForm, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ZodType } from 'zod';

// Collapses the create/edit form boilerplate shared by the plugin's form pages:
// a zod-resolved react-hook-form whose values reactively follow the loaded
// record in edit mode. react-hook-form resets to `values` when they change (and
// deep-compares, so refetching identical data never clobbers user edits).
// `load` maps the fetched record to form values.
export const useResourceForm = <T extends FieldValues, R>({
  schema,
  defaults,
  isEdit,
  record,
  load,
}: {
  schema: ZodType<T>;
  defaults: T;
  isEdit: boolean;
  record: R | null | undefined;
  load: (record: R) => T;
}): UseFormReturn<T> =>
  useForm<T>({
    resolver: zodResolver(schema),
    defaultValues: defaults as never,
    values: isEdit && record ? load(record) : undefined,
  });
