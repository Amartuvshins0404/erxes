import { UseFormReturn } from 'react-hook-form';
import { IListing } from '../types/listing';
import { Form, InfoCard, Input, Textarea } from 'erxes-ui';
import { SelectArea } from '../../agency/form/SelectArea';
import { GoogleMap } from './GoogleMap';

type Props = {
  form: UseFormReturn<IListing>;
};

export const ListingLocation = ({ form }: Props) => {
  const { control, watch, setValue } = form;
  const [city, district, lat, lng] = watch([
    'location.city',
    'location.district',
    'location.lat',
    'location.lng',
  ]);

  const handleMapSelect = ({
    lat,
    lng,
    city,
    district,
    subDistrict,
  }: {
    lat: number;
    lng: number;
    city?: string;
    district?: string;
    subDistrict?: string;
  }) => {
    setValue('location.lat', lat);
    setValue('location.lng', lng);
    setValue('location.city', city ?? '');
    setValue('location.district', district ?? '');
    setValue('location.subDistrict', subDistrict ?? '');
  };

  return (
    <InfoCard title="Location">
      <InfoCard.Content className="flex flex-col gap-4">
        <div className="grid grid-cols-3 gap-4">
          <Form.Field<IListing, 'location.city'>
            control={control}
            name="location.city"
            render={({ field }) => (
              <Form.Item>
                <Form.Label>City</Form.Label>
                <Form.Control>
                  <SelectArea city={city} onCityChange={field.onChange}>
                    <SelectArea.City />
                  </SelectArea>
                </Form.Control>
                <Form.Message />
              </Form.Item>
            )}
          />

          <Form.Field<IListing, 'location.district'>
            control={control}
            name="location.district"
            render={({ field }) => (
              <Form.Item>
                <Form.Label>District</Form.Label>
                <Form.Control>
                  <SelectArea
                    city={city}
                    district={district}
                    onDistrictChange={field.onChange}
                  >
                    <SelectArea.District />
                  </SelectArea>
                </Form.Control>
                <Form.Message />
              </Form.Item>
            )}
          />

          <Form.Field<IListing, 'location.subDistrict'>
            control={control}
            name="location.subDistrict"
            render={({ field }) => (
              <Form.Item>
                <Form.Label>Sub-district</Form.Label>
                <Form.Control>
                  <Input {...field} placeholder="Sub-district" />
                </Form.Control>
                <Form.Message />
              </Form.Item>
            )}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-1 flex flex-col gap-4">
            <Form.Field<IListing, 'location.short'>
              control={control}
              name="location.short"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>Short Address</Form.Label>
                  <Form.Control>
                    <Textarea {...field} placeholder="Short address" />
                  </Form.Control>
                  <Form.Message />
                </Form.Item>
              )}
            />

            <Form.Field<IListing, 'location.lat'>
              control={control}
              name="location.lat"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>Latitude</Form.Label>
                  <Form.Control>
                    <Input
                      placeholder="Latitude"
                      value={field.value ?? ''}
                      onChange={(e) =>
                        field.onChange(parseFloat(e.target.value) || 0)
                      }
                    />
                  </Form.Control>
                  <Form.Message />
                </Form.Item>
              )}
            />

            <Form.Field<IListing, 'location.lng'>
              control={control}
              name="location.lng"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>Longitude</Form.Label>
                  <Form.Control>
                    <Input
                      placeholder="Longitude"
                      value={field.value ?? ''}
                      onChange={(e) =>
                        field.onChange(parseFloat(e.target.value) || 0)
                      }
                    />
                  </Form.Control>
                  <Form.Message />
                </Form.Item>
              )}
            />
          </div>

          <div className="col-span-2 rounded-sm overflow-hidden">
            <GoogleMap coordinate={{ lat, lng }} onSelect={handleMapSelect} />
          </div>
        </div>
      </InfoCard.Content>
    </InfoCard>
  );
};
