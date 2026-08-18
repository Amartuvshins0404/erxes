import { UseFormReturn } from 'react-hook-form';
import { Form, InfoCard, Input, Textarea, Select } from 'erxes-ui';
import { IListing } from '../types/listing';
import { LISTING_TYPES, STATUS_TYPES } from '../constants/listing';

type Props = {
  form: UseFormReturn<IListing>;
};

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export const ListingMainInfo = ({ form }: Props) => {
  const { control } = form;

  return (
    <InfoCard title="Basic Information">
      <InfoCard.Content className="grid grid-cols-3 gap-4">
        <Form.Field<IListing, 'title'>
          control={control}
          name="title"
          render={({ field }) => (
            <Form.Item className="col-span-3">
              <Form.Label>Title</Form.Label>
              <Form.Control>
                <Input {...field} placeholder="Enter listing title" />
              </Form.Control>
              <Form.Message />
            </Form.Item>
          )}
        />

        <Form.Field<IListing, 'type'>
          control={control}
          name="type"
          render={({ field }) => (
            <Form.Item>
              <Form.Label>Type</Form.Label>
              <Form.Control>
                <Select value={field.value} onValueChange={field.onChange}>
                  <Select.Trigger>
                    <Select.Value placeholder="Select type" />
                  </Select.Trigger>
                  <Select.Content>
                    {LISTING_TYPES.map((t) => (
                      <Select.Item key={t} value={t}>
                        {capitalize(t)}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select>
              </Form.Control>
              <Form.Message />
            </Form.Item>
          )}
        />

        <Form.Field<IListing, 'propertyType'>
          control={control}
          name="propertyType"
          render={({ field }) => (
            <Form.Item>
              <Form.Label>Property Type</Form.Label>
              <Form.Control>
                <Input {...field} placeholder="e.g. apartment, house" />
              </Form.Control>
              <Form.Message />
            </Form.Item>
          )}
        />

        <Form.Field<IListing, 'status'>
          control={control}
          name="status"
          render={({ field }) => (
            <Form.Item>
              <Form.Label>Status</Form.Label>
              <Form.Control>
                <Select value={field.value} onValueChange={field.onChange}>
                  <Select.Trigger>
                    <Select.Value placeholder="Select status" />
                  </Select.Trigger>
                  <Select.Content>
                    {STATUS_TYPES.map((s) => (
                      <Select.Item key={s} value={s}>
                        {capitalize(s)}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select>
              </Form.Control>
              <Form.Message />
            </Form.Item>
          )}
        />

        <Form.Field<IListing, 'description'>
          control={control}
          name="description"
          render={({ field }) => (
            <Form.Item className="col-span-3">
              <Form.Label>Description</Form.Label>
              <Form.Control>
                <Textarea {...field} placeholder="Enter listing description" />
              </Form.Control>
              <Form.Message />
            </Form.Item>
          )}
        />
      </InfoCard.Content>
    </InfoCard>
  );
};
