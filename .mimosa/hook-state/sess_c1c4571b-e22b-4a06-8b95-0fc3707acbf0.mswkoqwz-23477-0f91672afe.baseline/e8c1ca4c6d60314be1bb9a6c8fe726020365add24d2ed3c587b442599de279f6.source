import { useState } from 'react';
import { useQuery, gql } from '@apollo/client';
import { Badge, Button, Label } from 'erxes-ui';
import { IconArrowRight, IconBuildingEstate } from '@tabler/icons-react';
import { SelectAgency } from './SelectAgency';
import { useUnitTransfer } from '../hooks/useUnitTransfer';

const GET_AGENCIES = gql`
  query BlockGetAgenciesForUnit {
    blockGetAgencies {
      _id
      name
      brandName
    }
  }
`;

// In OS mode the blockagency service subdomain is its plugin name
const AGENCY_SUBDOMAIN = 'blockagency';

type Props = {
  unitId: string;
  agencyEntityId?: string;
  agencySubdomain?: string;
};

export const UnitTransferSection = ({
  unitId,
  agencyEntityId,
  agencySubdomain,
}: Props) => {
  const [selectedAgency, setSelectedAgency] = useState('');
  const { transferUnit, loading } = useUnitTransfer({ unitId });

  const { data } = useQuery<{
    blockGetAgencies: { _id: string; name: string; brandName?: string }[];
  }>(GET_AGENCIES, { fetchPolicy: 'cache-first' });

  const agencies = data?.blockGetAgencies || [];
  const assignedAgency = agencies.find((a) => a._id === agencyEntityId);
  const agencyName = assignedAgency
    ? assignedAgency.brandName || assignedAgency.name
    : agencySubdomain;

  // Already transferred
  if (agencyEntityId && !selectedAgency) {
    return (
      <div className="space-y-2">
        <Label>Agency assignment</Label>
        <div className="flex items-center gap-2 h-8">
          <IconBuildingEstate className="w-4 h-4 text-muted-foreground" />
          <Badge variant="success">Assigned</Badge>
          <span className="text-sm font-medium">{agencyName}</span>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 px-2 text-xs text-muted-foreground"
            onClick={() => setSelectedAgency('__reassign__')}
          >
            Reassign
          </Button>
        </div>
      </div>
    );
  }

  // Transfer / Reassign form
  return (
    <div className="space-y-2">
      <Label>
        {agencyEntityId ? 'Reassign to agency' : 'Transfer to agency'}
      </Label>
      <div className="flex items-center gap-2">
        <SelectAgency
          value={selectedAgency === '__reassign__' ? '' : selectedAgency}
          onValueChange={setSelectedAgency}
        />
        <Button
          size="sm"
          disabled={
            !selectedAgency || selectedAgency === '__reassign__' || loading
          }
          onClick={() =>
            transferUnit({
              agencyId: selectedAgency,
              agencySubdomain: AGENCY_SUBDOMAIN,
            })
          }
        >
          <IconArrowRight className="w-4 h-4 mr-1" />
          {agencyEntityId ? 'Reassign' : 'Transfer'}
        </Button>
        {agencyEntityId && (
          <Button
            size="sm"
            variant="ghost"
            className="text-muted-foreground"
            onClick={() => setSelectedAgency('')}
          >
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
};
