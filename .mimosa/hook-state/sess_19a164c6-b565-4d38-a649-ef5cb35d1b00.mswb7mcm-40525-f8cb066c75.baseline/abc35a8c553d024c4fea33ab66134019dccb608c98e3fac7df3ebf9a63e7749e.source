import {
  Badge,
  BlockEditorReadOnly,
  Button,
  cn,
  formatPhoneNumber,
  InfoCard,
  ScrollArea,
  Sheet,
  Spinner,
  Table,
  useQueryState,
} from 'erxes-ui';
import { useClientDetail } from '../hooks/useClients';
import {
  CLIENT_BUSINESS_MAIN_TYPE_OPTIONS,
  CLIENT_LEAD_SOURCE_OPTIONS,
  CLIENT_TYPE_OPTIONS,
} from '../constants/clientTypes';
import { MembersInline } from 'ui-modules';
import { ClientEditSheet } from './ClientEdit';
import { ClientStatus } from './ClientStatus';
import { format } from 'date-fns';
import { ClientDelete } from './ClientDelete';

export const ClientDetailSheet = () => {
  const [activeClientId, setActiveClientId] =
    useQueryState<string>('activeClientId');
  return (
    <Sheet open={!!activeClientId} onOpenChange={() => setActiveClientId(null)}>
      <Sheet.View className="sm:max-w-5xl">
        <Sheet.Header>
          <Sheet.Title>Client Detail</Sheet.Title>
          <Sheet.Close />
        </Sheet.Header>
        <Sheet.Content className="flex-auto overflow-hidden">
          <ClientDetail />
        </Sheet.Content>
        <Sheet.Footer className="flex-none">
          <Sheet.Close asChild>
            <Button variant="secondary" className="bg-border">
              Close
            </Button>
          </Sheet.Close>
          <ClientDelete
            clientId={activeClientId || ''}
            onClose={() => setActiveClientId(null)}
          />
          <ClientEditSheet />
        </Sheet.Footer>
      </Sheet.View>
    </Sheet>
  );
};

export const ClientDetail = () => {
  const [activeClientId] = useQueryState<string | null>('activeClientId');
  const { clientDetail, loading } = useClientDetail({
    id: activeClientId || '',
  });

  if (loading) return <Spinner />;

  if (!clientDetail) return <div>Client not found</div>;

  return (
    <ScrollArea className="h-full">
      <div className="p-4 flex flex-col gap-4">
        <InfoCard title="Client General Information">
          <InfoCard.Content className="p-0 overflow-hidden shadow-none">
            <Table>
              <Table.Body className="bt:[&_tr:first-child_td]:border-t bt:[&_td]:h-10 bt:[&_td]:px-2">
                <Table.Row>
                  <Table.Cell className="bg-sidebar bt:rounded-tl-lg">
                    Name
                  </Table.Cell>
                  <Table.Cell className="bt:rounded-tr-lg">
                    {clientDetail.name}
                  </Table.Cell>
                </Table.Row>
                <Table.Row>
                  <Table.Cell className="bg-sidebar">Client Type</Table.Cell>
                  <Table.Cell>
                    {
                      CLIENT_TYPE_OPTIONS.find(
                        (type) => type.value === clientDetail.client_type,
                      )?.label
                    }
                  </Table.Cell>
                </Table.Row>
                <Table.Row>
                  <Table.Cell className="bg-sidebar">Business Type</Table.Cell>
                  <Table.Cell>
                    {
                      CLIENT_BUSINESS_MAIN_TYPE_OPTIONS.find(
                        (type) => type.value === clientDetail.business_type,
                      )?.label
                    }
                  </Table.Cell>
                </Table.Row>
                <Table.Row>
                  <Table.Cell className="bg-sidebar">
                    Business Category
                  </Table.Cell>
                  <Table.Cell>{clientDetail.business_category}</Table.Cell>
                </Table.Row>
                <Table.Row>
                  <Table.Cell className="bg-sidebar">Lead Source</Table.Cell>
                  <Table.Cell>
                    {
                      CLIENT_LEAD_SOURCE_OPTIONS.find(
                        (source) => source.value === clientDetail.lead_source,
                      )?.label
                    }
                  </Table.Cell>
                </Table.Row>
                <Table.Row>
                  <Table.Cell className="bg-sidebar">Status</Table.Cell>
                  <Table.Cell className="py-0">
                    <ClientStatus status={clientDetail.status} />
                  </Table.Cell>
                </Table.Row>
                <Table.Row>
                  <Table.Cell className="bg-sidebar">Is Active</Table.Cell>
                  <Table.Cell className="py-0">
                    {clientDetail.isActive ? 'Yes' : 'No'}
                  </Table.Cell>
                </Table.Row>
                <Table.Row>
                  <Table.Cell className="bg-sidebar">CVH Broker</Table.Cell>
                  <Table.Cell className="flex items-center gap-2">
                    <MembersInline
                      memberIds={[clientDetail.cvh_broker || '']}
                    />
                  </Table.Cell>
                </Table.Row>
                <Table.Row>
                  <Table.Cell className="bg-sidebar">
                    Insurance Types
                  </Table.Cell>
                  <Table.Cell className="flex items-center gap-2">
                    {clientDetail.insurance_types.map((type) => (
                      <Badge key={type} variant="secondary">
                        {type}
                      </Badge>
                    ))}
                  </Table.Cell>
                </Table.Row>
                <Table.Row>
                  <Table.Cell className="bg-sidebar">
                    Operational Address
                  </Table.Cell>
                  <Table.Cell>
                    {clientDetail.operational_address || ''}
                  </Table.Cell>
                </Table.Row>
                <Table.Row>
                  <Table.Cell className="bg-sidebar">
                    Registration Number
                  </Table.Cell>
                  <Table.Cell>
                    {clientDetail.registration_number || ''}
                  </Table.Cell>
                </Table.Row>
                <Table.Row>
                  <Table.Cell className="bg-sidebar">
                    Registered Date
                  </Table.Cell>
                  <Table.Cell>
                    {clientDetail.registered_date
                      ? format(
                          new Date(clientDetail.registered_date),
                          'dd.MM.yyyy',
                        )
                      : ''}
                  </Table.Cell>
                </Table.Row>

                <Table.Row>
                  <Table.Cell className="bg-sidebar">Created At</Table.Cell>
                  <Table.Cell>
                    {format(
                      new Date(clientDetail.createdAt || ''),
                      'dd.MM.yyyy',
                    )}
                  </Table.Cell>
                </Table.Row>
                <Table.Row>
                  <Table.Cell className="bg-sidebar bt:rounded-bl-lg  ">
                    Updated At
                  </Table.Cell>
                  <Table.Cell className="bt:rounded-br-lg">
                    {format(
                      new Date(clientDetail.updatedAt || ''),
                      'dd.MM.yyyy',
                    )}
                  </Table.Cell>
                </Table.Row>
              </Table.Body>
            </Table>
          </InfoCard.Content>
        </InfoCard>

        <div className="p-1 pt-0 bg-sidebar rounded-lg overflow-hidden">
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.Head>Name</Table.Head>
                <Table.Head>Position</Table.Head>
                <Table.Head>Phone Number</Table.Head>
                <Table.Head>Email</Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body className="bt:[&_tr:first-child_td]:border-t bt:[&_td]:h-10 bt:[&_td]:px-2">
              {clientDetail.contacts.map((contact, index) => (
                <Table.Row
                  key={contact.name}
                  className={cn(
                    index === 0 &&
                      'bt:[&_td:first-child]:rounded-tl-lg bt:[&_td:last-child]:rounded-tr-lg',
                    index === clientDetail.contacts.length - 1 &&
                      'bt:[&_td:first-child]:rounded-bl-lg bt:[&_td:last-child]:rounded-br-lg',
                  )}
                >
                  <Table.Cell>{contact.name}</Table.Cell>
                  <Table.Cell>{contact.position}</Table.Cell>
                  <Table.Cell>
                    {formatPhoneNumber({
                      value: contact.phone_number || '',
                      defaultCountry: 'MN',
                    })}
                  </Table.Cell>
                  <Table.Cell>{contact.email}</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </div>

        <InfoCard title="Description">
          <InfoCard.Content>
            <BlockEditorReadOnly content={clientDetail.description || ''} />
          </InfoCard.Content>
        </InfoCard>
        <InfoCard title="Existing Insurance Policies">
          <InfoCard.Content>
            <BlockEditorReadOnly
              content={clientDetail.existing_insurance_policies || ''}
            />
          </InfoCard.Content>
        </InfoCard>
        <InfoCard title="Client Files">
          <InfoCard.Content>
            <div className="flex items-center gap-2 min-h-10">
              {!!clientDetail.claim_history_file ||
              !!clientDetail.bor_file ||
              !!clientDetail.service_agreement_file ? (
                <>
                  {!!clientDetail.claim_history_file && (
                    <Button variant="secondary" asChild>
                      <a
                        href={clientDetail.claim_history_file}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Download Claim History
                      </a>
                    </Button>
                  )}
                  {!!clientDetail.bor_file && (
                    <Button variant="secondary" asChild>
                      <a
                        href={clientDetail.bor_file}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Download Bor
                      </a>
                    </Button>
                  )}
                  {!!clientDetail.service_agreement_file && (
                    <Button variant="secondary" asChild>
                      <a
                        href={clientDetail.service_agreement_file}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Download Service Agreement
                      </a>
                    </Button>
                  )}
                </>
              ) : (
                <div className="text-center text-muted-foreground flex-1">
                  No files found
                </div>
              )}
            </div>
          </InfoCard.Content>
        </InfoCard>
      </div>
    </ScrollArea>
  );
};
