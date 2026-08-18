import { UseFormReturn } from 'react-hook-form';
import { IListing } from '../types/listing';
import { Form, InfoCard, Input, Select } from 'erxes-ui';

type Props = {
  form: UseFormReturn<IListing>;
};

const CURRENT_YEAR = new Date().getFullYear();
const BUILT_YEAR_OPTIONS = Array.from({ length: 100 }, (_, i) =>
  String(CURRENT_YEAR - i),
);

const toInt = (v: string) => (v ? parseInt(v, 10) : undefined);
const toFloat = (v: string) => parseFloat(v) || 0;

export const ListingSpecs = ({ form }: Props) => {
  const { control } = form;

  return (
    <InfoCard title="Specifications">
      <InfoCard.Content className="grid grid-cols-3 gap-4">
        <Form.Field<IListing, 'specs.area'>
          control={control}
          name="specs.area"
          render={({ field }) => (
            <Form.Item>
              <Form.Label>Area (m²)</Form.Label>
              <Form.Control>
                <Input
                  {...field}
                  onChange={(e) => field.onChange(toFloat(e.target.value))}
                  placeholder="0"
                />
              </Form.Control>
              <Form.Message />
            </Form.Item>
          )}
        />

        <Form.Field<IListing, 'specs.floor'>
          control={control}
          name="specs.floor"
          render={({ field }) => (
            <Form.Item>
              <Form.Label>Floor</Form.Label>
              <Form.Control>
                <Input
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(toInt(e.target.value))}
                  placeholder="Optional"
                />
              </Form.Control>
              <Form.Message />
            </Form.Item>
          )}
        />

        <Form.Field<IListing, 'specs.totalFloors'>
          control={control}
          name="specs.totalFloors"
          render={({ field }) => (
            <Form.Item>
              <Form.Label>Total Floors</Form.Label>
              <Form.Control>
                <Input
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(toInt(e.target.value))}
                  placeholder="Optional"
                />
              </Form.Control>
              <Form.Message />
            </Form.Item>
          )}
        />

        <Form.Field<IListing, 'specs.rooms'>
          control={control}
          name="specs.rooms"
          render={({ field }) => (
            <Form.Item>
              <Form.Label>Rooms</Form.Label>
              <Form.Control>
                <Input
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(toInt(e.target.value))}
                  placeholder="Optional"
                />
              </Form.Control>
              <Form.Message />
            </Form.Item>
          )}
        />

        <Form.Field<IListing, 'specs.builtYear'>
          control={control}
          name="specs.builtYear"
          render={({ field }) => (
            <Form.Item>
              <Form.Label>Built Year</Form.Label>
              <Form.Control>
                <Select value={field.value} onValueChange={field.onChange}>
                  <Select.Trigger>
                    <Select.Value placeholder="Select year" />
                  </Select.Trigger>
                  <Select.Content>
                    {BUILT_YEAR_OPTIONS.map((year) => (
                      <Select.Item key={year} value={year}>
                        {year}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select>
              </Form.Control>
              <Form.Message />
            </Form.Item>
          )}
        />
      </InfoCard.Content>
    </InfoCard>
  );
};
