import { InfoCard, InfoCardContent } from '@/btk/components/card';
import {
  ADDRESS_CITY,
  ADDRESS_DISTRICT,
} from '~/modules/news/constants/address';
import { useNewsDetail } from '~/modules/news/hooks/useNewsDetail';
import { useUpdateNewsGeneralInfo } from '~/modules/news/hooks/useUpdateNews';
import { INewsLocation } from '~/modules/news/types/newsTypes';
import { Label, Select, Input, Textarea } from 'erxes-ui';
import { useState } from 'react';

export const NewsAddress = () => {
  const { news } = useNewsDetail();
  const { city, district, address, parcelId } = news?.location || {};
  const { updateNewsGeneralInfo } = useUpdateNewsGeneralInfo();
  const [selectedCity, setSelectedCity] = useState<string>(
    city || 'Улаанбаатар',
  );
  const [selectedDistrict, setSelectedDistrict] = useState<string>(
    district || '',
  );
  const [addressValue, setAddressValue] = useState<string>(address || '');
  const [parcelIdValue, setParcelIdValue] = useState<string>(parcelId || '');

  const handleUpdateNewsLocation = (location: INewsLocation) => {
    updateNewsGeneralInfo(news?._id || '', {
      name: news?.name || '',
      location: {
        city,
        district,
        address,
        parcelId,
        ...location,
      },
    });
  };

  return (
    <InfoCard title="Address" description="News address">
      <InfoCardContent>
        <div className="space-y-2">
          <Label asChild>
            <span>City/District</span>
          </Label>
          <Select
            value={selectedCity}
            onValueChange={(value) => {
              setSelectedCity(value);
              handleUpdateNewsLocation({
                city: value,
                district: '',
              });
              setSelectedDistrict('');
            }}
          >
            <Select.Trigger className="h-8">
              <Select.Value placeholder="Select city" />
            </Select.Trigger>
            <Select.Content>
              {ADDRESS_CITY.map((city: string) => (
                <Select.Item key={city} value={city}>
                  {city}
                </Select.Item>
              ))}
            </Select.Content>
          </Select>
        </div>
        <div className="space-y-2">
          <Label asChild>
            <span>District</span>
          </Label>
          <Select
            value={selectedDistrict}
            onValueChange={(value) => {
              setSelectedDistrict(value);
              handleUpdateNewsLocation({
                district: value,
              });
            }}
          >
            <Select.Trigger className="h-8">
              <Select.Value placeholder="Select district" />
            </Select.Trigger>
            <Select.Content>
              {ADDRESS_DISTRICT[
                selectedCity as keyof typeof ADDRESS_DISTRICT
              ]?.map((district) => (
                <Select.Item key={district.value} value={district.value}>
                  {district.label}
                </Select.Item>
              ))}
            </Select.Content>
          </Select>
        </div>
        <div className="space-y-2">
          <Label asChild>
            <span>Address</span>
          </Label>
          <Textarea
            value={addressValue}
            onChange={(e) => setAddressValue(e.target.value)}
            onBlur={() => {
              handleUpdateNewsLocation({
                address: addressValue,
              });
            }}
          />
        </div>
        <div className="space-y-2">
          <Label asChild>
            <span>Parcel Id</span>
          </Label>
          <Input
            value={parcelIdValue}
            onChange={(e) => setParcelIdValue(e.target.value)}
            onBlur={() => {
              handleUpdateNewsLocation({
                parcelId: parcelIdValue,
              });
            }}
          />
        </div>
      </InfoCardContent>
    </InfoCard>
  );
};
