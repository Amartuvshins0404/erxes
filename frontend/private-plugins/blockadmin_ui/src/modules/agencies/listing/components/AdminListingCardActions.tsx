import {
  IconDotsVertical,
  IconEye,
  IconEyeOff,
  IconStar,
  IconStarOff,
} from '@tabler/icons-react';
import { Button, DropdownMenu } from 'erxes-ui';
import { useAdminUpdateListing } from '../hooks/useAdminUpdateListing';

type Props = {
  _id: string;
  status?: string;
  isFeatured?: boolean;
};

export const AdminListingCardActions = ({ _id, status, isFeatured }: Props) => {
  const { updateListing, loading } = useAdminUpdateListing();

  const stop = (e: React.MouseEvent) => e.stopPropagation();
  const isPublished = status === 'active';

  return (
    <DropdownMenu>
      <DropdownMenu.Trigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-6 bg-background/30 hover:bg-accent/30 text-foreground backdrop-blur-sm rounded"
          disabled={loading}
          onClick={stop}
        >
          <IconDotsVertical className="size-4" />
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content className="min-w-44" align="end" onClick={stop}>
        <DropdownMenu.Item
          onClick={() =>
            updateListing(_id, { status: isPublished ? 'inactive' : 'active' })
          }
        >
          {isPublished ? (
            <>
              <IconEyeOff className="size-4" />
              Unpublish
            </>
          ) : (
            <>
              <IconEye className="size-4" />
              Publish
            </>
          )}
        </DropdownMenu.Item>
        <DropdownMenu.Item
          onClick={() => updateListing(_id, { isFeatured: !isFeatured })}
        >
          {isFeatured ? (
            <>
              <IconStarOff className="size-4" />
              Unfeature Listing
            </>
          ) : (
            <>
              <IconStar className="size-4" />
              Feature Listing
            </>
          )}
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu>
  );
};
