import { UseFormReturn } from 'react-hook-form';

import { ProfileFormValues } from '../../constants/profileFormSchema';
import { ProfileAttendanceField } from './ProfileAttendanceField';
import { ProfileBillsField } from './ProfileBillsField';
import { ProfileTextareaField } from './ProfileFields';
import { ProfilePromisesField } from './ProfilePromisesField';

export const ProfileActivitySection = ({
  form,
}: {
  form: UseFormReturn<ProfileFormValues>;
}) => (
  <div className="flex flex-col gap-6">
    <ProfileTextareaField
      control={form.control}
      name="achievements"
      label="Хийсэн ажил"
      placeholder="Хэрэгжүүлсэн төсөл, санаачилга"
      rows={5}
    />
    <ProfileTextareaField
      control={form.control}
      name="policyStance"
      label="Бодлого, байр суурь"
      placeholder="Гол бодлогын чиглэл, байр суурь"
      rows={5}
    />
    <ProfilePromisesField form={form} />
    <ProfileBillsField form={form} />
    <ProfileTextareaField
      control={form.control}
      name="parliamentActivity"
      label="УИХ дахь үйл ажиллагаа"
      placeholder="Хууль санаачилга, хэлэлцүүлэг, хороодын ажил"
      rows={5}
    />
    <ProfileAttendanceField form={form} />
    <ProfileTextareaField
      control={form.control}
      name="votingSummary"
      label="Санал хураалт"
      placeholder="Чухал санал хураалтад өгсөн санал, тайлбар"
      rows={5}
    />
  </div>
);
