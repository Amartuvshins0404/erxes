import {
  BLOCK_CREATE_UNIT_ATTACHMENT,
  BLOCK_REMOVE_UNIT_ATTACHMENT,
  BLOCK_UPDATE_UNIT_ATTACHMENT,
} from '@/unit/graphql/unitMutations';
import { BLOCK_UNIT_ATTACHMENTS } from '@/unit/graphql/unitQueries';
import { IUnitAttachment } from '@/unit/types/unitType';
import { useMutation } from '@apollo/client';

export const useMutateAttachment = ({ unitId }: { unitId: string | null }) => {
  const refetchQueries = [
    {
      query: BLOCK_UNIT_ATTACHMENTS,
      variables: { itemType: 'unit', itemId: unitId },
    },
  ];

  const [createAttachment, { loading: createLoading }] = useMutation(
    BLOCK_CREATE_UNIT_ATTACHMENT,
    {
      refetchQueries,
    },
  );
  const [updateAttachment, { loading: updateLoading }] = useMutation(
    BLOCK_UPDATE_UNIT_ATTACHMENT,
    {
      refetchQueries,
    },
  );
  const [deleteAttachment, { loading: deleteLoading }] = useMutation(
    BLOCK_REMOVE_UNIT_ATTACHMENT,
    {
      refetchQueries,
    },
  );

  const mutateAttachment = (attachment: IUnitAttachment) => {
    if (!unitId) return;
    if (attachment._id && attachment.attachment) {
      updateAttachment({
        variables: {
          id: attachment._id,
          input: {
            attachment: attachment.attachment,
            itemType: 'unit',
            itemId: unitId,
            order: 1,
          },
        },
      });
    } else if (attachment._id && !attachment.attachment) {
      deleteAttachment({ variables: { id: attachment._id } });
    } else if (!attachment._id && attachment.attachment) {
      createAttachment({
        variables: {
          input: {
            attachment: attachment.attachment,
            itemType: 'unit',
            itemId: unitId,
            order: 1,
          },
        },
      });
    }
  };

  return {
    mutateAttachment,
    loading: createLoading || updateLoading || deleteLoading,
  };
};
