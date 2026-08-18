import { useMutation } from '@apollo/client';
import { toast } from 'erxes-ui';
import { useTranslation } from 'react-i18next';
import { MUSHOP_UPDATE_SUPPLIER_VERIFICATION_STATUS } from '../graphql/mutations';
import { MUSHOP_SUPPLIERS } from '../graphql/queries';

export const useUpdateSupplierVerification = () => {
  const { t } = useTranslation('mushop');
  const [mutate, { loading }] = useMutation(
    MUSHOP_UPDATE_SUPPLIER_VERIFICATION_STATUS,
    {
      refetchQueries: [{ query: MUSHOP_SUPPLIERS }],
      onCompleted: () => toast({ title: t('Verification status updated') }),
      onError: (e) =>
        toast({
          title: t('Error'),
          description: e.message,
          variant: 'destructive',
        }),
    },
  );

  const updateVerification = (_id: string, verificationStatus: string, note?: string) =>
    mutate({ variables: { _id, verificationStatus, note } });

  return { updateVerification, loading };
};
