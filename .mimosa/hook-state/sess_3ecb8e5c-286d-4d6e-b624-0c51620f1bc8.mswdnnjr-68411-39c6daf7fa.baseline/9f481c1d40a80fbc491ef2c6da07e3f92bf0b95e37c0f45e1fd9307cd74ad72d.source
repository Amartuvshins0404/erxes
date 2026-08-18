import { useFieldArray, useForm, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { marketFormSchema } from '../constants/marketFormSchema';
import { z } from 'zod';
import {
  Button,
  DatePicker,
  Editor,
  Form,
  InfoCard,
  Input,
  ScrollArea,
  Select,
  Separator,
  Sheet,
  Spinner,
  Switch,
} from 'erxes-ui';
import {
  MARKET_TYPE_OPTIONS,
  MARKET_SPECIALIZATION_OPTIONS,
  MARKET_REGION_OPTIONS,
  MARKET_ONBOARDING_STATUS_OPTIONS,
} from '../constants/marketTypes';
import { IconPlus, IconTrash } from '@tabler/icons-react';

export const MarketForm = ({
  defaultValues,
  onSubmit,
  loading,
  isEdit = false,
}: {
  defaultValues: Partial<z.infer<typeof marketFormSchema>>;
  onSubmit: (data: z.infer<typeof marketFormSchema>) => void;
  loading?: boolean;
  isEdit?: boolean;
}) => {
  const form = useForm<z.infer<typeof marketFormSchema>>({
    resolver: zodResolver(marketFormSchema),
    defaultValues: {
      name: '',
      description: '',
      registration_number: '',
      operational_address: '',
      type: '',
      specialization: '',
      region: '',
      country: '',
      onboarded: false,
      onboarding_status: '',
      business_partner_questionnaire_sent: false,
      business_partner_questionnaire_received: false,
      certificate_of_incorporation_sent: false,
      certificate_of_incorporation_received: false,
      business_license_sent: false,
      business_license_received: false,
      audited_financial_reports_sent: false,
      audited_financial_reports_received: false,
      ownership_chart_sent: false,
      ownership_chart_received: false,
      compliance_policies_sent: false,
      compliance_policies_received: false,
      tob_sent: false,
      tob_received: false,
      contacts: [
        {
          name: '',
          email: '',
          phone_number: '',
          position: '',
        },
      ],
      claim_handling_contact: {
        name: '',
        email: '',
        phone_number: '',
        position: '',
      },
      ...defaultValues,
    },
  });
  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col flex-auto overflow-hidden"
      >
        <Sheet.Content className="flex-auto overflow-hidden">
          <ScrollArea className="h-full">
            <div className="grid grid-cols-2 gap-6 p-6">
              <Form.Field
                control={form.control}
                name="name"
                render={({ field }) => (
                  <Form.Item>
                    <Form.Label>Name</Form.Label>
                    <Form.Control>
                      <Input {...field} />
                    </Form.Control>
                    <Form.Message />
                  </Form.Item>
                )}
              />
              <Form.Field
                control={form.control}
                name="type"
                render={({ field }) => (
                  <Form.Item>
                    <Form.Label>Type</Form.Label>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <Form.Control>
                        <Select.Trigger>
                          <Select.Value placeholder="Select Type" />
                        </Select.Trigger>
                      </Form.Control>
                      <Select.Content>
                        {MARKET_TYPE_OPTIONS.map((option) => (
                          <Select.Item key={option.value} value={option.value}>
                            {option.label}
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select>
                    <Form.Message />
                  </Form.Item>
                )}
              />
              <Form.Field
                control={form.control}
                name="specialization"
                render={({ field }) => (
                  <Form.Item>
                    <Form.Label>Specialization</Form.Label>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <Form.Control>
                        <Select.Trigger>
                          <Select.Value placeholder="Select Specialization" />
                        </Select.Trigger>
                      </Form.Control>
                      <Select.Content>
                        {MARKET_SPECIALIZATION_OPTIONS.map((option) => (
                          <Select.Item key={option.value} value={option.value}>
                            {option.label}
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select>
                    <Form.Message />
                  </Form.Item>
                )}
              />
              <Form.Field
                control={form.control}
                name="region"
                render={({ field }) => (
                  <Form.Item>
                    <Form.Label>Region</Form.Label>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <Form.Control>
                        <Select.Trigger>
                          <Select.Value placeholder="Select Region" />
                        </Select.Trigger>
                      </Form.Control>
                      <Select.Content>
                        {MARKET_REGION_OPTIONS.map((option) => (
                          <Select.Item key={option.value} value={option.value}>
                            {option.label}
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select>
                    <Form.Message />
                  </Form.Item>
                )}
              />
              <Form.Field
                control={form.control}
                name="country"
                render={({ field }) => (
                  <Form.Item>
                    <Form.Label>Country</Form.Label>
                    <Form.Control>
                      <Input {...field} />
                    </Form.Control>
                    <Form.Message />
                  </Form.Item>
                )}
              />
              <Form.Field
                control={form.control}
                name="registration_number"
                render={({ field }) => (
                  <Form.Item>
                    <Form.Label>Registration Number</Form.Label>
                    <Form.Control>
                      <Input {...field} />
                    </Form.Control>
                    <Form.Message />
                  </Form.Item>
                )}
              />
              <Form.Field
                control={form.control}
                name="operational_address"
                render={({ field }) => (
                  <Form.Item className="col-span-2">
                    <Form.Label>Operational Address</Form.Label>
                    <Form.Control>
                      <Input {...field} />
                    </Form.Control>
                    <Form.Message />
                  </Form.Item>
                )}
              />
              <Form.Field
                control={form.control}
                name="onboarded_date"
                render={({ field }) => (
                  <Form.Item>
                    <Form.Label>Onboarded Date</Form.Label>
                    <DatePicker
                      placeholder="Select date"
                      value={field.value ? new Date(field.value) : undefined}
                      onChange={(date) => {
                        const dateValue = Array.isArray(date) ? date[0] : date;
                        field.onChange(
                          dateValue ? dateValue.toISOString() : undefined,
                        );
                      }}
                    />
                    <Form.Message />
                  </Form.Item>
                )}
              />
              <Form.Field
                control={form.control}
                name="onboarding_status"
                render={({ field }) => (
                  <Form.Item>
                    <Form.Label>Onboarding Status</Form.Label>
                    <Select
                      value={field.value || ''}
                      onValueChange={field.onChange}
                    >
                      <Form.Control>
                        <Select.Trigger>
                          <Select.Value placeholder="Select Status" />
                        </Select.Trigger>
                      </Form.Control>
                      <Select.Content>
                        {MARKET_ONBOARDING_STATUS_OPTIONS.map((option) => (
                          <Select.Item key={option.value} value={option.value}>
                            {option.label}
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select>
                    <Form.Message />
                  </Form.Item>
                )}
              />
              <Form.Field
                control={form.control}
                name="onboarded"
                render={({ field }) => (
                  <Form.Item className="flex items-end">
                    <div className="flex items-center gap-2 pb-3">
                      <Form.Control>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </Form.Control>
                      <Form.Label variant="peer">Onboarded</Form.Label>
                    </div>
                    <Form.Message />
                  </Form.Item>
                )}
              />
              <Separator className="col-span-2" />
              <InfoCard title="Contacts" className="col-span-2">
                <InfoCard.Content>
                  <MarketContacts form={form} />
                </InfoCard.Content>
              </InfoCard>
              <Separator className="col-span-2" />
              <InfoCard title="Claim Handling Contact" className="col-span-2">
                <InfoCard.Content>
                  <MarketClaimHandlingContact form={form} />
                </InfoCard.Content>
              </InfoCard>
              <Separator className="col-span-2" />
              <Form.Field
                control={form.control}
                name="description"
                render={({ field }) => (
                  <Form.Item className="col-span-2">
                    <Form.Label>Description</Form.Label>
                    <Editor
                      initialContent={field.value}
                      onChange={field.onChange}
                    />
                    <Form.Message />
                  </Form.Item>
                )}
              />
              <Separator className="col-span-2" />
              <div className="col-span-2 grid grid-cols-2 gap-4">
                <Form.Field
                  control={form.control}
                  name="business_partner_questionnaire_sent"
                  render={({ field }) => (
                    <Form.Item className="flex items-end">
                      <div className="flex items-center gap-2 pb-3">
                        <Form.Control>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </Form.Control>
                        <Form.Label variant="peer">
                          Business Partner Questionnaire Sent
                        </Form.Label>
                      </div>
                      <Form.Message />
                    </Form.Item>
                  )}
                />
                <Form.Field
                  control={form.control}
                  name="business_partner_questionnaire_received"
                  render={({ field }) => (
                    <Form.Item className="flex items-end">
                      <div className="flex items-center gap-2 pb-3">
                        <Form.Control>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </Form.Control>
                        <Form.Label variant="peer">
                          Business Partner Questionnaire Received
                        </Form.Label>
                      </div>
                      <Form.Message />
                    </Form.Item>
                  )}
                />
                <Form.Field
                  control={form.control}
                  name="certificate_of_incorporation_sent"
                  render={({ field }) => (
                    <Form.Item className="flex items-end">
                      <div className="flex items-center gap-2 pb-3">
                        <Form.Control>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </Form.Control>
                        <Form.Label variant="peer">
                          Certificate of Incorporation Sent
                        </Form.Label>
                      </div>
                      <Form.Message />
                    </Form.Item>
                  )}
                />
                <Form.Field
                  control={form.control}
                  name="certificate_of_incorporation_received"
                  render={({ field }) => (
                    <Form.Item className="flex items-end">
                      <div className="flex items-center gap-2 pb-3">
                        <Form.Control>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </Form.Control>
                        <Form.Label variant="peer">
                          Certificate of Incorporation Received
                        </Form.Label>
                      </div>
                      <Form.Message />
                    </Form.Item>
                  )}
                />
                <Form.Field
                  control={form.control}
                  name="business_license_sent"
                  render={({ field }) => (
                    <Form.Item className="flex items-end">
                      <div className="flex items-center gap-2 pb-3">
                        <Form.Control>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </Form.Control>
                        <Form.Label variant="peer">
                          Business License Sent
                        </Form.Label>
                      </div>
                      <Form.Message />
                    </Form.Item>
                  )}
                />
                <Form.Field
                  control={form.control}
                  name="business_license_received"
                  render={({ field }) => (
                    <Form.Item className="flex items-end">
                      <div className="flex items-center gap-2 pb-3">
                        <Form.Control>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </Form.Control>
                        <Form.Label variant="peer">
                          Business License Received
                        </Form.Label>
                      </div>
                      <Form.Message />
                    </Form.Item>
                  )}
                />
                <Form.Field
                  control={form.control}
                  name="audited_financial_reports_sent"
                  render={({ field }) => (
                    <Form.Item className="flex items-end">
                      <div className="flex items-center gap-2 pb-3">
                        <Form.Control>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </Form.Control>
                        <Form.Label variant="peer">
                          Audited Financial Reports Sent
                        </Form.Label>
                      </div>
                      <Form.Message />
                    </Form.Item>
                  )}
                />
                <Form.Field
                  control={form.control}
                  name="audited_financial_reports_received"
                  render={({ field }) => (
                    <Form.Item className="flex items-end">
                      <div className="flex items-center gap-2 pb-3">
                        <Form.Control>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </Form.Control>
                        <Form.Label variant="peer">
                          Audited Financial Reports Received
                        </Form.Label>
                      </div>
                      <Form.Message />
                    </Form.Item>
                  )}
                />
                <Form.Field
                  control={form.control}
                  name="ownership_chart_sent"
                  render={({ field }) => (
                    <Form.Item className="flex items-end">
                      <div className="flex items-center gap-2 pb-3">
                        <Form.Control>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </Form.Control>
                        <Form.Label variant="peer">
                          Ownership Chart Sent
                        </Form.Label>
                      </div>
                      <Form.Message />
                    </Form.Item>
                  )}
                />
                <Form.Field
                  control={form.control}
                  name="ownership_chart_received"
                  render={({ field }) => (
                    <Form.Item className="flex items-end">
                      <div className="flex items-center gap-2 pb-3">
                        <Form.Control>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </Form.Control>
                        <Form.Label variant="peer">
                          Ownership Chart Received
                        </Form.Label>
                      </div>
                      <Form.Message />
                    </Form.Item>
                  )}
                />
                <Form.Field
                  control={form.control}
                  name="compliance_policies_sent"
                  render={({ field }) => (
                    <Form.Item className="flex items-end">
                      <div className="flex items-center gap-2 pb-3">
                        <Form.Control>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </Form.Control>
                        <Form.Label variant="peer">
                          Compliance Policies Sent
                        </Form.Label>
                      </div>
                      <Form.Message />
                    </Form.Item>
                  )}
                />
                <Form.Field
                  control={form.control}
                  name="compliance_policies_received"
                  render={({ field }) => (
                    <Form.Item className="flex items-end">
                      <div className="flex items-center gap-2 pb-3">
                        <Form.Control>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </Form.Control>
                        <Form.Label variant="peer">
                          Compliance Policies Received
                        </Form.Label>
                      </div>
                      <Form.Message />
                    </Form.Item>
                  )}
                />
                <Form.Field
                  control={form.control}
                  name="tob_sent"
                  render={({ field }) => (
                    <Form.Item className="flex items-end">
                      <div className="flex items-center gap-2 pb-3">
                        <Form.Control>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </Form.Control>
                        <Form.Label variant="peer">TOB Sent</Form.Label>
                      </div>
                      <Form.Message />
                    </Form.Item>
                  )}
                />
                <Form.Field
                  control={form.control}
                  name="tob_received"
                  render={({ field }) => (
                    <Form.Item className="flex items-end">
                      <div className="flex items-center gap-2 pb-3">
                        <Form.Control>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </Form.Control>
                        <Form.Label variant="peer">TOB Received</Form.Label>
                      </div>
                      <Form.Message />
                    </Form.Item>
                  )}
                />
              </div>
            </div>
          </ScrollArea>
        </Sheet.Content>
        <Sheet.Footer className="flex-none">
          <Button type="submit" disabled={loading}>
            {loading && <Spinner containerClassName="flex-none" />}
            {isEdit ? 'Update' : 'Create'}
          </Button>
        </Sheet.Footer>
      </form>
    </Form>
  );
};

const MarketContacts = ({
  form,
}: {
  form: UseFormReturn<z.infer<typeof marketFormSchema>>;
}) => {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'contacts',
  });
  return (
    <div className="flex flex-col gap-4">
      {fields.map((field, index) => (
        <div key={field.id} className="flex gap-2 items-end">
          <div className="grid grid-cols-4 gap-4 flex-1">
            <Form.Field
              control={form.control}
              name={`contacts.${index}.name`}
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>Name</Form.Label>
                  <Form.Control>
                    <Input {...field} />
                  </Form.Control>
                  <Form.Message />
                </Form.Item>
              )}
            />
            <Form.Field
              control={form.control}
              name={`contacts.${index}.email`}
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>Email</Form.Label>
                  <Form.Control>
                    <Input {...field} />
                  </Form.Control>
                  <Form.Message />
                </Form.Item>
              )}
            />
            <Form.Field
              control={form.control}
              name={`contacts.${index}.phone_number`}
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>Phone</Form.Label>
                  <Form.Control>
                    <Input {...field} />
                  </Form.Control>
                  <Form.Message />
                </Form.Item>
              )}
            />
            <Form.Field
              control={form.control}
              name={`contacts.${index}.position`}
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>Position</Form.Label>
                  <Form.Control>
                    <Input {...field} />
                  </Form.Control>
                  <Form.Message />
                </Form.Item>
              )}
            />
          </div>
          <div className="flex-none bt:min-w-8">
            {fields.length > 1 && (
              <Button
                type="button"
                variant="secondary"
                className="text-destructive bg-destructive/10 hover:bg-destructive/20 size-8"
                size="icon"
                onClick={() => {
                  if (fields.length === 1) {
                    return;
                  }
                  remove(index);
                }}
              >
                <IconTrash />
              </Button>
            )}
          </div>
        </div>
      ))}
      <div className="grid grid-cols-2 gap-2 mt-4">
        <Button
          type="button"
          variant="secondary"
          onClick={() =>
            append({ name: '', email: '', phone_number: '', position: '' })
          }
        >
          <IconPlus />
          Add Contact
        </Button>
      </div>
    </div>
  );
};

const MarketClaimHandlingContact = ({
  form,
}: {
  form: UseFormReturn<z.infer<typeof marketFormSchema>>;
}) => {
  return (
    <div className="grid grid-cols-4 gap-4">
      <Form.Field
        control={form.control}
        name="claim_handling_contact.name"
        render={({ field }) => (
          <Form.Item>
            <Form.Label>Name</Form.Label>
            <Form.Control>
              <Input {...field} />
            </Form.Control>
            <Form.Message />
          </Form.Item>
        )}
      />
      <Form.Field
        control={form.control}
        name="claim_handling_contact.email"
        render={({ field }) => (
          <Form.Item>
            <Form.Label>Email</Form.Label>
            <Form.Control>
              <Input {...field} />
            </Form.Control>
            <Form.Message />
          </Form.Item>
        )}
      />
      <Form.Field
        control={form.control}
        name="claim_handling_contact.phone_number"
        render={({ field }) => (
          <Form.Item>
            <Form.Label>Phone</Form.Label>
            <Form.Control>
              <Input {...field} />
            </Form.Control>
            <Form.Message />
          </Form.Item>
        )}
      />
      <Form.Field
        control={form.control}
        name="claim_handling_contact.position"
        render={({ field }) => (
          <Form.Item>
            <Form.Label>Position</Form.Label>
            <Form.Control>
              <Input {...field} />
            </Form.Control>
            <Form.Message />
          </Form.Item>
        )}
      />
    </div>
  );
};
