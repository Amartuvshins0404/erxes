import { InfoCard, InfoCardContent } from '@/block/components/card';
import { useUpdateProjectGeneralInfo } from '@/project/hooks/useUpdateProject';
import { IProjectPrice } from '@/project/types/projectTypes';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import { Button, CurrencyCode, CurrencyField, Label } from 'erxes-ui';
import { useEffect, useState } from 'react';
import { useCurrency } from '../hooks/useCurrency';
import { useProjectDetail } from '../hooks/useProjectDetail';

export const ProjectPrice = () => {
  const { project } = useProjectDetail();
  const { updateProjectGeneralInfo } = useUpdateProjectGeneralInfo();

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

  const handleMainPriceBlur = () => {
    if (mainPrice !== project?.mainPrice) {
      updateProjectGeneralInfo(project?._id || '', { mainPrice });
    }
  };

  const handlePriceChange = (
    index: number,
    data: { price?: number; priceType?: IProjectPrice['priceType'] },
  ) => {
    setPrices(prices?.map((p, i) => (i === index ? { ...p, ...data } : p)));
  };

  const handlePriceDelete = (index: number) => {
    const newPrices = prices?.filter((_, i) => i !== index);
    setPrices(newPrices);
    updateProjectGeneralInfo(project?._id || '', { prices: newPrices });
  };

  const handleAddPrice = (currency: CurrencyCode, price: number) => {
    const newPrices: IProjectPrice[] = [
      ...(prices || []),
      {
        currency,
        price,
        priceType: 'priceBySize' as IProjectPrice['priceType'],
      },
    ];
    setPrices(newPrices);
    updateProjectGeneralInfo(project?._id || '', { prices: newPrices });
  };

  return (
    <InfoCard title="Pricing Settings" description="Price per m²">
      <InfoCardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Main Price per m²</Label>
          <CurrencyField.ValueInput
            value={mainPrice}
            onChange={setMainPrice}
            onBlur={handleMainPriceBlur}
          />
        </div>
        <div className="space-y-2">
          <Label asChild>
            <legend>Prices per m²</legend>
          </Label>
          {prices && prices.length > 0 && (
            <div className="space-y-2 pb-2">
              {(prices || []).map((price, index) => (
                <div key={index} className="flex items-center gap-2">
                  <CurrencyField.SelectCurrency
                    value={price.currency as CurrencyCode}
                    display="code"
                  />
                  <CurrencyField.ValueInput
                    value={price.price}
                    onChange={(value) =>
                      handlePriceChange(index, { price: value })
                    }
                  />
                  <Button
                    variant="secondary"
                    size="icon"
                    className="bg-destructive/10 hover:bg-destructive/20 size-8 text-destructive"
                    onClick={() => handlePriceDelete(index)}
                  >
                    <IconTrash />
                  </Button>
                </div>
              ))}
            </div>
          )}
          <ProjectPriceAddPrice onAddPrice={handleAddPrice} />
        </div>
      </InfoCardContent>
    </InfoCard>
  );
};

export const ProjectPriceAddPrice = ({
  onAddPrice,
}: {
  onAddPrice: (currency: CurrencyCode, price: number) => void;
}) => {
  const { mainCurrency } = useCurrency();

  const [currency, setCurrency] = useState<CurrencyCode | ''>('');
  const [price, setPrice] = useState<number | undefined>();

  useEffect(() => {
    if (mainCurrency) {
      setCurrency(mainCurrency);
    }
  }, [mainCurrency]);

  return (
    <>
      <div className="space-y-2">
        <Label>Add Price per m²</Label>
        <div className="gap-2 grid grid-cols-2">
          <CurrencyField.SelectCurrency
            value={currency as CurrencyCode}
            display="code"
            onChange={setCurrency}
          />
          <CurrencyField.ValueInput
            placeholder="0"
            value={price}
            onChange={setPrice}
          />
        </div>
      </div>
      <Button
        variant="secondary"
        className="mt-4 w-full"
        disabled={!currency || !price}
        onClick={() => {
          onAddPrice(currency as CurrencyCode, price || 0);
          setCurrency('');
          setPrice(undefined);
        }}
      >
        <IconPlus />
        Add Price
      </Button>
    </>
  );
};
