import { Form, InfoCard, Input, Select } from 'erxes-ui';
import { useAgencyInfo } from '../hooks/useAgencyInfo';
import { useUpdateAgency } from '../hooks/useUpdateAgency';
import { AgencyGeneralInfoValues } from '../types/form';
import { useGeneralForm } from '../hooks/useGeneralForm';
import React from 'react';

export const AgencyProfileGeneral = () => {
  const { loading } = useAgencyInfo();

  if (loading) return null;

  return (
    <div className="flex flex-col gap-6 p-8">
      <InfoCard title="Agency Information" description="Agency information">
        <InfoCard.Content>
          <AgencyGeneralInfo />
        </InfoCard.Content>
      </InfoCard>
    </div>
  );
};

export const AgencyGeneralInfo = () => {
  const { agencyInfo } = useAgencyInfo();
  const { form } = useGeneralForm({
    defaultValues: {
      name: agencyInfo?.name || '',
      brandName: agencyInfo?.brandName || '',
      dateFounded: agencyInfo?.dateFounded || '',
      website: agencyInfo?.website || '',
    },
  });
  React.useEffect(() => {
    form.reset({
      name: agencyInfo?.name || '',
      brandName: agencyInfo?.brandName || '',
      dateFounded: agencyInfo?.dateFounded || '',
      website: agencyInfo?.website || '',
    });
  }, [agencyInfo]);
  const { updateAgency } = useUpdateAgency();

  const handleSave = (patch: Partial<AgencyGeneralInfoValues>) => {
    const values = { ...form.getValues(), ...patch };
    updateAgency({ variables: { input: values } });
  };

  return (
    <Form {...form}>
      <form className="grid grid-cols-2 gap-3">
        <Form.Field<AgencyGeneralInfoValues, 'name'>
          control={form.control}
          name="name"
          render={({ field }) => (
            <Form.Item>
              <Form.Label>Official Name</Form.Label>
              <Form.Control>
                <Input
                  value={field.value}
                  onChange={(event) => {
                    field.onChange(event.currentTarget.value);
                    handleSave({ name: event.currentTarget.value });
                  }}
                  placeholder="Official company name"
                />
              </Form.Control>
              <Form.Message />
            </Form.Item>
          )}
        />

        <Form.Field<AgencyGeneralInfoValues, 'brandName'>
          control={form.control}
          name="brandName"
          render={({ field }) => (
            <Form.Item>
              <Form.Label>Brand Name</Form.Label>
              <Form.Control>
                <Input
                  value={field.value}
                  onChange={(event) => {
                    field.onChange(event.currentTarget.value);
                    handleSave({ brandName: event.currentTarget.value });
                  }}
                  placeholder="Brand name"
                />
              </Form.Control>
              <Form.Message />
            </Form.Item>
          )}
        />

        <Form.Field<AgencyGeneralInfoValues, 'dateFounded'>
          control={form.control}
          name="dateFounded"
          render={({ field }) => (
            <Form.Item>
              <Form.Label>Established Year</Form.Label>
              <Form.Control>
                <Select
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value);
                    handleSave({ dateFounded: value });
                  }}
                >
                  <Select.Trigger>
                    <Select.Value placeholder="Select date" />
                  </Select.Trigger>
                  <Select.Content>
                    {Array.from({ length: 100 }).map((_, index) => (
                      <Select.Item
                        key={index}
                        value={`${new Date().getFullYear() - index}`}
                      >
                        {new Date().getFullYear() - index}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select>
              </Form.Control>
              <Form.Message />
            </Form.Item>
          )}
        />
        <Form.Field<AgencyGeneralInfoValues, 'website'>
          control={form.control}
          name="website"
          render={({ field }) => (
            <Form.Item>
              <Form.Label>Website</Form.Label>
              <Form.Control>
                <Input
                  placeholder="https://www.example.com"
                  value={field.value}
                  onChange={(event) => {
                    field.onChange(event.currentTarget.value);
                    handleSave({ website: event.currentTarget.value });
                  }}
                />
              </Form.Control>
            </Form.Item>
          )}
        />
      </form>
    </Form>
  );
};
