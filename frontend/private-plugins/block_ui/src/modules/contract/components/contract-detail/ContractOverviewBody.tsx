import { Badge, InfoCard, Table } from 'erxes-ui';
import { useParams } from 'react-router-dom';
import { useUnit } from '@/unit/hooks/useUnit';
import { useBuilding, useZoning } from '@/building/hooks/useBuildings';
import { useCustomerDetail, MembersInline } from 'ui-modules';
import {
  IContract,
  ContractPartyType,
} from '@/contract/types/contractTypes';
import { useBlockContractStatusesByType } from '@/contract-status/hooks/useGetBlockContractStatuses';
import {
  STATUS_TYPE_VARIANT,
  formatAmount,
  formatDate,
  renderRow,
} from './shared';

export const ContractOverviewBody = ({
  contract,
}: {
  contract: IContract;
}) => {
  const { unit } = useUnit(contract.unit);
  const { building } = useBuilding(unit?.building);
  const { zoning } = useZoning(unit?.zoning);
  const { projectId: projectIdParam, id } = useParams<{
    projectId?: string;
    id?: string;
  }>();
  const projectId = projectIdParam || id || '';
  const { statuses = [] } = useBlockContractStatusesByType({ projectId });

  const matchedStage = contract.status
    ? statuses.find((s) => s._id === contract.status)
    : undefined;

  const partyId = contract.party?.id;
  const isCustomer = contract.party?.type === ContractPartyType.CUSTOMER;

  const { customerDetail } = useCustomerDetail(
    { variables: { _id: partyId }, skip: !partyId || !isCustomer },
    true,
  );

  const partyLabel = (() => {
    if (!contract.party) return null;
    if (isCustomer && customerDetail) {
      const name =
        [customerDetail.firstName, customerDetail.lastName]
          .filter(Boolean)
          .join(' ') ||
        customerDetail.primaryPhone ||
        customerDetail.primaryEmail ||
        'Unnamed customer';
      return `Customer · ${name}`;
    }
    return `${contract.party.type} · ${contract.party.id}`;
  })();

  const unitLabel = (() => {
    if (!unit) return contract.unit;
    const parts: string[] = [`Unit ${unit.number}`];
    if (unit.unitType?.name) parts.push(unit.unitType.name);
    if (unit.unitType?.size != null) parts.push(`${unit.unitType.size}m²`);
    return parts.join(' · ');
  })();

  return (
    <div className="flex flex-col gap-4">
      <InfoCard title="Contract Information">
        <InfoCard.Content className="shadow-none p-0 overflow-hidden">
          <Table>
            <Table.Body className="bt:[&_td]:px-2 bt:[&_tr:first-child_td]:border-t bt:[&_td]:h-10">
              {renderRow(
                'Number',
                contract.number ? `#${contract.number}` : null,
                true,
              )}
              {renderRow(
                'Status',
                matchedStage ? (
                  <Badge
                    variant={
                      STATUS_TYPE_VARIANT[matchedStage.type] || 'default'
                    }
                  >
                    {matchedStage.name}
                  </Badge>
                ) : (
                  '-'
                ),
              )}
              {renderRow('Block', building?.name)}
              {renderRow(
                'Floor',
                zoning?.floor != null ? `Floor ${zoning.floor}` : null,
              )}
              {renderRow('Unit', unitLabel)}
              {renderRow(
                'Amount',
                formatAmount(contract.amount, contract.currency),
              )}
              {renderRow('Amount Type', contract.amountType)}
              {renderRow('Currency', contract.currency)}
              {renderRow('Contract Date', formatDate(contract.date))}
              {renderRow('Start Date', formatDate(contract.startDate))}
              {renderRow(
                'End Date',
                contract.isLifeTime ? 'Lifetime' : formatDate(contract.endDate),
              )}
              {renderRow('Party', partyLabel)}
              {renderRow(
                'Assigned User',
                contract.user ? (
                  <MembersInline.Provider memberIds={[contract.user]}>
                    <div className="flex items-center gap-2">
                      <MembersInline.Avatar />
                      <MembersInline.Title />
                    </div>
                  </MembersInline.Provider>
                ) : null,
                false,
                true,
              )}
            </Table.Body>
          </Table>
        </InfoCard.Content>
      </InfoCard>
    </div>
  );
};

export default ContractOverviewBody;
