import {
  IconBuilding,
  IconCalendarEvent,
  IconMail,
  IconMapPinFilled,
  IconPhone,
} from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { IAgency } from '../types/agencyTypes';
import { readImage } from 'erxes-ui/utils/core';
import { Avatar, Badge, Button } from 'erxes-ui';
import { AgencyVerificationStatus } from './AgencyCard';
import { PropertyTypeKey } from './SelectPropertyType';
import { PROPERTY_TYPE_LABELS } from '../constants';

const getInitials = (value?: string) =>
  (value || '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join('');

export const AgencyListItem = ({
  _id,
  name,
  brandName,
  type,
  logo,
  operationArea,
  verificationStatus,
  dateFounded,
  fieldsOfExpertise,
  brief,
  primaryEmail,
  primaryPhone,
}: IAgency) => {
  return (
    <div className="bg-background shadow-xs ba:rounded-xl p-4 flex ba:items-center gap-4 hover:shadow-lg hover:-translate-y-0.5 ba:transition-all ba:ease-in-out ba:duration-300">
      <Avatar size="xl" className="ba:size-14 ba:rounded-lg flex-none">
        {logo && (
          <Avatar.Image
            src={readImage(logo)}
            alt={name}
            className="ba:rounded-lg"
          />
        )}
        <Avatar.Fallback className="ba:rounded-lg bg-primary/10 text-primary font-semibold">
          {getInitials(brandName || name)}
        </Avatar.Fallback>
      </Avatar>

      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-semibold text-sm">{name}</h3>
          {brandName && (
            <span className="text-xs text-muted-foreground">{brandName}</span>
          )}
          {type && (
            <Badge variant={'secondary'} className="bg-background">
              {type}
            </Badge>
          )}
          <AgencyVerificationStatus verificationStatus={verificationStatus} />
        </div>
        {brief && (
          <p className="text-xs text-muted-foreground ba:line-clamp-1">
            {brief}
          </p>
        )}
        <div className="flex items-center gap-4 flex-wrap text-accent-foreground">
          <span className="flex items-center gap-1">
            <IconMapPinFilled className="size-3" />
            <p className="text-xs">
              {operationArea
                ? `${operationArea.district}, ${operationArea.city}`
                : 'No address'}
            </p>
          </span>
          {!!fieldsOfExpertise?.propertyTypes?.length && (
            <span className="flex items-center gap-1">
              <IconBuilding className="size-3" />
              <p className="text-xs">
                {fieldsOfExpertise.propertyTypes
                  .map((t) => PROPERTY_TYPE_LABELS[t as PropertyTypeKey])
                  .join(' · ')}
              </p>
            </span>
          )}
          {dateFounded && (
            <span className="flex items-center gap-1">
              <IconCalendarEvent className="size-3" />
              <p className="text-xs">Est. {dateFounded}</p>
            </span>
          )}
        </div>
      </div>

      <div className="flex-none hidden ba:md:flex flex-col items-end gap-1">
        {primaryEmail && (
          <a
            href={`mailto:${primaryEmail}`}
            className="flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <IconMail className="size-3" />
            {primaryEmail}
          </a>
        )}
        {primaryPhone && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <IconPhone className="size-3" />
            {primaryPhone}
          </span>
        )}
      </div>

      <Button variant={'outline'} asChild className="flex-none">
        <Link to={`/blockadmin/agencies/agencies/${_id}`}>View Profile</Link>
      </Button>
    </div>
  );
};
