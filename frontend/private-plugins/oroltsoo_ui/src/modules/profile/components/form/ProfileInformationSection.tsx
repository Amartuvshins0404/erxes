import { UseFormReturn } from 'react-hook-form';

import { ProfileFormValues } from '../../constants/profileFormSchema';
import { ProfileTextareaField } from './ProfileFields';
import { ProfileLinkListField } from './ProfileLinkListField';

export const ProfileInformationSection = ({
  form,
}: {
  form: UseFormReturn<ProfileFormValues>;
}) => (
  <div className="flex flex-col gap-6">
    <ProfileLinkListField
      form={form}
      name="newsLinks"
      title="Мэдээ"
      description="Улс төрчийн талаарх мэдээ, нийтлэлийн холбоос."
      addLabel="Мэдээ нэмэх"
      emptyLabel="Мэдээний холбоос нэмэгдээгүй байна."
    />
    <ProfileLinkListField
      form={form}
      name="reports"
      title="Тайлан"
      description="Тайлан, судалгааны баримт бичгийн холбоос."
      addLabel="Тайлан нэмэх"
      emptyLabel="Тайлан нэмэгдээгүй байна."
    />
    <ProfileTextareaField
      control={form.control}
      name="transparencyNote"
      label="Ил тод байдал"
      placeholder="Хөрөнгө орлогын мэдүүлэг, санхүүжилт, ашиг сонирхлын мэдээлэл"
      rows={6}
    />
  </div>
);
