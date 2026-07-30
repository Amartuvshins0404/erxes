import { Form, ScrollArea, Sidebar, Spinner, Tabs, useQueryState } from 'erxes-ui';
import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { AgencyProfileSchema, useAgencyForm } from '../hooks/useAgencyForm';
import { useAgencyDetail } from '../hooks/useAgencyDetail';
import {
  AgencyDocumentsForm,
  AgencyFieldsOfActivityForm,
  AgencyGeneralForm,
  AgencyIntegrationsForm,
  AgencyOperationAreaForm,
  AgencySocialLinksForm,
  ContactInfoSection,
} from './AgencyInfoForm';

function removeTypename<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map(removeTypename) as unknown as T;
  }
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => key !== '__typename')
        .map(([key, val]) => [key, removeTypename(val)]),
    ) as T;
  }
  return value;
}

const AGENCY_DETAIL_TABS = [
  { value: 'general', label: 'General' },
  { value: 'activity', label: 'Field of Activity' },
  { value: 'operation-area', label: 'Operation Area' },
  { value: 'contact', label: 'Contact' },
  { value: 'documents', label: 'Documents' },
  { value: 'social-links', label: 'Social Links' },
  { value: 'integrations', label: 'Integrations' },
] as const;

export const AgencyDetail = () => {
  const { id } = useParams();
  const { agency, loading } = useAgencyDetail({
    variables: { id: id },
  });

  const { form } = useAgencyForm();
  const [selectedTab, setSelectedTab] = useQueryState<string>('tab');

  useEffect(() => {
    if (!agency) return;
    const { _id, __typename, ...formDefaultValues } = agency;
    form.reset(removeTypename(formDefaultValues) as AgencyProfileSchema);
  }, [agency]);

  if (loading) {
    return <Spinner containerClassName="ba:py-32" />;
  }

  return (
    <Form {...form}>
      <form className="h-full">
        <Tabs
          value={selectedTab ?? 'general'}
          onValueChange={setSelectedTab}
          orientation="vertical"
          className="flex h-full"
        >
          <Tabs.List className="w-56 flex-none" asChild>
            <Sidebar collapsible="none" className="w-56 border-r justify-start">
              <Sidebar.Group>
                <Sidebar.GroupContent>
                  <Sidebar.Menu>
                    {AGENCY_DETAIL_TABS.map((tab) => (
                      <Sidebar.MenuItem key={tab.value}>
                        <Tabs.Trigger value={tab.value} asChild>
                          <Sidebar.MenuButton className="justify-start data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                            {tab.label}
                          </Sidebar.MenuButton>
                        </Tabs.Trigger>
                      </Sidebar.MenuItem>
                    ))}
                  </Sidebar.Menu>
                </Sidebar.GroupContent>
              </Sidebar.Group>
            </Sidebar>
          </Tabs.List>

          <Tabs.Content value="general" className="flex-auto min-w-0 h-full">
            <ScrollArea className="h-full">
              <div className="max-w-2xl mx-auto my-3 px-4 space-y-3">
                <AgencyGeneralForm form={form} />
              </div>
            </ScrollArea>
          </Tabs.Content>

          <Tabs.Content value="activity" className="flex-auto min-w-0 h-full">
            <ScrollArea className="h-full">
              <div className="max-w-2xl mx-auto my-3 px-4 space-y-3">
                <AgencyFieldsOfActivityForm form={form} />
              </div>
            </ScrollArea>
          </Tabs.Content>

          <Tabs.Content
            value="operation-area"
            className="flex-auto min-w-0 h-full"
          >
            <ScrollArea className="h-full">
              <div className="max-w-2xl mx-auto my-3 px-4 space-y-3">
                <AgencyOperationAreaForm form={form} />
              </div>
            </ScrollArea>
          </Tabs.Content>

          <Tabs.Content value="contact" className="flex-auto min-w-0 h-full">
            <ScrollArea className="h-full">
              <div className="max-w-2xl mx-auto my-3 px-4 space-y-3">
                <ContactInfoSection form={form} _id={id} />
              </div>
            </ScrollArea>
          </Tabs.Content>

          <Tabs.Content value="documents" className="flex-auto min-w-0 h-full">
            <ScrollArea className="h-full">
              <div className="max-w-2xl mx-auto my-3 px-4 space-y-3">
                <AgencyDocumentsForm form={form} />
              </div>
            </ScrollArea>
          </Tabs.Content>

          <Tabs.Content
            value="social-links"
            className="flex-auto min-w-0 h-full"
          >
            <ScrollArea className="h-full">
              <div className="max-w-2xl mx-auto my-3 px-4 space-y-3">
                <AgencySocialLinksForm form={form} />
              </div>
            </ScrollArea>
          </Tabs.Content>

          <Tabs.Content
            value="integrations"
            className="flex-auto min-w-0 h-full"
          >
            <ScrollArea className="h-full">
              <div className="max-w-2xl mx-auto my-3 px-4 space-y-3">
                <AgencyIntegrationsForm form={form} />
              </div>
            </ScrollArea>
          </Tabs.Content>
        </Tabs>
      </form>
    </Form>
  );
};
