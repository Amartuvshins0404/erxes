import { UploadButton, UploadCard } from '@/block/components/UploadCard';
import { useUnitAttachments } from '@/unit/hooks/useUnit';
import { IUnitAttachment } from '@/unit/types/unitType';
import { Spinner, useQueryState } from 'erxes-ui';

export const UnitMedia = () => {
  const [unitId] = useQueryState<string>('unitId');
  const { attachments, loading } = useUnitAttachments(unitId);

  if (loading) {
    return <Spinner containerClassName="py-32" />;
  }

  return (
    <div className="p-8 grid grid-cols-2 gap-6 relative">
      {[...attachments, { _id: '', attachment: '' }].map(
        (attachment: IUnitAttachment, index: number) => (
          <UploadCard
            title={`Attachment ${index + 1}`}
            value={attachment.attachment}
            fit="cover"
          >
            <div className="grid grid-cols-2 gap-2">
              <UploadButton value={attachment.attachment} />
            </div>
          </UploadCard>
        ),
      )}
    </div>
  );
};
