import { IconPlus, IconTrash } from '@tabler/icons-react';
import { Button } from 'erxes-ui';
import { useFieldArray, UseFormReturn } from 'react-hook-form';

import { ProfileFormValues } from '../../constants/profileFormSchema';
import { ProfileDateField, ProfileTextField } from './ProfileFields';

export const ProfileLinkListField = ({
  form,
  name,
  title,
  description,
  addLabel,
  emptyLabel,
}: {
  form: UseFormReturn<ProfileFormValues>;
  name: 'reports' | 'newsLinks';
  title: string;
  description: string;
  addLabel: string;
  emptyLabel: string;
}) => {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name,
  });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium">{title}</div>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => append({ title: '', url: '', publishedAt: null })}
        >
          <IconPlus />
          {addLabel}
        </Button>
      </div>

      {fields.length === 0 ? (
        <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
          {emptyLabel}
        </p>
      ) : (
        fields.map((field, index) => (
          <div key={field.id} className="rounded-lg border p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-medium">{index + 1}.</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => remove(index)}
              >
                <IconTrash />
                Хасах
              </Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <ProfileTextField
                control={form.control}
                name={`${name}.${index}.title`}
                label="Гарчиг"
                placeholder="Нэр"
              />
              <ProfileTextField
                control={form.control}
                name={`${name}.${index}.url`}
                label="Холбоос"
                placeholder="https://"
              />
              <ProfileDateField
                control={form.control}
                name={`${name}.${index}.publishedAt`}
                label="Нийтэлсэн огноо"
              />
            </div>
          </div>
        ))
      )}
    </div>
  );
};
