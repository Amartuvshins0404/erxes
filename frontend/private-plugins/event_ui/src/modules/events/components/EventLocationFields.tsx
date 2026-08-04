import {
  Form,
  InfoCard,
  Input,
  Label,
  Select,
  Switch,
  Textarea,
} from 'erxes-ui';
import { UseFormReturn } from 'react-hook-form';
import {
  GoogleMap,
  IGoogleMapLocation,
} from '@/events/components/GoogleMap';
import { EventFormValues } from '@/events/components/eventFormSchema';
import {
  ADDRESS_CITY,
  ADDRESS_DISTRICT,
  ADDRESS_DISTRICT_SIMPLIFIED,
} from '~/lib/mongoliaAddress';

export const EventLocationFields = ({
  form,
}: {
  form: UseFormReturn<EventFormValues>;
}) => {
  const isOnline = form.watch('isOnline');
  const location = form.watch('location');
  const selectedCity = location?.city ?? '';

  const applyPicked = (picked: IGoogleMapLocation) => {
    const current = form.getValues('location');

    form.setValue(
      'location',
      {
        ...current,
        lat: picked.lat,
        lng: picked.lng,
        city: picked.city || current?.city || '',
        district: picked.district
          ? ADDRESS_DISTRICT_SIMPLIFIED[picked.district] || picked.district
          : current?.district || '',
        address: picked.address || current?.address || '',
      },
      { shouldDirty: true },
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <InfoCard title="Format">
        <InfoCard.Content>
          <Form.Field
            control={form.control}
            name="isOnline"
            render={({ field }) => (
              <Form.Item className="flex flex-row justify-between items-center">
                <Form.Label>Online event</Form.Label>
                <Form.Control>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </Form.Control>
              </Form.Item>
            )}
          />

          {isOnline && (
            <Form.Field
              control={form.control}
              name="onlineUrl"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>Online link</Form.Label>
                  <Form.Control>
                    <Input placeholder="https://" {...field} />
                  </Form.Control>
                  <Form.Message />
                </Form.Item>
              )}
            />
          )}
        </InfoCard.Content>
      </InfoCard>

      {!isOnline && (
        <InfoCard title="Venue" description="Event venue">
          <InfoCard.Content className="grid gap-3 md:grid-cols-3">
            <div className="flex flex-col gap-3">
              <Form.Field
                control={form.control}
                name="location.city"
                render={({ field }) => (
                  <Form.Item>
                    <Form.Label>City/District</Form.Label>
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value);
                        form.setValue('location.district', '');
                      }}
                    >
                      <Form.Control>
                        <Select.Trigger className="h-8">
                          <Select.Value placeholder="Хотын нэрийг оруулна уу" />
                        </Select.Trigger>
                      </Form.Control>
                      <Select.Content>
                        {ADDRESS_CITY.map((city) => (
                          <Select.Item key={city} value={city}>
                            {city}
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select>
                    <Form.Message />
                  </Form.Item>
                )}
              />

              <Form.Field
                control={form.control}
                name="location.district"
                render={({ field }) => (
                  <Form.Item>
                    <Form.Label>District</Form.Label>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={!selectedCity}
                    >
                      <Form.Control>
                        <Select.Trigger className="h-8">
                          <Select.Value placeholder="Дүүргээ сонгоно уу" />
                        </Select.Trigger>
                      </Form.Control>
                      <Select.Content>
                        {ADDRESS_DISTRICT[selectedCity]?.map((district) => (
                          <Select.Item
                            key={district.value}
                            value={district.value}
                          >
                            {district.label}
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select>
                    <Form.Message />
                  </Form.Item>
                )}
              />

              <div className="flex flex-col gap-2">
                <Label>Coordinates</Label>
                <div className="flex gap-2">
                  <Form.Field
                    control={form.control}
                    name="location.lat"
                    render={({ field }) => (
                      <Form.Item className="flex-1">
                        <Form.Control>
                          <Input
                            type="number"
                            placeholder="Latitude"
                            value={field.value ?? ''}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value
                                  ? Number(e.target.value)
                                  : undefined,
                              )
                            }
                          />
                        </Form.Control>
                        <Form.Message />
                      </Form.Item>
                    )}
                  />
                  <Form.Field
                    control={form.control}
                    name="location.lng"
                    render={({ field }) => (
                      <Form.Item className="flex-1">
                        <Form.Control>
                          <Input
                            type="number"
                            placeholder="Longitude"
                            value={field.value ?? ''}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value
                                  ? Number(e.target.value)
                                  : undefined,
                              )
                            }
                          />
                        </Form.Control>
                        <Form.Message />
                      </Form.Item>
                    )}
                  />
                </div>
              </div>

              <Form.Field
                control={form.control}
                name="location.address"
                render={({ field }) => (
                  <Form.Item>
                    <Form.Label>Address</Form.Label>
                    <Form.Control>
                      <Textarea
                        placeholder="Blue Sky Tower, 20 давхар"
                        rows={6}
                        {...field}
                      />
                    </Form.Control>
                    <Form.Message />
                  </Form.Item>
                )}
              />
            </div>

            <div className="overflow-hidden rounded-sm md:col-span-2 h-80 w-full">
              <GoogleMap coordinate={location} onSelect={applyPicked} />
            </div>
          </InfoCard.Content>
        </InfoCard>
      )}
    </div>
  );
};
