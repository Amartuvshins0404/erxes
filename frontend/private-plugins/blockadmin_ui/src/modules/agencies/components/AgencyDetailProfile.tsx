import {
  IconCalendarEvent,
  IconMapPinFilled,
  IconWorld,
} from '@tabler/icons-react';
import { Avatar, Badge, readImage } from 'erxes-ui';
import { useAgencyDetail } from '../hooks/useAgencyDetail';
import { AgencyRejectionReasons } from '../types/agencyTypes';
import { AgencyVerificationStatus } from './AgencyCard';
import { AgencyDetailActions } from './AgencyDetailActions';

const getInitials = (value?: string) =>
  (value || '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join('');

const getRejectionReasonLabel = (reason: string) =>
  AgencyRejectionReasons[reason as keyof typeof AgencyRejectionReasons] ??
  reason;

export const AgencyDetailProfile = () => {
  const { agency } = useAgencyDetail();

  if (!agency) return null;

  const {
    name,
    brandName,
    type,
    logo,
    website,
    dateFounded,
    operationArea,
    verificationStatus,
    rejectionReasons,
  } = agency;

  return (
    <div className="flex border-b">
      <div className="flex gap-4 p-8">
        <Avatar size="xl" className="size-14 rounded-lg flex-none">
          {logo?.url && (
            <Avatar.Image
              src={readImage(logo.url)}
              alt={name}
              className="rounded-lg object-contain"
            />
          )}
          <Avatar.Fallback className="rounded-lg bg-primary/10 text-primary font-semibold">
            {getInitials(brandName || name)}
          </Avatar.Fallback>
        </Avatar>

        <div className="space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-medium leading-none">{name}</h1>
            <AgencyVerificationStatus verificationStatus={verificationStatus} />
            {type && <Badge variant="secondary">{type}</Badge>}

            {/* {verificationStatus === 'unverified' &&
              !!rejectionReasons?.length && (
                <p className="text-sm text-destructive">
                  Rejected:{' '}
                  {rejectionReasons.map(getRejectionReasonLabel).join(', ')}
                </p>
              )} */}
          </div>

          <div className="flex items-center gap-4 flex-wrap text-accent-foreground text-sm">
            {brandName && <span>{brandName}</span>}
            {dateFounded && (
              <span className="inline-flex items-center gap-1.5">
                <IconCalendarEvent className="size-4" />
                Est. {dateFounded}
              </span>
            )}
            {operationArea?.city && (
              <span className="inline-flex items-center gap-1.5">
                <IconMapPinFilled className="size-4" />
                {[operationArea.district, operationArea.city]
                  .filter(Boolean)
                  .join(', ')}
              </span>
            )}
            {website && (
              <a
                href={website}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 hover:text-foreground"
              >
                <IconWorld className="size-4" />
                {website}
              </a>
            )}
          </div>
        </div>
      </div>
      <div className="ml-auto p-8">
        <AgencyDetailActions />
      </div>
    </div>
  );
};
