import { useMutation, useQuery } from '@apollo/client';
import { InfoCard, Label, NumberInput } from 'erxes-ui';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDebouncedCallback } from 'use-debounce';
import { IFormWidgetProps } from 'ui-modules';
import { MUSHOP_CONFIGS, MUSHOP_CONFIG_SAVE } from './graphql/config';
import {
  MUSHOP_PRODUCT_SPECIFICATION,
  MUSHOP_PRODUCT_SPECIFICATION_SAVE,
} from './graphql/productSpecification';

const CNY_TO_MNT_RATE_CODE = 'cnyToMntRate';
const TAX_RATE_CODE = 'taxRate';
const CONFIG_CODES = [CNY_TO_MNT_RATE_CODE, TAX_RATE_CODE];

const amountFromPercent = (unitPrice: number, percent: number) =>
  Math.round((unitPrice * percent) / 100);

const percentFromAmount = (unitPrice: number, amount: number) =>
  unitPrice ? (amount / unitPrice) * 100 : 0;

const SuffixedNumberInput = ({
  suffix,
  value,
  onChange,
  inputClassName = 'pr-8',
}: {
  suffix: string;
  value: number;
  onChange: (value: number) => void;
  inputClassName?: string;
}) => (
  <div className="relative">
    <NumberInput value={value} onChange={onChange} className={inputClassName} />
    <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-muted-foreground">
      {suffix}
    </span>
  </div>
);

const PercentAmountRow = ({
  label,
  unitPrice,
  percent,
  onPercentChange,
}: {
  label: string;
  unitPrice: number;
  percent: number;
  onPercentChange: (percent: number) => void;
}) => {
  const amount = amountFromPercent(unitPrice, percent);

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <SuffixedNumberInput
        suffix="%"
        value={percent}
        onChange={(value) => {
          if (value === percent) return;
          onPercentChange(value);
        }}
      />
      <SuffixedNumberInput
        suffix="₮"
        value={amount}
        onChange={(value) => {
          if (value === amount) return;
          onPercentChange(percentFromAmount(unitPrice, value));
        }}
      />
    </div>
  );
};

export const ProductFormWidget = ({ form, contentId }: IFormWidgetProps) => {
  const { t } = useTranslation('mushop');

  const unitPrice = Number(form.watch('unitPrice')) || 0;
  const productId = contentId;

  const [cnyCost, setCnyCost] = useState(0);
  const [rate, setRate] = useState(0);
  const [taxPercent, setTaxPercent] = useState(0);

  const { data: configData } = useQuery(MUSHOP_CONFIGS, {
    variables: { codes: CONFIG_CODES },
  });
  const [saveConfig] = useMutation(MUSHOP_CONFIG_SAVE);

  const seededConfig = useRef(false);
  useEffect(() => {
    const list = configData?.mushopConfigs;
    if (!list || seededConfig.current) return;
    seededConfig.current = true;
    const find = (code: string) =>
      list.find((c: { code: string; value: number }) => c.code === code)?.value;
    const rateValue = find(CNY_TO_MNT_RATE_CODE);
    const taxValue = find(TAX_RATE_CODE);
    if (typeof rateValue === 'number') setRate(rateValue);
    if (typeof taxValue === 'number') setTaxPercent(taxValue);
  }, [configData]);

  const productCode = String(form.watch('code') || '').trim();
  const { data: specData } = useQuery(MUSHOP_PRODUCT_SPECIFICATION, {
    variables: { productId, code: productCode || undefined },
    skip: !productId,
  });

  const [saveSpecification] = useMutation(MUSHOP_PRODUCT_SPECIFICATION_SAVE);

  const [profitPercent, setProfitPercent] = useState(0);
  const [prepaymentPercent, setPrepaymentPercent] = useState(0);
  const [moq, setMoq] = useState(0);

  const spec = specData?.mushopProductSpecification;
  const seededSpec = useRef(false);
  useEffect(() => {
    if (!spec || seededSpec.current) return;
    seededSpec.current = true;
    if (typeof spec.cnyCost === 'number') setCnyCost(spec.cnyCost);
    if (typeof spec.profitPercent === 'number')
      setProfitPercent(spec.profitPercent);
    if (typeof spec.prepaymentPercent === 'number')
      setPrepaymentPercent(spec.prepaymentPercent);
    if (typeof spec.moq === 'number') setMoq(spec.moq);
  }, [spec]);

  const saveConfigValue = useDebouncedCallback((code: string, value: number) => {
    saveConfig({ variables: { code, value } });
  }, 600);

  const specRef = useRef({ cnyCost, profitPercent, prepaymentPercent, moq });
  specRef.current = { cnyCost, profitPercent, prepaymentPercent, moq };

  const saveSpec = useDebouncedCallback(() => {
    const code = String(form.watch('code') || '').trim();
    if (productId) {
      saveSpecification({
        variables: { productId, code: code || undefined, input: specRef.current },
      });
      return;
    }
    if (!code) return;
    saveSpecification({ variables: { code, input: specRef.current } });
  }, 600);

  // Keep the spec's stored code in sync when the product code is edited.
  const lastSyncedCode = useRef(productCode);
  useEffect(() => {
    if (lastSyncedCode.current === productCode) return;
    lastSyncedCode.current = productCode;
    if (!productId) return;
    saveSpec();
  }, [productCode, productId, saveSpec]);

  const setUnitPrice = (cost: number, conversionRate: number) => {
    form.setValue('unitPrice', cost * conversionRate, { shouldDirty: true });
  };

  return (
    <div className="p-4 overflow-y-auto space-y-4">
      <InfoCard title={t('CNY conversion')}>
        <InfoCard.Content>
          <div className="space-y-2">
            <Label>{t('CNY cost')}</Label>
            <SuffixedNumberInput
              suffix="¥"
              value={cnyCost}
              onChange={(value) => {
                if (value === cnyCost) return;

                setCnyCost(value);
                setUnitPrice(value, rate);
                saveSpec();
              }}
            />
          </div>
          <div className="space-y-2">
            <Label>{t('CNY to MNT rate')}</Label>
            <SuffixedNumberInput
              suffix="₮"
              value={rate}
              onChange={(value) => {
                if (value === rate) return;

                setRate(value);
                saveConfigValue(CNY_TO_MNT_RATE_CODE, value);
                setUnitPrice(cnyCost, value);
              }}
            />
          </div>
        </InfoCard.Content>
      </InfoCard>

      <InfoCard title={t('Pricing')}>
        <InfoCard.Content>
          <PercentAmountRow
            label={t('Tax')}
            unitPrice={unitPrice}
            percent={taxPercent}
            onPercentChange={(value) => {
              setTaxPercent(value);
              saveConfigValue(TAX_RATE_CODE, value);
            }}
          />
          <PercentAmountRow
            label={t('Profit')}
            unitPrice={unitPrice}
            percent={profitPercent}
            onPercentChange={(value) => {
              setProfitPercent(value);
              saveSpec();
            }}
          />
          <PercentAmountRow
            label={t('Prepayment')}
            unitPrice={unitPrice}
            percent={prepaymentPercent}
            onPercentChange={(value) => {
              setPrepaymentPercent(value);
              saveSpec();
            }}
          />
        </InfoCard.Content>
      </InfoCard>

      <InfoCard title={t('Order')}>
        <InfoCard.Content>
          <div className="space-y-2">
            <Label>{t('Minimum order quantity')}</Label>
            <SuffixedNumberInput
              suffix={t('pcs')}
              inputClassName="pr-16"
              value={moq}
              onChange={(value) => {
                if (value === moq) return;

                setMoq(value);
                saveSpec();
              }}
            />
          </div>
        </InfoCard.Content>
      </InfoCard>
    </div>
  );
};

export default ProductFormWidget;
