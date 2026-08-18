import { useQuery } from '@apollo/client';
import { Spinner } from 'erxes-ui';
import { useTranslation } from 'react-i18next';
import { MUSHOP_SUPPLIER_POS_LIST } from '../graphql/queries';
import { IPosConfig } from '../types';

interface Props {
  supplierId: string;
  currentPosToken?: string;
}

// Read-only: the supplier owns this selection (set on their own profile).
export const SelectSupplierPos = ({ supplierId, currentPosToken }: Props) => {
  const { t } = useTranslation('mushop');

  const { data, loading } = useQuery<{ mushopSupplierPosList: IPosConfig[] }>(
    MUSHOP_SUPPLIER_POS_LIST,
    { variables: { supplierId }, skip: !currentPosToken },
  );

  if (!currentPosToken) {
    return (
      <span className="text-muted-foreground">{t('Not selected')}</span>
    );
  }

  if (loading) {
    return <Spinner className="w-4 h-4" />;
  }

  const posList = data?.mushopSupplierPosList ?? [];
  const selected = posList.find((p) => p.token === currentPosToken);

  return <span>{selected?.name ?? currentPosToken}</span>;
};
