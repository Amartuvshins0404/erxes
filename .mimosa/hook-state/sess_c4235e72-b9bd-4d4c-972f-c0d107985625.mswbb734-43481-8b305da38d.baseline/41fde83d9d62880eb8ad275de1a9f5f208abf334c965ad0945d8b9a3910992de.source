import { InfoCard, Label } from 'erxes-ui';
import { useAgencyInfo } from '../hooks/useAgencyInfo';
import { useForm } from 'react-hook-form';
import { AgencyContactInfoValues } from '../types/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { agencyContactInfoSchema } from '../schema/form';
import { useUpdateAgency } from '../hooks/useUpdateAgency';
import { AgencyPhones } from '../form/AgencyPhones';
import { AgencyEmails } from '../form/AgencyEmails';

export const AgencyProfileContact = () => {
  const { loading } = useAgencyInfo();

  if (loading) return null;

  return (
    <div className="flex flex-col gap-6 p-8">
      <InfoCard
        title="Contact Information"
        description="Agency contact information"
      >
        <InfoCard.Content>
          <AgencyContactInfo />
        </InfoCard.Content>
      </InfoCard>
    </div>
  );
};

export const AgencyContactInfo = () => {
  const { agencyInfo } = useAgencyInfo();
  const _id = agencyInfo?._id;
  const form = useForm<AgencyContactInfoValues>({
    mode: 'onBlur',
    resolver: zodResolver(agencyContactInfoSchema),
    defaultValues: {
      primaryEmail: agencyInfo?.primaryEmail || '',
      emails: agencyInfo?.emails || [],
      phones: agencyInfo?.phones || [],
      primaryPhone: agencyInfo?.primaryPhone || '',
    },
  });
  const { updateAgency, loading: isPending } = useUpdateAgency();
  const handleSave = (patch: Partial<AgencyContactInfoValues>) => {
    const values = { ...form.getValues(), ...patch };
    updateAgency({ variables: { input: values } });
  };

  const [emails, phones, primaryEmail, primaryPhone] = form.watch([
    'emails',
    'phones',
    'primaryEmail',
    'primaryPhone',
  ]);

  return (
    <div className="flex flex-col gap-4">
      <div className="w-full">
        <Label className="mb-2">Phones</Label>
        <AgencyPhones
          _id={_id as string}
          phones={phones as string[]}
          primaryPhone={primaryPhone as string}
          onValueChange={({
            phones: updatedPhones,
            primaryPhone: updatedPrimaryPhone,
          }) => {
            form.setValue('phones', updatedPhones);
            form.setValue('primaryPhone', updatedPrimaryPhone);
            handleSave({
              phones: updatedPhones,
              primaryPhone: updatedPrimaryPhone,
            });
          }}
          disabled={isPending}
        />
      </div>

      <div className="w-full">
        <Label className="mb-2">Emails</Label>
        <AgencyEmails
          _id={_id as string}
          emails={emails as string[]}
          primaryEmail={primaryEmail as string}
          onValueChange={({
            emails: updatedEmails,
            primaryEmail: updatedPrimaryEmail,
          }) => {
            form.setValue('emails', updatedEmails);
            form.setValue('primaryEmail', updatedPrimaryEmail);
            handleSave({
              emails: updatedEmails,
              primaryEmail: updatedPrimaryEmail,
            });
          }}
          disabled={isPending}
        />
      </div>
    </div>
  );
};
