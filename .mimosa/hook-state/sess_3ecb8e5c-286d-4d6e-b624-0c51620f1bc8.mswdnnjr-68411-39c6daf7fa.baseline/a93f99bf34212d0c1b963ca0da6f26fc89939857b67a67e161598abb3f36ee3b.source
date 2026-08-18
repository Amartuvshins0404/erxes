import {
  UploadButton,
  RemoveButton,
  UploadCard,
} from '@/block/components/UploadCard';
import { useMutateAttachment } from '@/unit/hooks/useMutateAttachment';
import { useUnitAttachments } from '@/unit/hooks/useUnit';
import { IUnitAttachment } from '@/unit/types/unitType';
import { Spinner, useQueryState } from 'erxes-ui';

export const UnitMedia = () => {
  const [unitId] = useQueryState<string>('unitId');
  const { attachments, loading } = useUnitAttachments(unitId);
  const { mutateAttachment, loading: mutateLoading } = useMutateAttachment({
    unitId,
  });

  if (loading) {
    return <Spinner containerClassName="py-32" />;
  }

  const onValueChange = (value: string, id: string | undefined) => {
    mutateAttachment({ _id: id, attachment: value });
  };

  return (
    <div className="p-8 grid grid-cols-2 gap-6 relative">
      {[...attachments, { _id: '', attachment: '' }].map(
        (attachment: IUnitAttachment, index: number) => (
          <UploadCard
            title={`Attachment ${index + 1}`}
            value={attachment.attachment}
            onValueChange={(value) => onValueChange(value, attachment._id)}
            fit="cover"
          >
            <div className="grid grid-cols-2 gap-2">
              <UploadButton value={attachment.attachment} />
              <RemoveButton value={attachment.attachment} />
            </div>
          </UploadCard>
        ),
      )}
      {mutateLoading && (
        <Spinner containerClassName="py-32 absolute inset-0 bg-background/20" />
      )}
    </div>
  );
};
