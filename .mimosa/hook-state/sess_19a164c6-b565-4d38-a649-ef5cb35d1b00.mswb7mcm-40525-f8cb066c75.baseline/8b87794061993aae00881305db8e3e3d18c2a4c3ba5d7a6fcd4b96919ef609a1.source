import { Button, Dialog, Spinner } from 'erxes-ui';
import { useQuery } from '@apollo/client';
import { useRemovePromoCodes } from '../hooks/usePromoCodeMutations';
import { ONE_FIT_PROMO_CODE } from '../graphql/promoCodeQueries';

interface RemovePromoCodeDialogProps {
  promoCodeId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
}

export const RemovePromoCodeDialog = ({
  promoCodeId,
  open,
  onOpenChange,
  onClose,
}: RemovePromoCodeDialogProps) => {
  const { data } = useQuery(ONE_FIT_PROMO_CODE, {
    variables: { _id: promoCodeId },
    skip: !open,
  });

  const promoCode = data?.oneFitPromoCode;
  const { removePromoCodes, loading } = useRemovePromoCodes();

  const handleRemove = () => {
    removePromoCodes({ variables: { ids: [promoCodeId] } });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Dialog.Content>
        <Dialog.Header>
          <Dialog.Title>Remove Promo Code</Dialog.Title>
          <Dialog.Description>
            {promoCode?.code ? (
              <>
                Are you sure you want to remove promo code &quot;
                {promoCode.code}
                &quot;? This action cannot be undone.
              </>
            ) : (
              'Are you sure you want to remove this promo code? This action cannot be undone.'
            )}
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
            Remove Promo Code
          </Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  );
};
