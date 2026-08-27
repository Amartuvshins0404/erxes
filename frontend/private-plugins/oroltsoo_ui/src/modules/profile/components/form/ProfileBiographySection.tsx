import { IconPlus, IconTrash } from '@tabler/icons-react';
import { Button } from 'erxes-ui';
import { useFieldArray, UseFormReturn } from 'react-hook-form';

import { ProfileFormValues } from '../../constants/profileFormSchema';
import {
  ProfileOptionalNumberField,
  ProfileTextField,
  ProfileTextareaField,
} from './ProfileFields';

const ProfileEducationField = ({
  form,
}: {
  form: UseFormReturn<ProfileFormValues>;
}) => {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'education',
  });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium">Боловсрол</div>
          <p className="text-xs text-muted-foreground">
            Төгссөн сургууль, эзэмшсэн зэрэг.
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() =>
            append({
              school: '',
              degree: '',
              field: '',
              startYear: null,
              endYear: null,
            })
          }
        >
          <IconPlus />
          Боловсрол нэмэх
        </Button>
      </div>

      {fields.length === 0 ? (
        <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
          Боловсролын мэдээлэл нэмэгдээгүй байна.
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
                name={`education.${index}.school`}
                label="Сургууль"
                placeholder="Их сургуулийн нэр"
              />
              <ProfileTextField
                control={form.control}
                name={`education.${index}.degree`}
                label="Зэрэг"
                placeholder="Бакалавр, магистр, доктор"
              />
              <ProfileTextField
                control={form.control}
                name={`education.${index}.field`}
                label="Мэргэжил"
                placeholder="Эрх зүй, эдийн засаг гэх мэт"
              />
              <div className="grid grid-cols-2 gap-3">
                <ProfileOptionalNumberField
                  control={form.control}
                  name={`education.${index}.startYear`}
                  label="Элссэн он"
                  placeholder="2010"
                />
                <ProfileOptionalNumberField
                  control={form.control}
                  name={`education.${index}.endYear`}
                  label="Төгссөн он"
                  placeholder="2014"
                />
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

const ProfileCareerField = ({
  form,
}: {
  form: UseFormReturn<ProfileFormValues>;
}) => {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'career',
  });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium">Ажлын туршлага</div>
          <p className="text-xs text-muted-foreground">
            Улс төрд орохоос өмнөх болон дараах ажлын түүх.
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() =>
            append({
              organization: '',
              position: '',
              startYear: null,
              endYear: null,
              description: '',
            })
          }
        >
          <IconPlus />
          Ажил нэмэх
        </Button>
      </div>

      {fields.length === 0 ? (
        <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
          Ажлын туршлага нэмэгдээгүй байна.
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
                name={`career.${index}.organization`}
                label="Байгууллага"
                placeholder="Ажилласан байгууллага"
              />
              <ProfileTextField
                control={form.control}
                name={`career.${index}.position`}
                label="Албан тушаал"
                placeholder="Эрхэлж байсан албан тушаал"
              />
              <div className="grid grid-cols-2 gap-3">
                <ProfileOptionalNumberField
                  control={form.control}
                  name={`career.${index}.startYear`}
                  label="Эхэлсэн он"
                  placeholder="2015"
                />
                <ProfileOptionalNumberField
                  control={form.control}
                  name={`career.${index}.endYear`}
                  label="Дууссан он"
                  placeholder="2020"
                />
              </div>
            </div>
            <div className="mt-4">
              <ProfileTextareaField
                control={form.control}
                name={`career.${index}.description`}
                label="Тайлбар"
                placeholder="Хариуцаж байсан ажил, гол үр дүн"
                rows={3}
              />
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export const ProfileBiographySection = ({
  form,
}: {
  form: UseFormReturn<ProfileFormValues>;
}) => (
  <div className="flex flex-col gap-6">
    <ProfileEducationField form={form} />
    <ProfileCareerField form={form} />
  </div>
);
