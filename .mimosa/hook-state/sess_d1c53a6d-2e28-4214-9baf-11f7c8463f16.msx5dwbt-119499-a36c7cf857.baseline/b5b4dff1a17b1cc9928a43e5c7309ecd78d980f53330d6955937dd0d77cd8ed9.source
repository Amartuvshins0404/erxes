import { Form, InfoCard } from 'erxes-ui';
import { useAgencyInfo } from '../hooks/useAgencyInfo';
import { useForm } from 'react-hook-form';
import { AgencyOperationAreasValues } from '../types/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { agencyOperationAreasSchema } from '../schema/form';
import { useUpdateAgency } from '../hooks/useUpdateAgency';
import { SelectArea } from '../form/SelectArea';

export const AgencyProfileOperationArea = () => {
  const { loading } = useAgencyInfo();

  if (loading) return null;

  return (
    <div className="flex flex-col gap-6 p-8">
      <InfoCard
        title="Operation Area"
        description="Agency's operation area in terms of cities, districts, and neighborhoods"
      >
        <InfoCard.Content>
          <AgencyOperationAreaInfo />
        </InfoCard.Content>
      </InfoCard>
    </div>
  );
};

export const AgencyOperationAreaInfo = () => {
  const { agencyInfo } = useAgencyInfo();
  const form = useForm<AgencyOperationAreasValues>({
    mode: 'onBlur',
    resolver: zodResolver(agencyOperationAreasSchema),
    defaultValues: {
      operationArea: {
        city: agencyInfo?.operationArea?.city || '',
        district: agencyInfo?.operationArea?.district || '',
      },
    },
  });
  const { updateAgency } = useUpdateAgency();
  const operationArea = form.watch('operationArea');

  const handleSave = (patch: Partial<AgencyOperationAreasValues>) => {
    const values = { ...form.getValues(), ...patch };
    updateAgency({ variables: { input: values } });
  };

  return (
    <Form {...form}>
      <form className="space-y-3">
        <Form.Field<AgencyOperationAreasValues, 'operationArea.city'>
          control={form.control}
          name="operationArea.city"
          render={({ field }) => (
            <Form.Item>
              <Form.Label>City</Form.Label>
              <Form.Control>
                <SelectArea
                  city={operationArea.city}
                  onCityChange={(value) => {
                    field.onChange(value);
                    handleSave({
                      operationArea: { ...operationArea, city: value },
                    });
                  }}
                >
                  <SelectArea.City />
                </SelectArea>
              </Form.Control>
              <Form.Message />
            </Form.Item>
          )}
        />

        <Form.Field<AgencyOperationAreasValues, 'operationArea.district'>
          control={form.control}
          name="operationArea.district"
          render={({ field }) => (
            <Form.Item>
              <Form.Label>District</Form.Label>
              <Form.Control>
                <SelectArea
                  city={operationArea.city}
                  district={field.value}
                  onDistrictChange={(value) => {
                    field.onChange(value);
                    handleSave({
                      operationArea: {
                        ...operationArea,
                        district: value,
                      },
                    });
                  }}
                >
                  <SelectArea.District />
                </SelectArea>
              </Form.Control>
              <Form.Message />
            </Form.Item>
          )}
        />
      </form>
    </Form>
  );
};
