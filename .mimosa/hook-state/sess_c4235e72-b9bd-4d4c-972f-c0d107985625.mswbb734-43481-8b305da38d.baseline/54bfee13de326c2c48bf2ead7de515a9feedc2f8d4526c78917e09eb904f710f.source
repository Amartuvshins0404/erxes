import { InfoCard, InfoCardContent } from '@/block/components/card';
import { IProjectPrice } from '@/project/types/projectTypes';
import { CurrencyCode, CurrencyField, Label, Select } from 'erxes-ui';
import { useEffect, useState } from 'react';
import { useProjectDetail } from '../hooks/useProjectDetail';

export const ProjectPrice = () => {
  const { project } = useProjectDetail();
  const [mainPrice, setMainPrice] = useState(project?.mainPrice);
  const [prices, setPrices] = useState<IProjectPrice[]>(
    project?.prices?.map((p) => ({
      currency: p.currency as CurrencyCode,
      price: p.price,
      priceType: p.priceType as IProjectPrice['priceType'],
    })) || [],
  );

  useEffect(() => {
    if (project?.mainPrice) {
      setMainPrice(project?.mainPrice);
    }
  }, [project?.mainPrice]);

  useEffect(() => {
    if (project?.prices) {
      setPrices(
        project?.prices?.map((p) => ({
          currency: p.currency as CurrencyCode,
          price: p.price,
          priceType: p.priceType as IProjectPrice['priceType'],
        })) || [],
      );
    }
  }, [project?.prices]);

  return (
    <InfoCard title="Pricing Settings" description="Square meter price">
      <InfoCardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Main Price</Label>
          <CurrencyField.ValueInput value={mainPrice} />
        </div>
        <div className="space-y-2">
          <Label asChild>
            <legend>Prices</legend>
          </Label>
          {prices && prices.length > 0 && (
            <div className="space-y-2 pb-2">
              {(prices || []).map((price, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <CurrencyField.SelectCurrency
                    value={price.currency as CurrencyCode}
                    display="code"
                  />
                  <CurrencyField.ValueInput value={price.price} />
                  <Select value={price.priceType}>
                    <Select.Trigger className="h-8">
                      <Select.Value placeholder="per" />
                    </Select.Trigger>
                    <Select.Content>
                      <Select.Item value="priceBySize">per m²</Select.Item>
                      <Select.Item value="priceByQuantity">
                        per unit
                      </Select.Item>
                    </Select.Content>
                  </Select>
                </div>
              ))}
            </div>
          )}
        </div>
      </InfoCardContent>
    </InfoCard>
  );
};
