import { InfoCard } from 'erxes-ui';
import {
  CLIENT_TYPE_LABELS,
  PROPERTY_TYPE_LABELS,
  SERVICE_LABELS,
} from '../constants';
import { useAgencyDetail } from '../hooks/useAgencyDetail';
import { AgencyDetailBadgeField } from './AgencyDetailField';

const toLabels = (
  values: string[] | undefined,
  labels: Record<string, string>,
) => values?.map((value) => labels[value] ?? value);

export const AgencyDetailActivity = () => {
  const { agency } = useAgencyDetail();
  const { propertyTypes, services, clientTypes } =
    agency?.fieldsOfExpertise ?? {};

  return (
    <div className="flex flex-col gap-6 p-8">
      <InfoCard
        title="Field of activity"
        description="What the agency declared it works on"
      >
        <InfoCard.Content className="grid grid-cols-3 gap-6">
          <AgencyDetailBadgeField
            label="Property types"
            values={toLabels(propertyTypes, PROPERTY_TYPE_LABELS)}
          />
          <AgencyDetailBadgeField
            label="Services"
            values={toLabels(services, SERVICE_LABELS)}
          />
          <AgencyDetailBadgeField
            label="Client types"
            values={toLabels(clientTypes, CLIENT_TYPE_LABELS)}
          />
        </InfoCard.Content>
      </InfoCard>
    </div>
  );
};
