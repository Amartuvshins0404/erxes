import { IconPlus, IconTrash } from '@tabler/icons-react';
import { Button } from 'erxes-ui';
import { useFieldArray, UseFormReturn } from 'react-hook-form';

import { ProfileFormValues } from '../../constants/profileFormSchema';
import {
  ProfileDateField,
  ProfileNumberField,
  ProfileOptionalNumberField,
  ProfileSectionTitle,
  ProfileTextField,
} from './ProfileFields';

const ProfileDonationsField = ({
  form,
}: {
  form: UseFormReturn<ProfileFormValues>;
}) => {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'finance.donations',
  });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium">Хандив</div>
          <p className="text-xs text-muted-foreground">
            Зөвхөн олон нийтэд нээлттэй мэдүүлсэн хандивыг бүртгэнэ.
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() =>
            append({ donor: '', amount: 0, receivedAt: null, url: '' })
          }
        >
          <IconPlus />
          Хандив нэмэх
        </Button>
      </div>

      {fields.length === 0 ? (
        <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
          Хандив бүртгэгдээгүй байна.
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
                name={`finance.donations.${index}.donor`}
                label="Хандивлагч"
                placeholder="Хувь хүн эсвэл байгууллага"
              />
              <ProfileNumberField
                control={form.control}
                name={`finance.donations.${index}.amount`}
                label="Дүн"
                min={0}
                suffix="₮"
              />
              <ProfileDateField
                control={form.control}
                name={`finance.donations.${index}.receivedAt`}
                label="Хүлээн авсан огноо"
              />
              <ProfileTextField
                control={form.control}
                name={`finance.donations.${index}.url`}
                label="Эх сурвалж"
                placeholder="https://"
              />
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export const ProfileFinanceSection = ({
  form,
}: {
  form: UseFormReturn<ProfileFormValues>;
}) => {
  const { control } = form;

  return (
    <div className="flex flex-col gap-6">
      <p className="rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">
        Энэ хэсэгт зөвхөн албан ёсоор мэдүүлсэн, олон нийтэд нээлттэй баримтын
        холбоос болон дүнг оруулна. Мэдүүлгийн бичиг баримтыг өөрийг нь бүү
        байршуул.
      </p>

      <div className="flex flex-col gap-4">
        <ProfileSectionTitle>Хөрөнгө орлогын мэдүүлэг</ProfileSectionTitle>
        <div className="grid gap-4 sm:grid-cols-2">
          <ProfileTextField
            control={control}
            name="finance.assetDeclarationUrl"
            label="Мэдүүлгийн холбоос"
            placeholder="https://"
          />
          <ProfileDateField
            control={control}
            name="finance.assetDeclarationDate"
            label="Мэдүүлсэн огноо"
          />
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <ProfileSectionTitle>Ашиг сонирхлын мэдүүлэг</ProfileSectionTitle>
        <div className="grid gap-4 sm:grid-cols-2">
          <ProfileTextField
            control={control}
            name="finance.interestDeclarationUrl"
            label="Мэдүүлгийн холбоос"
            placeholder="https://"
          />
          <ProfileDateField
            control={control}
            name="finance.interestDeclarationDate"
            label="Мэдүүлсэн огноо"
          />
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <ProfileSectionTitle>Сонгуулийн зардал</ProfileSectionTitle>
        <div className="grid gap-4 sm:grid-cols-2">
          <ProfileOptionalNumberField
            control={control}
            name="finance.campaignExpense"
            label="Нийт зардал"
            min={0}
            suffix="₮"
          />
          <ProfileTextField
            control={control}
            name="finance.campaignExpenseUrl"
            label="Тайлангийн холбоос"
            placeholder="https://"
          />
        </div>
      </div>

      <ProfileDonationsField form={form} />
    </div>
  );
};
