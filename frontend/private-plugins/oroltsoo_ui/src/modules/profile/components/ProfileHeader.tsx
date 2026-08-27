import {
  IconBuildingCommunity,
  IconCalendar,
  IconFlag,
  IconMapPin,
} from '@tabler/icons-react';
import { Avatar, Badge, readImage } from 'erxes-ui';
import { UseFormReturn } from 'react-hook-form';

import {
  MANDATE_TYPE_OPTIONS,
  PROFILE_STATUS_OPTIONS,
  REVIEW_STATUS_OPTIONS,
} from '../constants/profileConstants';
import { formatDate } from '@/shared/utils/format';
import { ProfileFormValues } from '../constants/profileFormSchema';
import { IProfile } from '../types/profile';

const MetaItem = ({
  icon: Icon,
  value,
}: {
  icon: typeof IconFlag;
  value?: string;
}) =>
  value ? (
    <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
      <Icon className="size-4" />
      {value}
    </span>
  ) : null;

export const ProfileHeader = ({
  profile,
  form,
}: {
  profile: IProfile;
  form: UseFormReturn<ProfileFormValues>;
}) => {
  const values = form.watch();

  const name =
    [values.lastName, values.firstName].filter(Boolean).join(' ') ||
    'Нэр оруулаагүй';
  const status = PROFILE_STATUS_OPTIONS.find(
    (option) => option.value === values.status,
  );
  const mandate = MANDATE_TYPE_OPTIONS.find(
    (option) => option.value === values.mandateType,
  );
  const term = [formatDate(values.termStart), formatDate(values.termEnd)]
    .filter(Boolean)
    .join(' – ');

  const review = REVIEW_STATUS_OPTIONS.find(
    (option) => option.value === (profile.reviewStatus ?? 'pending'),
  );

  return (
    <div className="border-b bg-background">
      {values.coverImage && (
        <img
          src={readImage(values.coverImage)}
          alt={name}
          className="h-28 w-full object-cover"
        />
      )}
      <div className="flex flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center">
        <Avatar size="xl" className="size-16">
          <Avatar.Image src={readImage(values.avatar)} alt={name} />
          <Avatar.Fallback>{name.charAt(0)}</Avatar.Fallback>
        </Avatar>

        <div className="min-w-0 flex-auto">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate text-xl font-semibold">{name}</h1>
            {status && <Badge variant={status.badge}>{status.label}</Badge>}
            {mandate && (
              <Badge variant="secondary">{mandate.label} гишүүн</Badge>
            )}
            {review && <Badge variant={review.badge}>{review.label}</Badge>}
            {values.promises.length > 0 && (
              <Badge variant="secondary">
                Амлалт {values.promises.length}
              </Badge>
            )}
          </div>

          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
            <MetaItem icon={IconFlag} value={values.position} />
            <MetaItem icon={IconFlag} value={values.party} />
            <MetaItem icon={IconBuildingCommunity} value={values.organization} />
            <MetaItem icon={IconMapPin} value={values.district} />
            <MetaItem icon={IconCalendar} value={term} />
          </div>

          {profile.reviewStatus === 'rejected' && profile.reviewNote && (
            <p className="mt-3 rounded-md border border-destructive/20 bg-destructive/5 p-3 text-sm">
              <span className="font-medium">Татгалзсан шалтгаан: </span>
              {profile.reviewNote}
            </p>
          )}

          {profile.updatedAt && (
            <p className="mt-1 text-xs text-muted-foreground">
              Сүүлд шинэчилсэн:{' '}
              {new Date(profile.updatedAt).toLocaleString('mn-MN')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
