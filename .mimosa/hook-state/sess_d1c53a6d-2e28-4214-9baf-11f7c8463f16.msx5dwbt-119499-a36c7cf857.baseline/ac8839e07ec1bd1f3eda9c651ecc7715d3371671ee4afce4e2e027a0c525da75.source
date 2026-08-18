import { useState } from 'react';
import {
  Button,
  isUndefinedOrNull,
  Sheet,
  Spinner,
  useQueryState,
} from 'erxes-ui';
import { IconPencil } from '@tabler/icons-react';
import { useMarketDetail } from '../hooks/useMarkets';
import { MarketForm } from './MarketForms';
import { useMarketsUpdate } from '../hooks/useMarketsUpdate';

export const MarketEditSheet = () => {
  const [open, setOpen] = useState(false);
  const [activeMarketId] = useQueryState<string | null>('activeMarketId');

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <Sheet.Trigger asChild>
        <Button>
          <IconPencil />
          Edit
        </Button>
      </Sheet.Trigger>
      <Sheet.View className="p-0 sm:max-w-5xl">
        <Sheet.Header>
          <Sheet.Title>Edit market</Sheet.Title>
          <Sheet.Close />
        </Sheet.Header>
        {activeMarketId && <MarketEdit id={activeMarketId} setOpen={setOpen} />}
      </Sheet.View>
    </Sheet>
  );
};

export const MarketEdit = ({
  id,
  setOpen,
}: {
  id: string;
  setOpen: (open: boolean) => void;
}) => {
  const { marketDetail, loading } = useMarketDetail({ id });
  const { updateMarket, loading: updateLoading } = useMarketsUpdate({ id });

  if (loading) return <Spinner />;

  return (
    <MarketForm
      defaultValues={Object.fromEntries(
        Object.entries(marketDetail || {}).map(([key, value]) => [
          key,
          isUndefinedOrNull(value) ? undefined : value,
        ]),
      )}
      onSubmit={(data) => {
        updateMarket({
          variables: {
            id,
            input: data,
          },
          onCompleted: () => {
            setOpen(false);
          },
        });
      }}
      loading={updateLoading}
      isEdit={true}
    />
  );
};
