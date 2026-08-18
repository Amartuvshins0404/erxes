import { SelectPriceType } from '@/pricing/components/SelectPriceType';
import { IProjectPrice } from '@/project/types/projectTypes';
import { CurrencyCode, CurrencyField, Label } from 'erxes-ui';
import { useState } from 'react';

export const PricingDetail = ({
  mainPrice,
  updateUnit,
  prices,
}: {
  mainPrice: number;
  updateUnit: (data: { mainPrice?: number }) => void;
  prices: IProjectPrice[];
}) => {
  const [mainPriceState, setMainPriceState] = useState(4500000);
  const [pricesState, setPricesState] = useState(prices);

  const handlePriceChange = (index: number, data: Partial<IProjectPrice>) => {
    setPricesState(
      pricesState?.map((p, i) => (i === index ? { ...p, ...data } : p)),
    );
  };

  return (
    <>
      <div className="space-y-2">
        <Label>Main Price / m²</Label>
        <CurrencyField.ValueInput
          value={mainPriceState}
          onChange={(value) => setMainPriceState(value)}
          onBlur={() => {
            mainPrice !== mainPriceState &&
              updateUnit({ mainPrice: mainPriceState });
          }}
        />
      </div>
      <div className="col-start-1 space-y-2 col-span-3">
        <Label>Prices</Label>
        {pricesState?.map((price, index) => (
          <div className="grid grid-cols-3 gap-2">
            <CurrencyField.SelectCurrency
              value={(price.currency as CurrencyCode)}
              onChange={(value) =>
                handlePriceChange(index, { currency: value })
              }
              display="code"
            />
            <CurrencyField.ValueInput
              value={price.price}
              onChange={(value) => handlePriceChange(index, { price: value })}
            />
            <SelectPriceType
              value={price.priceType}
              onValueChange={(value) =>
                handlePriceChange(index, { priceType: value })
              }
            />
          </div>
        ))}
      </div>
    </>
  );
};
