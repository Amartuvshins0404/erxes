import { IconPlus, IconTrash } from '@tabler/icons-react';
import { Button } from 'erxes-ui';
import { useFieldArray, UseFormReturn } from 'react-hook-form';

import {
  BILL_ROLE_OPTIONS,
  BILL_STAGE_OPTIONS,
} from '../../constants/profileConstants';
import { ProfileFormValues } from '../../constants/profileFormSchema';
import {
  ProfileDateField,
  ProfileSelectField,
  ProfileTextField,
  ProfileTextareaField,
} from './ProfileFields';

export const ProfileBillsField = ({
  form,
}: {
  form: UseFormReturn<ProfileFormValues>;
}) => {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'bills',
  });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium">Хууль санаачилга</div>
          <p className="text-xs text-muted-foreground">
            Өргөн барьсан хуулийн төсөл, түүний явц.
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() =>
            append({
              title: '',
              stage: 'submitted',
              role: 'sponsor',
              submittedAt: null,
              url: '',
              description: '',
            })
          }
        >
          <IconPlus />
          Төсөл нэмэх
        </Button>
      </div>

      {fields.length === 0 ? (
        <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
          Хуулийн төсөл бүртгэгдээгүй байна.
        </p>
      ) : (
        fields.map((field, index) => (
          <div key={field.id} className="rounded-lg border p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-medium">Төсөл {index + 1}</span>
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
                name={`bills.${index}.title`}
                label="Хуулийн төслийн нэр"
                placeholder="Жишээ нь: Боловсролын тухай хууль"
              />
              <ProfileSelectField
                control={form.control}
                name={`bills.${index}.stage`}
                label="Явц"
                options={BILL_STAGE_OPTIONS}
              />
              <ProfileSelectField
                control={form.control}
                name={`bills.${index}.role`}
                label="Үүрэг"
                options={BILL_ROLE_OPTIONS}
              />
              <ProfileDateField
                control={form.control}
                name={`bills.${index}.submittedAt`}
                label="Өргөн барьсан огноо"
              />
              <ProfileTextField
                control={form.control}
                name={`bills.${index}.url`}
                label="Эх сурвалж"
                placeholder="https://"
              />
            </div>
            <div className="mt-4">
              <ProfileTextareaField
                control={form.control}
                name={`bills.${index}.description`}
                label="Тайлбар"
                placeholder="Төслийн зорилго, гол өөрчлөлт"
                rows={3}
              />
            </div>
          </div>
        ))
      )}
    </div>
  );
};
