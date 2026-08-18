import { OfferFormData } from '@/offer/constants/offerSchema';
import { IProjectPrice } from '@/project/types/projectTypes';
import { Combobox, Popover, Command } from 'erxes-ui';
import { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';

export const SelectPrice = ({
  prices,
  value,
  onValueChange,
  form,
}: {
  prices: (IProjectPrice & { _id: string })[];
  value: string;
  onValueChange: (value: string) => void;
  form: UseFormReturn<OfferFormData>;
}) => {
  const [open, setOpen] = useState(false);
  const selectedPrice = prices.find((price) => price._id === value);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Combobox.Trigger>
        {selectedPrice ? (
          <>
            <div className="text-muted-foreground">
              {selectedPrice.currency}
            </div>
            <div className="text-foreground">
              {selectedPrice.price?.toLocaleString()}
            </div>
            <div className="ml-auto text-muted-foreground">
              {selectedPrice.priceType === 'priceBySize'
                ? 'per m²'
                : 'per unit'}
            </div>
          </>
        ) : (
          <span />
        )}
      </Combobox.Trigger>
      <Combobox.Content>
        <Command>
          <Command.Input />
          <Command.List>
            <Command.Empty>No price found</Command.Empty>
            {prices.map((price) => (
              <Command.Item
                key={price.currency + price.price + price.priceType}
                value={price.currency + price.price + price.priceType}
                onSelect={() => {
                  onValueChange(price._id);
                  form.setValue('price', {
                    currency: price.currency,
                    price: price.price,
                    priceType: price.priceType as any,
                  });
                  setOpen(false);
                }}
                className="h-auto"
              >
                <div className="text-muted-foreground">{price.currency}</div>
                <div className="text-foreground">
                  {price.price?.toLocaleString()}
                </div>
                <div className="ml-auto text-muted-foreground">
                  {price.priceType === 'priceBySize' ? 'per m²' : 'per unit'}
                </div>
              </Command.Item>
            ))}
          </Command.List>
        </Command>
      </Combobox.Content>
    </Popover>
  );
};
