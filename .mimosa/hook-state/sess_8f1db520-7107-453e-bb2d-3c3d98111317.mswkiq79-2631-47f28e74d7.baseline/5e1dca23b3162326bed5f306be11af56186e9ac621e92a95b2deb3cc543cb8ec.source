import { Button, Dialog, Spinner } from 'erxes-ui';
import { useQuery } from '@apollo/client';
import { useRemoveBanners } from '../hooks/useBannerMutations';
import { ONE_FIT_BANNER } from '../graphql/bannerQueries';

interface RemoveBannerDialogProps {
  bannerId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
}

export const RemoveBannerDialog = ({
  bannerId,
  open,
  onOpenChange,
  onClose,
}: RemoveBannerDialogProps) => {
  const { data } = useQuery(ONE_FIT_BANNER, {
    variables: { _id: bannerId },
    skip: !open,
  });

  const banner = data?.oneFitBanner;
  const { removeBanners, loading } = useRemoveBanners();

  const handleRemove = () => {
    removeBanners({ variables: { ids: [bannerId] } });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Dialog.Content>
        <Dialog.Header>
          <Dialog.Title>Remove Banner</Dialog.Title>
          <Dialog.Description>
            Are you sure you want to remove this banner? This action cannot be
            undone.
          </Dialog.Description>
        </Dialog.Header>
        <Dialog.Footer>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleRemove}
            disabled={loading}
          >
            <Spinner show={loading} />
            Remove Banner
          </Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  );
};
