import { useTranslation } from 'react-i18next';
import { REMOVE_DOCUMENT } from '@/documents/graphql/documentMutations';
import { MutationFunction, useMutation } from '@apollo/client';
import { toast } from 'erxes-ui';

type RemoveDocumentResponse = { documentsRemove: unknown };
type RemoveDocumentVariables = { id: string };

export const useDocumentRemove = (): {
  removeDocument: MutationFunction<
    RemoveDocumentResponse,
    RemoveDocumentVariables
  >;
  loading: boolean;
} => {
  const { t } = useTranslation('documents', { keyPrefix: 'document' });
  const [removeDocument, { loading }] = useMutation<
    RemoveDocumentResponse,
    RemoveDocumentVariables
  >(REMOVE_DOCUMENT, {
    onCompleted: () => {
      toast({ title: t('removed-success'), variant: 'success' });
    },
    onError: (error) => {
      toast({
        title: t('error'),
        description: error?.message,
        variant: 'destructive',
      });
    },
  });

  return {
    removeDocument,
    loading,
  };
};
