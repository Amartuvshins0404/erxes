import { IconMapPinFilled, IconPhotoCirclePlus } from '@tabler/icons-react';
import { readImage } from 'erxes-ui';
import { Link } from 'react-router-dom';

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending: { label: 'Шалгаж байна', className: 'bg-yellow-100 text-yellow-800' },
  need_info: { label: 'Нэмэлт мэдээлэл', className: 'bg-orange-100 text-orange-800' },
  approved: { label: 'Зөвшөөрөгдсөн', className: 'bg-green-100 text-green-800' },
  rejected: { label: 'Зөвшөөрөгдөөгүй', className: 'bg-red-100 text-red-800' },
  violation: { label: 'Дүрэм зөрчсөн', className: 'bg-red-200 text-red-900' },
};

export const VerificationStatusBadge = ({ status }: { status?: string }) => {
  if (!status) return null;
  const config = STATUS_CONFIG[status];
  if (!config) return null;
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${config.className}`}>
      {config.label}
    </span>
  );
};

export const BtkCompanyCard = ({ name, _id, coverImage, location, verificationStatus }: any) => {
  return (
    <Link
      to={`/btk/companies/${_id}`}
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
          <h3 className="font-medium text-lg leading-6 truncate">{name}</h3>
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
        {/* <div className="flex items-center gap-2">
          <Slider value={[80]} max={100} hideThumb />
          <p className="text-sm ml-1 text-accent-foreground font-medium">85%</p>
        </div> */}
      </div>
    </Link>
  );
};
