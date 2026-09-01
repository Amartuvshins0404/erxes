import { Form, InfoCard, Input, Select } from 'erxes-ui';
import { useEffect } from 'react';
import { useAgencyInfo } from '../hooks/useAgencyInfo';
import { useUpdateAgency } from '../hooks/useUpdateAgency';
import { AgencyGeneralInfoValues } from '../types/form';
import { useGeneralForm } from '../hooks/useGeneralForm';

type AgencyGeneralInfoField = keyof AgencyGeneralInfoValues;

type AgencyGeneralInfoSource = {
  [key in AgencyGeneralInfoField]?: string | null;
};

const toGeneralInfoValues = (
  agencyInfo?: AgencyGeneralInfoSource,
): AgencyGeneralInfoValues => ({
  name: agencyInfo?.name || '',
  brandName: agencyInfo?.brandName || '',
  dateFounded: agencyInfo?.dateFounded || '',
  website: agencyInfo?.website || '',
});

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
  const serverValues = toGeneralInfoValues(agencyInfo);
  const { form } = useGeneralForm({ defaultValues: serverValues });
  const { updateAgency } = useUpdateAgency();

  // The agency can change while this card is mounted (verification
  // subscription, another card saving). `keepDirtyValues` refreshes only the
  // fields the user has not edited, so a response that lands mid-typing can
  // never overwrite the value being typed.
  useEffect(() => {
    form.reset(toGeneralInfoValues(agencyInfo), { keepDirtyValues: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agencyInfo]);

  // Values are committed on blur, never per keystroke. One mutation per
  // keystroke races with its own responses: the last response to arrive is not
  // the last one sent, which drops and reorders characters.
  const saveField = async (name: AgencyGeneralInfoField) => {
    const value = form.getValues(name) || '';

    if (value === serverValues[name]) {
      return;
    }

    if (!(await form.trigger(name))) {
      return;
    }

    updateAgency({
      variables: { input: { [name]: value } },
      onCompleted: () => {
        // Only the saved field becomes pristine again, and only if it was not
        // edited again while the request was in flight.
        if (form.getValues(name) === value) {
          form.resetField(name, { defaultValue: value });
        }
      },
    });
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
                  name={field.name}
                  ref={field.ref}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={() => {
                    field.onBlur();
                    saveField('name');
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
                  name={field.name}
                  ref={field.ref}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={() => {
                    field.onBlur();
                    saveField('brandName');
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
                    saveField('dateFounded');
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
                  name={field.name}
                  ref={field.ref}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={() => {
                    field.onBlur();
                    saveField('website');
                  }}
                  placeholder="https://www.example.com"
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
