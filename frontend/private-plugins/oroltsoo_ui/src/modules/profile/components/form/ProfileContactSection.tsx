import { UseFormReturn } from 'react-hook-form';

import { ProfileFormValues } from '../../constants/profileFormSchema';
import {
  ProfileSectionTitle,
  ProfileTextField,
  ProfileTextareaField,
} from './ProfileFields';

export const ProfileContactSection = ({
  form,
}: {
  form: UseFormReturn<ProfileFormValues>;
}) => {
  const { control } = form;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <ProfileTextField
          control={control}
          name="contact.email"
          label="И-мэйл"
          placeholder="name@example.mn"
        />
        <ProfileTextField
          control={control}
          name="contact.phone"
          label="Утас"
          placeholder="99001122"
        />
        <ProfileTextField
          control={control}
          name="contact.officeHours"
          label="Ажиллах цаг"
          placeholder="Даваа–Баасан 09:00–18:00"
        />
      </div>

      <ProfileTextareaField
        control={control}
        name="contact.address"
        label="Хаяг"
        placeholder="Албан өрөө, байршил"
        rows={3}
      />

      <div className="flex flex-col gap-4">
        <ProfileSectionTitle>Иргэдэд зориулсан</ProfileSectionTitle>
        <ProfileTextareaField
          control={control}
          name="feedbackNote"
          label="Санал хүсэлт хэрхэн ирүүлэх"
          placeholder="Иргэд санал хүсэлтээ ямар сувгаар, хэрхэн ирүүлэх вэ"
          rows={4}
        />
        <ProfileTextareaField
          control={control}
          name="requestProcessNote"
          label="Хүсэлтийн явц"
          placeholder="Ирсэн хүсэлт хэрхэн шийдэгддэг, хариу өгөх хугацаа"
          rows={4}
        />
      </div>

      <div className="flex flex-col gap-4">
        <ProfileSectionTitle>Сошиал хаягууд</ProfileSectionTitle>
        <div className="grid gap-4 sm:grid-cols-2">
          <ProfileTextField
            control={control}
            name="contact.socialLinks.facebook"
            label="Facebook"
            placeholder="https://facebook.com/..."
          />
          <ProfileTextField
            control={control}
            name="contact.socialLinks.twitter"
            label="X (Twitter)"
            placeholder="https://x.com/..."
          />
          <ProfileTextField
            control={control}
            name="contact.socialLinks.instagram"
            label="Instagram"
            placeholder="https://instagram.com/..."
          />
          <ProfileTextField
            control={control}
            name="contact.socialLinks.youtube"
            label="Youtube"
            placeholder="https://youtube.com/..."
          />
          <ProfileTextField
            control={control}
            name="contact.socialLinks.website"
            label="Вэб хуудас"
            placeholder="https://..."
          />
        </div>
      </div>
    </div>
  );
};
