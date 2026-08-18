import { Form, InfoCard } from 'erxes-ui';
import { useAgencyInfo } from '../hooks/useAgencyInfo';
import { useForm } from 'react-hook-form';
import { AgencyFieldsOfExpertiseValues } from '../types/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { agencyFieldsOfExpertiseSchema } from '../schema/form';
import { useUpdateAgency } from '../hooks/useUpdateAgency';
import { SelectPropertyType } from '../property/SelectPropertyType';
import { SelectClientType } from '../property/SelectClientType';
import { SelectService } from '../property/SelectService';

export const AgencyProfileFieldsOfExpertise = () => {
  const { loading } = useAgencyInfo();

  if (loading) return null;

  return (
    <div className="flex flex-col gap-6 p-8">
      <InfoCard
        title="Field of Expertise"
        description="Agency's field of expertise in terms of property types, services, and client types"
      >
        <InfoCard.Content>
          <AgencyFieldsOfExpertiseInfo />
        </InfoCard.Content>
      </InfoCard>
    </div>
  );
};

export const AgencyFieldsOfExpertiseInfo = () => {
  const { agencyInfo } = useAgencyInfo();
  const form = useForm<AgencyFieldsOfExpertiseValues>({
    mode: 'onBlur',
    resolver: zodResolver(agencyFieldsOfExpertiseSchema),
    defaultValues: {
      fieldsOfExpertise: agencyInfo?.fieldsOfExpertise || {},
    },
  });
  const { updateAgency } = useUpdateAgency();
  const fieldsOfExpertise = form.watch('fieldsOfExpertise');

  const handleSave = (patch: Partial<AgencyFieldsOfExpertiseValues>) => {
    const values = { ...form.getValues(), ...patch };
    updateAgency({ variables: { input: values } });
  };

  return (
    <Form {...form}>
      <form className="space-y-3">
        <Form.Field<
          AgencyFieldsOfExpertiseValues,
          'fieldsOfExpertise.propertyTypes'
        >
          control={form.control}
          name="fieldsOfExpertise.propertyTypes"
          render={({ field }) => (
            <Form.Item>
              <Form.Label>Property Types</Form.Label>
              <Form.Control>
                <SelectPropertyType
                  value={
                    field.value as (
                      | 'RESIDENTIAL'
                      | 'HOUSE'
                      | 'LAND'
                      | 'COMMERCIAL'
                      | 'OFFICE'
                    )[]
                  }
                  onValueChange={(value) => {
                    field.onChange(value);
                    handleSave({
                      fieldsOfExpertise: {
                        ...fieldsOfExpertise,
                        propertyTypes: value,
                      },
                    });
                  }}
                />
              </Form.Control>
              <Form.Message />
            </Form.Item>
          )}
        />

        <Form.Field<AgencyFieldsOfExpertiseValues, 'fieldsOfExpertise.services'>
          control={form.control}
          name="fieldsOfExpertise.services"
          render={({ field }) => (
            <Form.Item>
              <Form.Label>Services</Form.Label>
              <Form.Control>
                <SelectService
                  value={
                    field.value as (
                      | 'SALES'
                      | 'RENTAL'
                      | 'BROKERAGE'
                      | 'VALUATION'
                      | 'INVESTMENT_ADVISORY'
                      | 'PROPERTY_MANAGEMENT'
                    )[]
                  }
                  onValueChange={(value) => {
                    field.onChange(value);
                    handleSave({
                      fieldsOfExpertise: {
                        ...fieldsOfExpertise,
                        services: value,
                      },
                    });
                  }}
                />
              </Form.Control>
              <Form.Message />
            </Form.Item>
          )}
        />

        <Form.Field<
          AgencyFieldsOfExpertiseValues,
          'fieldsOfExpertise.clientTypes'
        >
          control={form.control}
          name="fieldsOfExpertise.clientTypes"
          render={({ field }) => (
            <Form.Item>
              <Form.Label>Client Types</Form.Label>
              <Form.Control>
                <SelectClientType
                  value={
                    field.value as (
                      | 'INDIVIDUAL_BUYER'
                      | 'INVESTOR'
                      | 'CORPORATE_CLIENT'
                      | 'DEVELOPER'
                    )[]
                  }
                  onValueChange={(value) => {
                    field.onChange(value);
                    handleSave({
                      fieldsOfExpertise: {
                        ...fieldsOfExpertise,
                        clientTypes: value,
                      },
                    });
                  }}
                />
              </Form.Control>
              <Form.Message />
            </Form.Item>
          )}
        />
      </form>
    </Form>
  );
};
