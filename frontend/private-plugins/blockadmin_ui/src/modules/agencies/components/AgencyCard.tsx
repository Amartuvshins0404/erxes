import {
  IconBuilding,
  IconCircleDashed,
  IconCircleDashedCheck,
  IconCircleDashedX,
  IconMapPinFilled,
  IconPhotoCirclePlus,
} from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import {
  IAgency,
  IAgencyFieldOfExpertise,
  IAgencyOperationArea,
} from '../types/agencyTypes';
import { readImage } from 'erxes-ui/utils/core';
import { Badge, cn } from 'erxes-ui';
import { PropertyTypeKey } from './SelectPropertyType';
import { PROPERTY_TYPE_LABELS, SERVICE_LABELS } from '../constants';
import { ServiceKey } from './SelectServiceType';

export const AgencyVerificationStatus = ({
  verificationStatus,
}: Pick<IAgency, 'verificationStatus'>) => {
  switch (verificationStatus) {
    case 'pending':
      return (
        <Badge variant={'warning'} className="text-xs">
          <IconCircleDashed size={16} />
          Pending
        </Badge>
      );
    case 'unverified':
      return (
        <Badge variant={'destructive'} className="text-xs">
          <IconCircleDashedX size={16} />
          Rejected
        </Badge>
      );
    case 'verified':
      return (
        <Badge variant={'success'} className="text-xs">
          <IconCircleDashedCheck size={16} />
          Verified
        </Badge>
      );
    default:
      return (
        <Badge variant={'info'} className="text-xs">
          <IconCircleDashed size={16} />
          New
        </Badge>
      );
  }
};

const AgencyAddress = ({
  address,
  propertyTypes,
}: {
  address: IAgencyOperationArea;
  propertyTypes?: IAgencyFieldOfExpertise['propertyTypes'];
}) => {
  return (
    <div className="flex ba:flex-col gap-2 text-accent-foreground">
      <span className="flex ba:items-center gap-2">
        <IconMapPinFilled className="size-3" />
        <p className="text-xs">
          {address ? `${address?.district}, ${address?.city}` : 'No address'}
        </p>
      </span>
      {propertyTypes && (
        <span className="flex ba:items-center gap-2">
          <IconBuilding className="size-3" />
          <p className="text-xs">
            {propertyTypes
              ?.map((t) => PROPERTY_TYPE_LABELS[t as PropertyTypeKey])
              .join(' · ')}
          </p>
        </span>
      )}
    </div>
  );
};

export const AgencyCard = ({
  _id,
  name,
  coverImage,
  operationArea,
  logo,
  verificationStatus,
  dateFounded,
  fieldsOfExpertise,
  brief,
  brandName,
}: IAgency) => {
  return (
    <Link
      to={`/blockadmin/agencies/agencies/${_id}`}
      className="shadow-xs bg-muted ba:rounded-xl ba:overflow-hidden flex flex-col ba:hover:-translate-y-0.5 transition-all ba:ease-in-out ba:hover:shadow-lg"
    >
      <div className="w-full ba:h-32 relative ba:aspect-2/1 overflow-hidden flex items-center justify-center">
        {coverImage ? (
          <img
            src={readImage(coverImage)}
            alt={name}
            className="ba:object-cover absolute inset-0 ba:object-center"
          />
        ) : (
          <IconPhotoCirclePlus className="size-8 text-scroll" />
        )}
        <div className="absolute ba:top-2.5 ba:right-2.5">
          <AgencyVerificationStatus verificationStatus={verificationStatus} />
        </div>
        {dateFounded && (
          <span className="absolute ba:bottom-2.5 ba:right-2.5 rounded-full pt-0.5 px-2 ba:bg-black/25 ba:text-[color-mix(var(--primary-foreground),20%_transparent)] font-medium text-[10px] ba:leading-tight">
            Est. {dateFounded}
          </span>
        )}
        {/* <div className="absolute inset-0 border border-foreground/10 rounded-xl" /> */}
      </div>
      <div className="p-4 pt-8 ba:relative flex items-center gap-3">
        {logo && (
          <span className="flex-none ba:absolute ba:-top-6 rounded-sm shadow-sm bg-background ba:overflow-hidden">
            <img
              src={readImage(logo)}
              alt={`${name}-logo`}
              className="ba:size-12 object-contain object-center"
            />
          </span>
        )}
        <span className="flex-1 flex flex-col gap-2">
          <h3 className="font-medium ba:inline-flex ba:items-center gap-2 text-sm ba:font-semibold leading-6">
            <div
              className={cn(
                {
                  'bg-success': verificationStatus === 'verified',
                  'bg-warning': verificationStatus === 'pending',
                  'bg-destructive': verificationStatus === 'unverified',
                },
                'h-4 w-1 ba:rounded-full',
              )}
            />
            {name}
          </h3>
          <span className="flex items-center gap-2">
            <p className="text-xs text-muted-foreground">{brandName}</p>
            <span className="flex ba:items-center gap-0.5">
              {fieldsOfExpertise?.services?.map((s) => (
                <Badge variant={'secondary'} className='bg-background'>
                  {SERVICE_LABELS[s as ServiceKey]}
                </Badge>
              ))}
            </span>
          </span>
          <p className="text-xs ba:leading-relaxed text-muted-foreground ba:font-normal ba:line-clamp-2">
            {brief}
          </p>
          <AgencyAddress
            address={operationArea}
            propertyTypes={fieldsOfExpertise?.propertyTypes}
          />
        </span>
      </div>
    </Link>
  );
};
