import { Form, InfoCard } from 'erxes-ui';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MultipleDocumentUpload } from '../form/MultipleDocumentUpload';
import { useAgencyInfo } from '../hooks/useAgencyInfo';
import { AgencyDocumentsValues } from '../types/form';
import { agencyDocuments } from '../schema/form';
import { useUpdateAgency } from '../hooks/useUpdateAgency';

export const AgencyProfileDocuments = () => {
  const { loading } = useAgencyInfo();

  if (loading) return null;

  return (
    <div className="p-8">
      <InfoCard title="Document">
        <InfoCard.Content className="space-y-3">
          <AgencyDocumentInfo />
        </InfoCard.Content>
      </InfoCard>
    </div>
  );
};

export const AgencyDocumentInfo = () => {
  const { agencyInfo } = useAgencyInfo();
  const form = useForm<AgencyDocumentsValues>({
    mode: 'onBlur',
    resolver: zodResolver(agencyDocuments),
    defaultValues: {
      documents: agencyInfo?.documents || [],
    },
  });
  const { updateAgency } = useUpdateAgency();
  const handleSave = (patch: Partial<AgencyDocumentsValues>) => {
    const values = { ...form.getValues(), ...patch };
    updateAgency({ variables: { input: values } });
  };
  return (
    <Form {...form}>
      <form className="flex flex-col flex-auto">
        <Form.Field<AgencyDocumentsValues, 'documents'>
          control={form.control}
          name="documents"
          render={({ field }) => (
            <Form.Item className="col-span-2">
              <Form.Label>Documents</Form.Label>
              <Form.Control>
                <MultipleDocumentUpload
                  value={field.value as string[]}
                  onChange={(values) => {
                    field.onChange(values);
                    handleSave({ documents: values });
                  }}
                />
              </Form.Control>
              <Form.Description>
                Байгууллагын холбогдох баримт бичигийг энэ хэсэгт оруулна.
              </Form.Description>
              <Form.Message />
            </Form.Item>
          )}
        />
      </form>
    </Form>
  );
};
