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
import { useMarketDetail } from '../hooks/useMarkets';
import {
  MARKET_TYPE_OPTIONS,
  MARKET_SPECIALIZATION_OPTIONS,
  MARKET_REGION_OPTIONS,
} from '../constants/marketTypes';
import { MarketEditSheet } from './MarketEdit';
import { MarketStatus } from './MarketStatus';
import { format } from 'date-fns';
import { MarketDelete } from './MarketDelete';

export const MarketDetailSheet = () => {
  const [activeMarketId, setActiveMarketId] =
    useQueryState<string>('activeMarketId');
  return (
    <Sheet open={!!activeMarketId} onOpenChange={() => setActiveMarketId(null)}>
      <Sheet.View className="sm:max-w-5xl">
        <Sheet.Header>
          <Sheet.Title>Market Detail</Sheet.Title>
          <Sheet.Close />
        </Sheet.Header>
        <Sheet.Content className="flex-auto overflow-hidden">
          <MarketDetail />
        </Sheet.Content>
        <Sheet.Footer className="flex-none">
          <Sheet.Close asChild>
            <Button variant="secondary" className="bg-border">
              Close
            </Button>
          </Sheet.Close>
          <MarketDelete
            marketId={activeMarketId || ''}
            onClose={() => setActiveMarketId(null)}
          />
          <MarketEditSheet />
        </Sheet.Footer>
      </Sheet.View>
    </Sheet>
  );
};

export const MarketDetail = () => {
  const [activeMarketId] = useQueryState<string | null>('activeMarketId');
  const { marketDetail, loading } = useMarketDetail({
    id: activeMarketId || '',
  });

  if (loading) return <Spinner />;

  if (!marketDetail) return <div>Market not found</div>;

  return (
    <ScrollArea className="h-full">
      <div className="p-4 flex flex-col gap-4">
        <InfoCard title="Market General Information">
          <InfoCard.Content className="p-0 overflow-hidden shadow-none">
            <Table>
              <Table.Body className="bt:[&_tr:first-child_td]:border-t bt:[&_td]:h-10 bt:[&_td]:px-2">
                <Table.Row>
                  <Table.Cell className="bg-sidebar bt:rounded-tl-lg">
                    Name
                  </Table.Cell>
                  <Table.Cell className="bt:rounded-tr-lg">
                    {marketDetail.name}
                  </Table.Cell>
                </Table.Row>
                <Table.Row>
                  <Table.Cell className="bg-sidebar">Type</Table.Cell>
                  <Table.Cell>
                    {
                      MARKET_TYPE_OPTIONS.find(
                        (type) => type.value === marketDetail.type,
                      )?.label
                    }
                  </Table.Cell>
                </Table.Row>
                <Table.Row>
                  <Table.Cell className="bg-sidebar">Specialization</Table.Cell>
                  <Table.Cell>
                    {
                      MARKET_SPECIALIZATION_OPTIONS.find(
                        (spec) => spec.value === marketDetail.specialization,
                      )?.label
                    }
                  </Table.Cell>
                </Table.Row>
                <Table.Row>
                  <Table.Cell className="bg-sidebar">Region</Table.Cell>
                  <Table.Cell>
                    {
                      MARKET_REGION_OPTIONS.find(
                        (region) => region.value === marketDetail.region,
                      )?.label
                    }
                  </Table.Cell>
                </Table.Row>
                <Table.Row>
                  <Table.Cell className="bg-sidebar">Country</Table.Cell>
                  <Table.Cell>{marketDetail.country}</Table.Cell>
                </Table.Row>
                <Table.Row>
                  <Table.Cell className="bg-sidebar">
                    Registration Number
                  </Table.Cell>
                  <Table.Cell>
                    {marketDetail.registration_number || ''}
                  </Table.Cell>
                </Table.Row>
                <Table.Row>
                  <Table.Cell className="bg-sidebar">
                    Operational Address
                  </Table.Cell>
                  <Table.Cell>
                    {marketDetail.operational_address || ''}
                  </Table.Cell>
                </Table.Row>
                <Table.Row>
                  <Table.Cell className="bg-sidebar">Onboarded</Table.Cell>
                  <Table.Cell className="py-0">
                    {marketDetail.onboarded ? 'Yes' : 'No'}
                  </Table.Cell>
                </Table.Row>
                <Table.Row>
                  <Table.Cell className="bg-sidebar">Onboarding Status</Table.Cell>
                  <Table.Cell className="py-0">
                    <MarketStatus status={marketDetail.onboarding_status} />
                  </Table.Cell>
                </Table.Row>
                <Table.Row>
                  <Table.Cell className="bg-sidebar">Onboarded Date</Table.Cell>
                  <Table.Cell>
                    {marketDetail.onboarded_date
                      ? format(
                          new Date(marketDetail.onboarded_date),
                          'dd.MM.yyyy',
                        )
                      : ''}
                  </Table.Cell>
                </Table.Row>
                <Table.Row>
                  <Table.Cell className="bg-sidebar">Created At</Table.Cell>
                  <Table.Cell>
                    {format(
                      new Date(marketDetail.createdAt || ''),
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
                      new Date(marketDetail.updatedAt || ''),
                      'dd.MM.yyyy',
                    )}
                  </Table.Cell>
                </Table.Row>
              </Table.Body>
            </Table>
          </InfoCard.Content>
        </InfoCard>

        <InfoCard title="Document Status">
          <InfoCard.Content className="p-0 overflow-hidden shadow-none">
            <Table>
              <Table.Body className="bt:[&_tr:first-child_td]:border-t bt:[&_td]:h-10 bt:[&_td]:px-2">
                <Table.Row>
                  <Table.Cell className="bg-sidebar bt:rounded-tl-lg">
                    Business Partner Questionnaire
                  </Table.Cell>
                  <Table.Cell className="bt:rounded-tr-lg">
                    {marketDetail.business_partner_questionnaire_sent
                      ? 'Sent'
                      : 'Not Sent'}{' '}
                    /{' '}
                    {marketDetail.business_partner_questionnaire_received
                      ? 'Received'
                      : 'Not Received'}
                  </Table.Cell>
                </Table.Row>
                <Table.Row>
                  <Table.Cell className="bg-sidebar">
                    Certificate of Incorporation
                  </Table.Cell>
                  <Table.Cell>
                    {marketDetail.certificate_of_incorporation_sent
                      ? 'Sent'
                      : 'Not Sent'}{' '}
                    /{' '}
                    {marketDetail.certificate_of_incorporation_received
                      ? 'Received'
                      : 'Not Received'}
                  </Table.Cell>
                </Table.Row>
                <Table.Row>
                  <Table.Cell className="bg-sidebar">Business License</Table.Cell>
                  <Table.Cell>
                    {marketDetail.business_license_sent ? 'Sent' : 'Not Sent'} /{' '}
                    {marketDetail.business_license_received
                      ? 'Received'
                      : 'Not Received'}
                  </Table.Cell>
                </Table.Row>
                <Table.Row>
                  <Table.Cell className="bg-sidebar">
                    Audited Financial Reports
                  </Table.Cell>
                  <Table.Cell>
                    {marketDetail.audited_financial_reports_sent
                      ? 'Sent'
                      : 'Not Sent'}{' '}
                    /{' '}
                    {marketDetail.audited_financial_reports_received
                      ? 'Received'
                      : 'Not Received'}
                  </Table.Cell>
                </Table.Row>
                <Table.Row>
                  <Table.Cell className="bg-sidebar">Ownership Chart</Table.Cell>
                  <Table.Cell>
                    {marketDetail.ownership_chart_sent ? 'Sent' : 'Not Sent'} /{' '}
                    {marketDetail.ownership_chart_received
                      ? 'Received'
                      : 'Not Received'}
                  </Table.Cell>
                </Table.Row>
                <Table.Row>
                  <Table.Cell className="bg-sidebar">
                    Compliance Policies
                  </Table.Cell>
                  <Table.Cell>
                    {marketDetail.compliance_policies_sent
                      ? 'Sent'
                      : 'Not Sent'}{' '}
                    /{' '}
                    {marketDetail.compliance_policies_received
                      ? 'Received'
                      : 'Not Received'}
                  </Table.Cell>
                </Table.Row>
                <Table.Row>
                  <Table.Cell className="bg-sidebar bt:rounded-bl-lg">
                    TOB
                  </Table.Cell>
                  <Table.Cell className="bt:rounded-br-lg">
                    {marketDetail.tob_sent ? 'Sent' : 'Not Sent'} /{' '}
                    {marketDetail.tob_received ? 'Received' : 'Not Received'}
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
              {marketDetail.contacts?.map((contact, index) => (
                <Table.Row
                  key={contact.name}
                  className={cn(
                    index === 0 &&
                      'bt:[&_td:first-child]:rounded-tl-lg bt:[&_td:last-child]:rounded-tr-lg',
                    index === (marketDetail.contacts?.length || 0) - 1 &&
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

        {marketDetail.claim_handling_contact && (
          <InfoCard title="Claim Handling Contact">
            <InfoCard.Content className="p-0 overflow-hidden shadow-none">
              <Table>
                <Table.Body className="bt:[&_tr:first-child_td]:border-t bt:[&_td]:h-10 bt:[&_td]:px-2">
                  <Table.Row>
                    <Table.Cell className="bg-sidebar bt:rounded-tl-lg">
                      Name
                    </Table.Cell>
                    <Table.Cell className="bt:rounded-tr-lg">
                      {marketDetail.claim_handling_contact.name}
                    </Table.Cell>
                  </Table.Row>
                  <Table.Row>
                    <Table.Cell className="bg-sidebar">Position</Table.Cell>
                    <Table.Cell>
                      {marketDetail.claim_handling_contact.position}
                    </Table.Cell>
                  </Table.Row>
                  <Table.Row>
                    <Table.Cell className="bg-sidebar">Phone Number</Table.Cell>
                    <Table.Cell>
                      {formatPhoneNumber({
                        value:
                          marketDetail.claim_handling_contact.phone_number || '',
                        defaultCountry: 'MN',
                      })}
                    </Table.Cell>
                  </Table.Row>
                  <Table.Row>
                    <Table.Cell className="bg-sidebar bt:rounded-bl-lg">
                      Email
                    </Table.Cell>
                    <Table.Cell className="bt:rounded-br-lg">
                      {marketDetail.claim_handling_contact.email}
                    </Table.Cell>
                  </Table.Row>
                </Table.Body>
              </Table>
            </InfoCard.Content>
          </InfoCard>
        )}

        <InfoCard title="Description">
          <InfoCard.Content>
            <BlockEditorReadOnly content={marketDetail.description || ''} />
          </InfoCard.Content>
        </InfoCard>
      </div>
    </ScrollArea>
  );
};

