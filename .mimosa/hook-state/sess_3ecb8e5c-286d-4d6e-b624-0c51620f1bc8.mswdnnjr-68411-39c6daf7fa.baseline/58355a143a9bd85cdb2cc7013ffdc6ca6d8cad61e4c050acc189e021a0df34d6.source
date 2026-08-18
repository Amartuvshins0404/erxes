import { IconEye, IconMapPin, IconStarFilled } from '@tabler/icons-react';
import {
  Badge,
  CurrencyCode,
  CurrencyDisplay,
  formatAmount,
  formatDateISOStringToRelativeDate,
} from 'erxes-ui';
import { Link } from 'react-router-dom';
import { IAdminListing } from '../types/listingTypes';
import { AdminListingCardActions } from './AdminListingCardActions';
import {
  PropertyTypeIcon,
  PropertyVariantsProps,
  STATUS_VARIANT,
  TYPE_LABELS,
  propertyVariants,
} from './AdminListingCard';

const STATUS_LABELS: Record<string, string> = {
  active: 'Published',
  inactive: 'Archived',
  sold: 'Sold',
  draft: 'Draft',
};

export const AdminListingListItem = ({
  _id,
  title,
  status,
  type,
  propertyType,
  pricing,
  location,
  viewCount,
  isFeatured,
  specs,
  createdAt,
  agent,
}: IAdminListing) => {
  const specLine = [
    specs?.rooms && `${specs.rooms} Rooms`,
    specs?.area && `${specs.area} m²`,
    specs?.floor && `Flr ${specs.floor}`,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Link
      to={`/blockadmin/agencies/listing/${_id}`}
      className="bg-background shadow-xs hover:shadow-sm ba:hover:-translate-y-0.5 ba:transition-all ba:duration-200 ba:ease-in-out ba:rounded-xl py-3 px-4 grid ba:grid-cols-[2fr_1.2fr_1fr_1.4fr_0.8fr_1fr_36px] gap-3"
    >
      <div className="min-w-0 flex gap-2.5 items-center">
        <div
          className={propertyVariants({
            propertyType: propertyType as PropertyVariantsProps['propertyType'],
            className: 'ba:w-16 ba:aspect-68/52 ba:rounded-lg flex-none',
          })}
        >
          <PropertyTypeIcon propertyType={propertyType} size={16} />
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-sm ba:whitespace-nowrap">
              {title}
            </p>
            <Badge variant={STATUS_VARIANT[status]}>
              {STATUS_LABELS[status] ?? status}
            </Badge>
            {type && (
              <Badge variant={'ghost'} className="bg-background">
                {TYPE_LABELS[type]}
              </Badge>
            )}
            {isFeatured && (
              <IconStarFilled className="text-warning" size={12} />
            )}
          </div>
          {location?.city && (
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <IconMapPin className="size-3 shrink-0" />
              <span className="truncate">
                {[location.district, location.city].filter(Boolean).join(', ')}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="flex-none flex flex-col gap-1 ba:justify-center">
        {specLine && <p className="ba:text-xs ba:font-medium">{specLine}</p>}
        {viewCount !== undefined && (
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <IconEye className="size-3" />
            {viewCount} views
          </div>
        )}
      </div>

      <div className="flex-none flex items-center gap-1.5 text-xs">
        <PropertyTypeIcon
          propertyType={propertyType}
          size={14}
          className="text-primary"
        />
        <span className="capitalize">{propertyType}</span>
      </div>

      <div className="flex-none flex ba:items-center">
        {agent ? (
          <div>
            <p className="text-xs text-foreground ba:font-medium">
              {agent.firstName} {agent.lastName.charAt(0)}.
            </p>
            <p className="text-[11px] text-muted-foreground">{agent.email}</p>
          </div>
        ) : null}
      </div>

      <div className="flex-none flex ba:items-center text-xs text-muted-foreground">
        {createdAt
          ? formatDateISOStringToRelativeDate(createdAt as string, false)
          : '-'}
      </div>

      <div className="flex-none flex ba:items-center text-right">
        {pricing?.amount ? (
          <div className="flex ba:flex-col">
            <div className="flex items-center justify-end gap-0 text-sm font-semibold">
              <CurrencyDisplay
                variant="icon"
                code={pricing.currency as CurrencyCode}
              />
              {formatAmount(pricing.amount, 'short')}
              {type === 'rent' && '/mo'}
            </div>
            <p className="text-[10px] text-muted-foreground">
              {pricing.currency}
            </p>
          </div>
        ) : (
          '—'
        )}
      </div>

      <div className="flex ba:items-center">
        <AdminListingCardActions
          _id={_id}
          status={status}
          isFeatured={isFeatured}
        />
      </div>
    </Link>
  );
};
