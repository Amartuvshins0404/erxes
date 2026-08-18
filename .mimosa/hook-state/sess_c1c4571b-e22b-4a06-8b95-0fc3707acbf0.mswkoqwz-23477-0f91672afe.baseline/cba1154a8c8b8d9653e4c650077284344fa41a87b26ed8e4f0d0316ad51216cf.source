import { readImage } from 'erxes-ui/utils/core';
import { IconPhotoCirclePlus } from '@tabler/icons-react';
import { InfoCard } from 'erxes-ui';
import { useAdminListingDetail } from '../hooks/useAdminListingDetail';

export const AdminListingDetailMedia = () => {
  const { listing } = useAdminListingDetail();

  return (
    <div className="flex flex-col gap-6 p-8">
      {listing?.featuredImg && (
        <InfoCard title="Featured Image">
          <InfoCard.Content>
            <div className="w-full max-w-sm rounded-xl overflow-hidden border aspect-video relative">
              <img
                src={readImage(listing.featuredImg)}
                alt="Featured"
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>
          </InfoCard.Content>
        </InfoCard>
      )}

      <InfoCard title="Media Attachments">
        <InfoCard.Content>
          {listing?.mediaAttachments?.length ? (
            <div className="grid grid-cols-3 gap-3">
              {listing.mediaAttachments.map((url, i) => (
                <div
                  key={i}
                  className="rounded-xl overflow-hidden border aspect-video relative bg-muted"
                >
                  <img
                    src={readImage(url)}
                    alt={`Attachment ${i + 1}`}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
              <IconPhotoCirclePlus className="size-8" />
              <p className="text-sm">No media attachments</p>
            </div>
          )}
        </InfoCard.Content>
      </InfoCard>
    </div>
  );
};
