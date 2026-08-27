import {
  IconBuildingCommunity,
  IconCalendar,
  IconFlag,
  IconMapPin,
  IconWorld,
} from '@tabler/icons-react';
import { Avatar, Badge, readImage } from 'erxes-ui';

import { formatDate, MetaItem } from '@/shared/utils/format';
import {
  MANDATE_TYPE_OPTIONS,
  REVIEW_STATUS_OPTIONS,
  TENANT_STATUS_OPTIONS,
} from '../../constants/profileConstants';
import { IAdminProfile } from '../../types/profile';

export const AdminProfileHeader = ({
  profile,
}: {
  profile: IAdminProfile;
}) => {
  const name =
    profile.fullName ||
    [profile.lastName, profile.firstName].filter(Boolean).join(' ');
  const review = REVIEW_STATUS_OPTIONS.find(
    (option) => option.value === profile.reviewStatus,
  );
  const tenantStatus = TENANT_STATUS_OPTIONS.find(
    (option) => option.value === profile.status,
  );
  const term = [formatDate(profile.termStart), formatDate(profile.termEnd)]
    .filter(Boolean)
    .join(' – ');
  const mandate = MANDATE_TYPE_OPTIONS.find(
    (option) => option.value === profile.mandateType,
  );

  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      {profile.coverImage && (
        <img
          src={readImage(profile.coverImage)}
          alt={name}
          className="h-40 w-full object-cover"
        />
      )}
      <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-start">
        <Avatar size="xl" className="size-20">
          <Avatar.Image src={readImage(profile.avatar)} alt={name} />
          <Avatar.Fallback>{name.charAt(0)}</Avatar.Fallback>
        </Avatar>

        <div className="flex-auto">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold">{name}</h1>
            <Badge variant={review?.badge ?? 'warning'}>
              {review?.label ?? 'Хүлээгдэж буй'}
            </Badge>
            {tenantStatus && (
              <Badge variant={tenantStatus.badge}>{tenantStatus.label}</Badge>
            )}
            {mandate && <Badge variant="secondary">{mandate.label} гишүүн</Badge>}
          </div>

          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
            <MetaItem icon={IconFlag} value={profile.position} />
            <MetaItem icon={IconFlag} value={profile.party} />
            <MetaItem
              icon={IconBuildingCommunity}
              value={profile.organization}
            />
          </div>

          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
            <MetaItem icon={IconMapPin} value={profile.district} />
            <MetaItem icon={IconMapPin} value={profile.territory} />
            <MetaItem icon={IconCalendar} value={term} />
            <MetaItem icon={IconWorld} value={profile.subdomain} />
          </div>

          {profile.reviewNote && (
            <p className="mt-4 rounded-md border border-destructive/20 bg-destructive/5 p-3 text-sm">
              <span className="font-medium">Хяналтын тэмдэглэл: </span>
              {profile.reviewNote}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
