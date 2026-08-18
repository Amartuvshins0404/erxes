import { Select } from 'erxes-ui';

export const SelectPriceType = ({
  value,
  onValueChange,
}: {
  value: 'priceBySize' | 'priceByUnit';
  onValueChange: (value: 'priceBySize' | 'priceByUnit') => void;
}) => {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <Select.Trigger className="h-8">
        <Select.Value />
      </Select.Trigger>
      <Select.Content>
        <Select.Item value="priceBySize">m²</Select.Item>
        <Select.Item value="priceByUnit">unit</Select.Item>
      </Select.Content>
    </Select>
  );
};
