import { useMutation } from '@apollo/client';
import { useToast } from 'erxes-ui';
import { useTranslation } from 'react-i18next';
import { PRODUCT_SIMILARITY_REMOVE } from '../graphql/mutations';

export const useRemoveSimilarity = () => {
  const { t } = useTranslation('product', { keyPrefix: 'bulk-similarity' });
  const { toast } = useToast();

  const [removeMutation, { loading }] = useMutation(PRODUCT_SIMILARITY_REMOVE);

  const remove = async (_id: string) => {
    try {
      await removeMutation({ variables: { _id } });
      toast({ title: t('similarity-removed', 'Similarity removed') });
    } catch (e) {
      toast({
        title: t('error', 'Error'),
        description: e instanceof Error ? e.message : undefined,
        variant: 'destructive',
      });
      throw e;
    }
  };

  return { remove, loading };
};
