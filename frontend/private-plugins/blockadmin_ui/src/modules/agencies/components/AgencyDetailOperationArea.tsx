import { InfoCard } from 'erxes-ui';
import { ADDRESS_DISTRICT_SIMPLIFIED } from '../constants/address';
import { useAgencyDetail } from '../hooks/useAgencyDetail';
import { AgencyDetailField } from './AgencyDetailField';

export const AgencyDetailOperationArea = () => {
  const { agency } = useAgencyDetail();
  const { city, district } = agency?.operationArea ?? {};

  return (
    <div className="flex flex-col gap-6 p-8">
      <InfoCard
        title="Operation area"
        description="Where the agency declared it operates"
      >
        <InfoCard.Content className="grid grid-cols-2 gap-6">
          <AgencyDetailField label="City" value={city} />
          <AgencyDetailField
            label="District"
            value={
              district ? ADDRESS_DISTRICT_SIMPLIFIED[district] ?? district : ''
            }
          />
        </InfoCard.Content>
      </InfoCard>
    </div>
  );
};
