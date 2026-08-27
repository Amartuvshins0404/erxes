import {
  IconFlag,
  IconMapPin,
  IconPhotoCirclePlus,
  IconProgress,
  IconWorld,
} from '@tabler/icons-react';
import { Avatar, Badge, readImage } from 'erxes-ui';
import { Link } from 'react-router-dom';

import { MetaLine } from '@/shared/utils/format';
import { REVIEW_STATUS_OPTIONS } from '../constants/profileConstants';
import { IAdminProfile } from '../types/profile';

export const AdminProfileCard = ({ profile }: { profile: IAdminProfile }) => {
  const name =
    profile.fullName ||
    [profile.lastName, profile.firstName].filter(Boolean).join(' ') ||
    'Нэр оруулаагүй';
  const review = REVIEW_STATUS_OPTIONS.find(
    (option) => option.value === profile.reviewStatus,
  );

  return (
    <Link
      to={`/oroltsooadmin/profiles/${profile._id}`}
      className="flex flex-col gap-3 rounded-[1.25rem] border bg-accent p-2 transition-colors hover:bg-accent/70"
    >
      <div className="relative flex aspect-2/1 w-full items-center justify-center overflow-hidden rounded-xl">
        {profile.coverImage ? (
          <img
            src={readImage(profile.coverImage)}
            alt={name}
            className="absolute inset-0 object-cover object-center"
          />
        ) : (
          <IconPhotoCirclePlus className="size-8 text-muted-foreground" />
        )}
        <div className="absolute inset-0 rounded-xl border border-foreground/10" />
      </div>

      <div className="space-y-2 p-3 pt-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <Avatar size="lg">
              <Avatar.Image src={readImage(profile.avatar)} alt={name} />
              <Avatar.Fallback>{name.charAt(0)}</Avatar.Fallback>
            </Avatar>
            <h3 className="truncate text-lg font-medium leading-6">{name}</h3>
          </div>
          <Badge variant={review?.badge ?? 'warning'} className="flex-none">
            {review?.label ?? 'Хүлээгдэж буй'}
          </Badge>
        </div>

        <MetaLine
          icon={IconFlag}
          value={[profile.position, profile.party].filter(Boolean).join(' · ')}
        />
        <MetaLine icon={IconMapPin} value={profile.district} />
        <MetaLine icon={IconWorld} value={profile.subdomain} />
        <MetaLine
          icon={IconProgress}
          value={`Амлалтын явц ${profile.promiseProgress ?? 0}%`}
        />
      </div>
    </Link>
  );
};
