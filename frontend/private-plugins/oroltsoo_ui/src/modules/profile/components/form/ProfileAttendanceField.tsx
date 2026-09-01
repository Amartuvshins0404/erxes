import { UseFormReturn } from 'react-hook-form';

import { ProfileFormValues } from '../../constants/profileFormSchema';
import {
  ProfileOptionalNumberField,
  ProfileTextField,
} from './ProfileFields';

export const ProfileAttendanceField = ({
  form,
}: {
  form: UseFormReturn<ProfileFormValues>;
}) => (
  <div className="flex flex-col gap-3">
    <div>
      <div className="text-sm font-medium">Ирц, оролцоо</div>
      <p className="text-xs text-muted-foreground">
        Хоосон орхивол профайл дээр харагдахгүй.
      </p>
    </div>

    <div className="rounded-lg border p-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <ProfileTextField
          control={form.control}
          name="attendance.periodLabel"
          label="Хамрах хугацаа"
          placeholder="Жишээ нь: 2025 оны намрын чуулган"
        />
        <ProfileTextField
          control={form.control}
          name="attendance.sourceUrl"
          label="Эх сурвалж"
          placeholder="https://"
        />
        <ProfileOptionalNumberField
          control={form.control}
          name="attendance.sessionAttendanceRate"
          label="Чуулганы ирц"
          min={0}
          max={100}
          suffix="%"
        />
        <ProfileOptionalNumberField
          control={form.control}
          name="attendance.committeeAttendanceRate"
          label="Хорооны ирц"
          min={0}
          max={100}
          suffix="%"
        />
        <ProfileOptionalNumberField
          control={form.control}
          name="attendance.attendedSessions"
          label="Оролцсон хуралдаан"
          min={0}
        />
        <ProfileOptionalNumberField
          control={form.control}
          name="attendance.totalSessions"
          label="Нийт хуралдаан"
          min={0}
        />
      </div>
    </div>
  </div>
);
