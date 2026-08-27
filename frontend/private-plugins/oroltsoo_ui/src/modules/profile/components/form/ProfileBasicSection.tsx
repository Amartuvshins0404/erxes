import { UseFormReturn } from 'react-hook-form';

import {
  MANDATE_TYPE_OPTIONS,
  PROFILE_STATUS_OPTIONS,
} from '../../constants/profileConstants';
import { ProfileFormValues } from '../../constants/profileFormSchema';
import {
  ProfileDateField,
  ProfileOptionalSelectField,
  ProfileSectionTitle,
  ProfileSelectField,
  ProfileTextField,
  ProfileTextareaField,
} from './ProfileFields';
import { ProfileImageField } from './ProfileImageField';

export const ProfileBasicSection = ({
  form,
}: {
  form: UseFormReturn<ProfileFormValues>;
}) => {
  const { control } = form;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <ProfileImageField
          control={control}
          name="avatar"
          label="Профайлын зураг"
          description="Жагсаалт болон профайлын толгойд харагдана."
        />
        <ProfileImageField
          control={control}
          name="coverImage"
          label="Ковер зураг"
          description="Профайлын толгой хэсгийн дэвсгэр зураг."
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <ProfileTextField
          control={control}
          name="lastName"
          label="Овог"
          placeholder="Жишээ нь: Дорж"
        />
        <ProfileTextField
          control={control}
          name="firstName"
          label="Нэр"
          placeholder="Жишээ нь: Батбаяр"
        />
        <ProfileTextField
          control={control}
          name="position"
          label="Албан тушаал"
          placeholder="Жишээ нь: УИХ-ын гишүүн"
        />
        <ProfileTextField
          control={control}
          name="party"
          label="Нам"
          placeholder="Харьяалагдах нам"
        />
        <ProfileTextField
          control={control}
          name="organization"
          label="Байгууллага"
          placeholder="Ажиллаж буй байгууллага"
        />
        <ProfileSelectField
          control={control}
          name="status"
          label="Төлөв"
          options={PROFILE_STATUS_OPTIONS}
        />
        <ProfileTextField
          control={control}
          name="district"
          label="Тойрог"
          placeholder="Жишээ нь: 12 дугаар тойрог"
        />
        <ProfileTextField
          control={control}
          name="territory"
          label="Нутаг дэвсгэр"
          placeholder="Жишээ нь: Улаанбаатар"
        />
        <ProfileOptionalSelectField
          control={control}
          name="mandateType"
          label="Мандатын төрөл"
          options={MANDATE_TYPE_OPTIONS}
          emptyLabel="Сонгоогүй"
        />
        <ProfileDateField
          control={control}
          name="termStart"
          label="Бүрэн эрх эхэлсэн"
        />
        <ProfileDateField
          control={control}
          name="termEnd"
          label="Бүрэн эрх дуусах"
        />
      </div>

      <div className="flex flex-col gap-4">
        <ProfileSectionTitle>Үндсэн мэдээлэл</ProfileSectionTitle>
        <ProfileTextareaField
          control={control}
          name="introduction"
          label="Танилцуулга"
          placeholder="Намтар, боловсрол, туршлага"
          rows={6}
        />
        <ProfileTextareaField
          control={control}
          name="positionDescription"
          label="Албан тушаалын тайлбар"
          placeholder="Хариуцаж буй чиг үүрэг, гишүүнчлэл"
        />
        <ProfileTextareaField
          control={control}
          name="territoryDescription"
          label="Төлөөлж буй нутаг дэвсгэр"
          placeholder="Тойрог, сонгогчдын талаарх мэдээлэл"
        />
      </div>
    </div>
  );
};
