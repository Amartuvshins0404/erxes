import {
  IconEye,
  IconStar,
  IconBuilding,
  IconHome,
  IconHome2,
  IconMap2,
  IconBuildingFactory2,
  IconProps,
  IconMapPin,
} from '@tabler/icons-react';
import {
  Badge,
  CurrencyCode,
  CurrencyDisplay,
  formatAmount,
  Spinner,
} from 'erxes-ui';
import { Link } from 'react-router-dom';
import { IAdminListing } from '../types/listingTypes';
import { AdminListingCardActions } from './AdminListingCardActions';
import { cva, VariantProps } from 'class-variance-authority';
import { useAgencyDetail } from '@/agencies/hooks/useAgencyDetail';

export const STATUS_VARIANT: Record<
  string,
  'success' | 'warning' | 'info' | 'secondary'
> = {
  active: 'success',
  inactive: 'warning',
  sold: 'info',
  draft: 'secondary',
};

export const TYPE_LABELS: Record<string, string> = {
  sale: 'Sale',
  rent: 'Rent',
  lease: 'Lease',
} as const;

export const propertyVariants = cva(
  'relative w-full flex items-center h-full justify-center rounded-t-xl overflow-hidden bg-cover bg-no-repeat transition-all duration-300 text-primary-foreground/60',
  {
    variants: {
      propertyType: {
        // APARTMENT: Vibrant rich blue gradient
        apartment:
          'ba:bg-[linear-gradient(135deg,oklch(0.45_0.18_260)_0%,oklch(0.32_0.16_270)_100%)]',

        // HOUSE: Deep forest green gradient
        house:
          'ba:bg-[linear-gradient(135deg,oklch(0.46_0.14_155)_0%,oklch(0.34_0.12_165)_100%)]',

        // COMMERCIAL: Sleek slate / dark navy industrial gradient
        commercial:
          'ba:bg-[linear-gradient(135deg,oklch(0.38_0.06_260)_0%,oklch(0.28_0.04_265)_100%)]',

        // LAND / MAPS: Warm clay / deep orange gradient
        land: 'ba:bg-[linear-gradient(135deg,oklch(0.58_0.15_78)_0%,oklch(0.44_0.18_55)_100%)]',

        // OTHER / ARCHIVED: Deep magenta / pink gradient
        other:
          'ba:bg-[linear-gradient(135deg,oklch(0.54_0.18_10)_0%,oklch(0.42_0.2_350)_100%)]',
      },
    },
    defaultVariants: {
      propertyType: 'apartment',
    },
  },
);
export type PropertyVariantsProps = VariantProps<typeof propertyVariants>;

export const AdminListingCard = ({
  _id,
  title,
  featuredImg,
  status,
  type,
  pricing,
  location,
  viewCount,
  isFeatured,
  propertyType,
  specs,
  agencyId,
}: IAdminListing) => {
  return (
    <Link
      to={`/blockadmin/agencies/listing/${_id}`}
      className="shadow-xs bg-muted hover:shadow-sm hover:-translate-y-0.5 ba:transition-all ba:ease-in-out ba:duration-300 ba:rounded-xl ba:overflow-hidden flex flex-col gap-3"
    >
      <div className="w-full relative h-48 overflow-hidden flex items-center justify-center bg-muted">
        <div
          className={propertyVariants({
            propertyType: propertyType as PropertyVariantsProps['propertyType'],
          })}
        >
          <PropertyTypeIcon propertyType={propertyType} />
        </div>
        {/* {featuredImg ? (
          <img
            src={readImage(featuredImg)}
            alt={title}
            className="object-cover absolute inset-0 w-full h-full object-center"
          />
        ) : (
          <IconPhotoCirclePlus className="size-8 text-muted-foreground" />
        )} */}
        {/* <div className="absolute inset-0 border border-foreground/10 rounded-xl" /> */}
        <div className="absolute top-2 left-2 flex gap-1">
          <PublishStatusBadge status={status} />
          <ListingTypeBadge listingType={type} />
          {isFeatured && (
            <Badge
              variant="warning"
              className="ba:bg-[color-mix(var(--warning),40%_transparent)] text-primary-foreground border-0 backdrop-blur-sm"
            >
              <IconStar className="size-3 mr-0.5" />
              Featured
            </Badge>
          )}
        </div>
        <div className="absolute top-2 right-2 flex items-center gap-1">
          <AdminListingCardActions
            _id={_id}
            status={status}
            isFeatured={isFeatured}
          />
        </div>
        {viewCount !== undefined && (
          <div className="absolute bottom-2 right-2 flex items-center gap-1 text-xs text-primary-foreground bg-black/50 rounded-xl px-2 py-0.5 backdrop-blur-sm">
            <IconEye className="size-3" />
            {viewCount}
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <span className="ba:inline-flex ba:gap-3 items-center px-4">
          <span className="uppercase ba:inline-flex ba:gap-0.5 items-center ba:text-primary text-[11px] ba:font-semibold ba:tracking-[0.033em]">
            <PropertyTypeIcon propertyType={propertyType} size={11} />
            {propertyType}
          </span>
          <span className="text-[11px] text-muted-foreground">
            Floor {specs?.floor}
          </span>
        </span>
        <p className="ba:font-semibold ba:leading-[1.3] ba:whitespace-nowrap text-sm line-clamp-1 px-4">
          {title}
        </p>

        {location?.city && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground px-4 ba:pb-3.5">
            <IconMapPin className="size-3 shrink-0" />
            <span className="truncate">
              {[location.city, location.district].filter(Boolean).join(', ')}
            </span>
          </div>
        )}
        {specs && (
          <div className="text-xs text-muted-foreground px-4">
            <span>{specs.rooms}</span>
            {' · '}
            <span>{specs.builtYear}</span>
            {' · '}
            <span>{specs.area}</span>
            {' · '}
            <span>{specs.floor}</span>
          </div>
        )}

        <div className="flex items-center justify-between border-t pt-2.5 px-4 ba:pb-3.5">
          <AgencyTag id={agencyId} />
          {pricing?.amount && (
            <span className="text-sm font-semibold inline-flex items-center">
              <CurrencyDisplay
                variant="icon"
                code={pricing.currency as CurrencyCode}
              />
              <span>{formatAmount(pricing.amount, 'short')}</span>
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};

type TStatuses = 'active' | 'inactive' | 'sold' | 'draft';
const PublishStatusBadge = ({ status }: { status: TStatuses }) => (
  <Badge variant={STATUS_VARIANT[status]}>{status}</Badge>
);

type TListingTypes = keyof typeof TYPE_LABELS;
const ListingTypeBadge = ({ listingType }: { listingType: TListingTypes }) => (
  <Badge variant={'ghost'} className="bg-background">
    {TYPE_LABELS[listingType]}
  </Badge>
);

export const PropertyTypeIcon = ({
  propertyType,
  ...props
}: { propertyType: string } & IconProps) => {
  switch (propertyType) {
    case 'apartment':
      return <IconBuilding {...props} />;
    case 'house':
      return <IconHome {...props} />;
    case 'commercial':
      return <IconBuildingFactory2 {...props} />;
    case 'land':
      return <IconMap2 {...props} />;
    default:
      return <IconHome2 {...props} />;
  }
};

export const AgencyTag = ({ id }: { id?: string }) => {
  const { agency, loading } = useAgencyDetail({
    variables: {
      id,
    },
    skip: !id,
  });

  if (loading) {
    return <Spinner />;
  }

  return (
    <span className="text-muted-foreground ba:text-[0.625rem] inline-flex items-center gap-1">
      <span>{agency?.name}</span>
      {' · '}
      <p className="text-foreground font-medium">{agency?.brandName}</p>
    </span>
  );
};
