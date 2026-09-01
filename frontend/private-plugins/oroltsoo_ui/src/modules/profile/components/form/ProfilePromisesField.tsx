import { IconPlus, IconTrash } from '@tabler/icons-react';
import { Button } from 'erxes-ui';
import { useFieldArray, UseFormReturn } from 'react-hook-form';

import { PROMISE_STATUS_OPTIONS } from '../../constants/profileConstants';
import { ProfileFormValues } from '../../constants/profileFormSchema';
import {
  ProfileNumberField,
  ProfileSelectField,
  ProfileTextField,
  ProfileTextareaField,
} from './ProfileFields';

export const ProfilePromisesField = ({
  form,
}: {
  form: UseFormReturn<ProfileFormValues>;
}) => {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'promises',
  });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium">Амлалт ба хэрэгжилт</div>
          <p className="text-xs text-muted-foreground">
            Амлалт бүрийн хэрэгжилтийн явцыг хувиар бүртгэнэ.
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() =>
            append({
              title: '',
              description: '',
              status: 'planned',
              progress: 0,
            })
          }
        >
          <IconPlus />
          Амлалт нэмэх
        </Button>
      </div>

      {fields.length === 0 ? (
        <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
          Одоогоор амлалт бүртгэгдээгүй байна.
        </p>
      ) : (
        fields.map((field, index) => (
          <div key={field.id} className="rounded-lg border p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-medium">Амлалт {index + 1}</span>
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
                name={`promises.${index}.title`}
                label="Гарчиг"
                placeholder="Амлалтын нэр"
              />
              <ProfileSelectField
                control={form.control}
                name={`promises.${index}.status`}
                label="Төлөв"
                options={PROMISE_STATUS_OPTIONS}
              />
              <ProfileNumberField
                control={form.control}
                name={`promises.${index}.progress`}
                label="Хэрэгжилт"
                min={0}
                max={100}
                suffix="%"
              />
            </div>
            <div className="mt-4">
              <ProfileTextareaField
                control={form.control}
                name={`promises.${index}.description`}
                label="Тайлбар"
                placeholder="Хэрэгжилтийн явц, хийгдсэн ажил"
                rows={3}
              />
            </div>
          </div>
        ))
      )}
    </div>
  );
};
