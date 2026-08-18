import { InfoCard, InfoCardContent } from '@/block/components/card';
import { GoogleMap } from '@/block/components/GoogleMap';
import { ADDRESS_CITY, ADDRESS_DISTRICT, ADDRESS_DISTRICT_SIMPLIFIED } from '@/project/constants/address';
import { useProjectDetail } from '@/project/hooks/useProjectDetail';
import { useUpdateProjectGeneralInfo } from '@/project/hooks/useUpdateProject';
import { IProjectLocation } from '@/project/types/projectTypes';
import { Input, Label, Select, Textarea } from 'erxes-ui';
import { useState } from 'react';

export const ProjectAddress = () => {
  const { project } = useProjectDetail();
  const { city, district, address, lat, lng } = project?.location || {};
  const { updateProjectGeneralInfo } = useUpdateProjectGeneralInfo();
  const [selectedCity, setSelectedCity] = useState<string>(city || '');
  const [selectedDistrict, setSelectedDistrict] = useState<string>(
    district || '',
  );
  const [addressValue, setAddressValue] = useState<string>(address || '');

  const [latValue, setLatValue] = useState<number | undefined>(lat || 47.92123);
  const [lngValue, setLngValue] = useState<number | undefined>(
    lng || 106.918556,
  );

  const handleUpdateProjectLocation = (location: IProjectLocation) => {
    updateProjectGeneralInfo(project?._id || '', {
      name: project?.name || '',
      location: {
        city,
        district,
        address,
        lat,
        lng,
        ...location,
      },
    });
  };

  const handleMapSelect = (value: {
    lat: number;
    lng: number;
    city?: string;
    district?: string;
    address?: string;
  }) => {
    const { lat, lng, city, district, address } = value || {};

    setLatValue(lat);
    setLngValue(lng);
    setSelectedCity(city || '');
    setSelectedDistrict(district ? ADDRESS_DISTRICT_SIMPLIFIED[district] || district : '');
    setAddressValue(address || '');

    const location: Record<string, string | number> = {
      lat,
      lng,
    };

    if (city) {
      location.city = city;
    }

    if (district) {
      location.district = ADDRESS_DISTRICT_SIMPLIFIED[district] || district;
    }

    if (address) {
      location.address = address;
    }

    handleUpdateProjectLocation(location);
  };

  return (
    <InfoCard title="Address" description="Project address">
      <InfoCardContent>
        <div className="gap-3 grid grid-cols-3">
          <div className="flex flex-col gap-3">
            <div className="space-y-2">
              <Label asChild>
                <span>City/District</span>
              </Label>
              <Select
                value={selectedCity}
                onValueChange={(value) => {
                  setSelectedCity(value);
                  handleUpdateProjectLocation({
                    city: value,
                    district: '',
                  });
                  setSelectedDistrict('');
                }}
              >
                <Select.Trigger className="h-8">
                  <Select.Value placeholder="Хотын нэрийг оруулна уу" />
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
                  handleUpdateProjectLocation({
                    district: value,
                  });
                }}
              >
                <Select.Trigger className="h-8">
                  <Select.Value placeholder="Дүүргээ сонгоно уу" />
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
                <span>Coordinates</span>
              </Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Latitude"
                  value={latValue ? latValue : undefined}
                  onChange={(e) =>
                    setLatValue(
                      e.target.value ? Number(e.target.value) : undefined,
                    )
                  }
                  onBlur={() => {
                    handleUpdateProjectLocation({
                      lat: latValue,
                    });
                  }}
                />
                <Input
                  placeholder="Longitude"
                  value={lngValue ? lngValue : undefined}
                  onChange={(e) =>
                    setLngValue(
                      e.target.value ? Number(e.target.value) : undefined,
                    )
                  }
                  onBlur={() => {
                    handleUpdateProjectLocation({
                      lng: lngValue,
                    });
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label asChild>
                <span>Address</span>
              </Label>
              <Textarea
                placeholder="Хаяг оруулна уу"
                rows={10}
                value={addressValue}
                onChange={(e) => setAddressValue(e.target.value)}
                onBlur={() => {
                  handleUpdateProjectLocation({
                    address: addressValue,
                  });
                }}
              />
            </div>
          </div>
          <div className="flex flex-col space-y-2 col-span-2 rounded-sm overflow-hidden">
            <GoogleMap
              coordinate={{ lat: latValue, lng: lngValue }}
              onSelect={handleMapSelect}
            />
          </div>
        </div>
      </InfoCardContent>
    </InfoCard>
  );
};
