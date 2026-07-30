import { useQuery, useMutation } from '@apollo/client';
import {
  Button,
  Combobox,
  Command,
  Popover,
  PopoverScoped,
  Spinner,
} from 'erxes-ui';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MUSHOP_SUPPLIER_POS_LIST } from '../graphql/queries';
import { MUSHOP_UPDATE_SUPPLIER_POS } from '../graphql/mutations';
import { MUSHOP_SUPPLIER_DETAIL } from '../graphql/supplierDetail';
import { IPosConfig } from '../types';

interface Props {
  supplierId: string;
  currentPosToken?: string;
}

export const SelectSupplierPos = ({ supplierId, currentPosToken }: Props) => {
  const { t } = useTranslation('mushop');
  const [open, setOpen] = useState(false);

  const { data, loading } = useQuery<{ mushopSupplierPosList: IPosConfig[] }>(
    MUSHOP_SUPPLIER_POS_LIST,
    { variables: { supplierId } },
  );

  const [updatePos, { loading: saving }] = useMutation(
    MUSHOP_UPDATE_SUPPLIER_POS,
    {
      refetchQueries: [
        { query: MUSHOP_SUPPLIER_DETAIL, variables: { _id: supplierId } },
      ],
    },
  );

  const posList = data?.mushopSupplierPosList ?? [];
  const selected = posList.find((p) => p.token === currentPosToken);

  const handleSelect = (pos: IPosConfig) => {
    updatePos({ variables: { _id: supplierId, posToken: pos.token ?? '' } });
    setOpen(false);
  };

  return (
    <PopoverScoped open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="justify-start p-0 h-auto font-normal"
        >
          {saving ? (
            <Spinner className="w-4 h-4" />
          ) : (
            selected?.name ?? currentPosToken ?? t('Select POS...')
          )}
        </Button>
      </Popover.Trigger>
      <Combobox.Content>
        <Command>
          <Command.Input placeholder={t('Search POS...')} />
          <Command.List>
            {loading && (
              <Command.Empty>
                <Spinner className="mx-auto w-4 h-4" />
              </Command.Empty>
            )}
            {!loading && posList.length === 0 && (
              <Command.Empty>
                {t('Supplier has no available POS configurations')}
              </Command.Empty>
            )}
            {posList.map((pos) => (
              <Command.Item
                key={pos._id}
                value={pos.name ?? pos._id}
                onSelect={() => handleSelect(pos)}
              >
                {pos.name}
                <Combobox.Check checked={pos.token === currentPosToken} />
              </Command.Item>
            ))}
          </Command.List>
        </Command>
      </Combobox.Content>
    </PopoverScoped>
  );
};
