import {
  Button,
  cn,
  InfoCard,
  ScrollArea,
  Sheet,
  Spinner,
  Table,
  useQueryState,
} from 'erxes-ui';
import { useRiskGroupDetail } from '../hooks/useRiskGroups';
import { format } from 'date-fns';
import { RiskGroupEditSheet } from './RiskGroupEdit';
import { RiskGroupDelete } from './RiskGroupDelete';
import { useQuery } from '@apollo/client';
import { GET_CV_CLIENT_DETAIL } from '@/clients/graphql/cvClientsQueries';

export const RiskGroupDetailSheet = () => {
  const [activeRiskGroupId, setActiveRiskGroupId] =
    useQueryState<string>('activeRiskGroupId');
  return (
    <Sheet open={!!activeRiskGroupId} onOpenChange={() => setActiveRiskGroupId(null)}>
      <Sheet.View className="sm:max-w-5xl">
        <Sheet.Header>
          <Sheet.Title>Risk Group Detail</Sheet.Title>
          <Sheet.Close />
        </Sheet.Header>
        <Sheet.Content className="flex-auto overflow-hidden">
          <RiskGroupDetail />
        </Sheet.Content>
        <Sheet.Footer className="flex-none">
          <Sheet.Close asChild>
            <Button variant="secondary" className="bg-border">
              Close
            </Button>
          </Sheet.Close>
          <RiskGroupDelete
            riskGroupId={activeRiskGroupId || ''}
            onClose={() => setActiveRiskGroupId(null)}
          />
          <RiskGroupEditSheet />
        </Sheet.Footer>
      </Sheet.View>
    </Sheet>
  );
};

export const RiskGroupDetail = () => {
  const [activeRiskGroupId] = useQueryState<string | null>('activeRiskGroupId');
  const { riskGroupDetail, loading } = useRiskGroupDetail({
    id: activeRiskGroupId || '',
  });

  const { data: clientData } = useQuery(GET_CV_CLIENT_DETAIL, {
    variables: { id: riskGroupDetail?.client || '' },
    skip: !riskGroupDetail?.client,
  });

  if (loading) return <Spinner />;

  if (!riskGroupDetail) return <div>Risk group not found</div>;

  return (
    <ScrollArea className="h-full">
      <div className="p-4 flex flex-col gap-4">
        <InfoCard title="Risk Group Information">
          <InfoCard.Content className="p-0 overflow-hidden shadow-none">
            <Table>
              <Table.Body className="bt:[&_tr:first-child_td]:border-t bt:[&_td]:h-10 bt:[&_td]:px-2">
                <Table.Row>
                  <Table.Cell className="bg-sidebar bt:rounded-tl-lg">
                    Name
                  </Table.Cell>
                  <Table.Cell className="bt:rounded-tr-lg">
                    {riskGroupDetail.name}
                  </Table.Cell>
                </Table.Row>
                <Table.Row>
                  <Table.Cell className="bg-sidebar">Client</Table.Cell>
                  <Table.Cell>
                    {clientData?.cvGetClient?.name || riskGroupDetail.client}
                  </Table.Cell>
                </Table.Row>
                <Table.Row>
                  <Table.Cell className="bg-sidebar">Effective Date</Table.Cell>
                  <Table.Cell>
                    {riskGroupDetail.effective_date
                      ? format(
                          new Date(riskGroupDetail.effective_date),
                          'dd.MM.yyyy',
                        )
                      : ''}
                  </Table.Cell>
                </Table.Row>
                <Table.Row>
                  <Table.Cell className="bg-sidebar">Expiration Date</Table.Cell>
                  <Table.Cell>
                    {riskGroupDetail.expiration_date
                      ? format(
                          new Date(riskGroupDetail.expiration_date),
                          'dd.MM.yyyy',
                        )
                      : ''}
                  </Table.Cell>
                </Table.Row>
                <Table.Row>
                  <Table.Cell className="bg-sidebar">Created At</Table.Cell>
                  <Table.Cell>
                    {format(
                      new Date(riskGroupDetail.createdAt || ''),
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
                      new Date(riskGroupDetail.updatedAt || ''),
                      'dd.MM.yyyy',
                    )}
                  </Table.Cell>
                </Table.Row>
              </Table.Body>
            </Table>
          </InfoCard.Content>
        </InfoCard>
      </div>
    </ScrollArea>
  );
};

