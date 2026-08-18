import {
  IconBuildingCommunity,
  IconMapPinFilled,
  IconPhotoCirclePlus,
} from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { IDeveloper, IDeveloperAddress } from '../types';

const DeveloperAddress = ({ address }: { address: IDeveloperAddress }) => (
  <div className="flex items-center gap-2 text-accent-foreground">
    <IconMapPinFilled className=" size-4" />
    <p className="text-sm">
      {address
        ? `${address?.address?.city}, ${address?.address?.city_district}, ${
            address?.address?.country || 'Монгол'
          }`
        : 'No address'}
    </p>
  </div>
);

export const DeveloperCard = ({
  _id,
  name,
  coverImage,
  address,
  projectsCount,
}: IDeveloper) => {
  return (
    <Link
      to={`/blockadmin/developers/${_id}`}
      className="border bg-accent p-2 ba:rounded-[1.25rem] flex flex-col gap-3"
    >
      <div className="w-full h-full relative ba:aspect-2/1 rounded-xl overflow-hidden flex items-center justify-center">
        {coverImage ? (
          <img
            src={coverImage}
            alt={name}
            className="object-cover absolute inset-0 object-center"
          />
        ) : (
          <IconPhotoCirclePlus className="size-8 text-scroll" />
        )}
        <div className="absolute inset-0 border border-foreground/10 rounded-xl" />
      </div>
      <div className="p-3 pt-0 space-y-2">
        <div className="flex ba:justify-between">
          <h3 className="font-medium text-lg leading-6">{name}</h3>
          <h3 className="font-medium text-lg leading-6 flex items-center gap-2">
            <IconBuildingCommunity className="size-4" /> {projectsCount ?? 0}
          </h3>
        </div>
        <DeveloperAddress address={address} />
      </div>
    </Link>
  );
};
