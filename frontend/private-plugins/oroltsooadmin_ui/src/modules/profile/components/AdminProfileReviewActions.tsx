import { IconCheck, IconX } from '@tabler/icons-react';
import { Button, Dialog, Textarea, useToast } from 'erxes-ui';
import { useState } from 'react';

import { useAdminProfileReview } from '../hooks/useAdminProfileReview';

export const AdminProfileReviewActions = ({
  profileId,
  reviewStatus,
}: {
  profileId: string;
  reviewStatus?: string;
}) => {
  const { verifyProfile, rejectProfile, loading } = useAdminProfileReview();
  const { toast } = useToast();
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [note, setNote] = useState('');

  const handleReject = () => {
    if (!note.trim()) {
      toast({
        title: 'Шалтгаанаа бичнэ үү',
        description: 'Татгалзах болсон шалтгаанаа тайлбарлана уу.',
        variant: 'destructive',
      });
      return;
    }

    rejectProfile(profileId, note).then(() => {
      setIsRejectOpen(false);
      setNote('');
    });
  };

  return (
    <>
      <Button
        variant="secondary"
        onClick={() => verifyProfile(profileId)}
        disabled={loading || reviewStatus === 'verified'}
      >
        <IconCheck />
        Баталгаажуулах
      </Button>
      <Button
        variant="secondary"
        className="text-destructive"
        onClick={() => setIsRejectOpen(true)}
        disabled={loading || reviewStatus === 'rejected'}
      >
        <IconX />
        Татгалзах
      </Button>

      <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
        <Dialog.Content className="sm:max-w-lg">
          <Dialog.Header>
            <Dialog.Title>Татгалзах шалтгаан</Dialog.Title>
            <Dialog.Description>
              Энэ тайлбар нь профайлын хяналтын тэмдэглэл болж хадгалагдана.
            </Dialog.Description>
          </Dialog.Header>
          <Textarea
            rows={4}
            value={note}
            placeholder="Ямар мэдээлэл дутуу, эсвэл юуг засах шаардлагатай вэ?"
            onChange={(event) => setNote(event.target.value)}
          />
          <Dialog.Footer>
            <Button
              variant="ghost"
              onClick={() => setIsRejectOpen(false)}
              disabled={loading}
            >
              Болих
            </Button>
            <Button
              className="text-destructive"
              variant="secondary"
              onClick={handleReject}
              disabled={loading}
            >
              Татгалзах
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog>
    </>
  );
};
