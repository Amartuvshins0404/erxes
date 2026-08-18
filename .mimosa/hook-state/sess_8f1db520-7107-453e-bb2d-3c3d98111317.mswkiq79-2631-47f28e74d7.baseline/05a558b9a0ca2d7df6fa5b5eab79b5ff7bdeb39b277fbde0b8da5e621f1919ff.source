import {
  IconDotsVertical,
  IconEye,
  IconEyeOff,
  IconStar,
  IconStarOff,
  IconTrash,
} from '@tabler/icons-react';
import { Button, DropdownMenu, useConfirm } from 'erxes-ui';
import { useAdminListingDetail } from '../hooks/useAdminListingDetail';
import { useAdminRemoveListing } from '../hooks/useAdminRemoveListing';
import { useAdminUpdateListing } from '../hooks/useAdminUpdateListing';

export const AdminListingDetailActions = () => {
  const { listing } = useAdminListingDetail();
  const { updateListing } = useAdminUpdateListing();
  const { removeListing } = useAdminRemoveListing();
  const { confirm } = useConfirm();

  const isPublished = listing?.status === 'active';

  const handleDelete = () => {
    confirm({
      message: 'Are you sure you want to permanently delete this listing?',
      options: { okLabel: 'Delete' },
    }).then(() => {
      removeListing(listing?._id || '');
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenu.Trigger asChild>
        <Button variant="outline">
          <IconDotsVertical />
          Actions
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content className="min-w-48" align="end">
        <DropdownMenu.Item
          onClick={() =>
            updateListing(listing?._id || '', {
              status: isPublished ? 'inactive' : 'active',
            })
          }
        >
          {isPublished ? (
            <>
              <IconEyeOff />
              Unpublish Listing
            </>
          ) : (
            <>
              <IconEye />
              Publish Listing
            </>
          )}
        </DropdownMenu.Item>
        <DropdownMenu.Item
          onClick={() =>
            updateListing(listing?._id || '', {
              isFeatured: !listing?.isFeatured,
            })
          }
        >
          {listing?.isFeatured ? (
            <>
              <IconStarOff />
              Unfeature Listing
            </>
          ) : (
            <>
              <IconStar />
              Feature Listing
            </>
          )}
        </DropdownMenu.Item>
        <DropdownMenu.Separator />
        <DropdownMenu.Item
          className="text-destructive focus:text-destructive"
          onClick={handleDelete}
        >
          <IconTrash />
          Delete Listing
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu>
  );
};
