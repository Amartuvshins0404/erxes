import { IconMapPinFilled, IconPhotoCirclePlus } from '@tabler/icons-react';
import { readImage } from 'erxes-ui';
import { Link } from 'react-router-dom';
import { INews } from '../types/newsTypes';
import { VerificationStatusBadge } from './NewsDetailProfile';

export const NewsCard = ({ name, _id, coverImage, location, verificationStatus }: INews) => {
  console.log(location, 'location');
  return (
    <Link
      to={`/btk/news/${_id}`}
      className="border bg-accent p-2 blk:rounded-[1.25rem] flex flex-col gap-3"
    >
      <div className="w-full h-full relative blk:aspect-2/1 rounded-xl overflow-hidden flex items-center justify-center">
        {coverImage ? (
          <img
            src={readImage(coverImage)}
            alt={name}
            className="object-cover absolute inset-0 object-center"
          />
        ) : (
          <IconPhotoCirclePlus className="size-8 text-scroll" />
        )}
        <div className="absolute inset-0 border border-foreground/10 rounded-xl" />
      </div>
      <div className="p-3 pt-0 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-medium text-lg leading-6">{name}</h3>
          <VerificationStatusBadge status={verificationStatus} />
        </div>
        <div className="flex items-center gap-2 text-accent-foreground">
          <IconMapPinFilled className=" size-4" />
          <p className="text-sm">
            {location
              ? `${location?.address}, ${location?.district}, ${
                  location?.city || 'Улаанбаатар'
                }`
              : 'No address'}
          </p>
        </div>

      </div>
    </Link>
  );
};
