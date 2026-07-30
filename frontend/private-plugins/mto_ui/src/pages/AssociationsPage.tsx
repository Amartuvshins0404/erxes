import { useApolloClient } from '@apollo/client';
import { useState } from 'react';
import { Button } from 'erxes-ui';
import { IconTags } from '@tabler/icons-react';
import { MtoListPageLayout } from '~/components/MtoListPageLayout';
import { AssociationFilters } from '@/association/components/AssociationFilters';
import { AssociationsList } from '@/association/components/AssociationsList';
import { AssociationFilters as AssociationFiltersType } from '@/association/types/associationFilters';
import { AssociationFormSheet } from '@/association/components/AssociationFormSheet';
import { MTO_ASSOCIATIONS } from '@/association/graphql/associationQueries';

export function AssociationsPage() {
  const client = useApolloClient();
  const [filters, setFilters] = useState<AssociationFiltersType>({});
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <>
      <MtoListPageLayout
        pageName="Associations"
        pageIcon={<IconTags />}
        filters={filters}
        onFiltersChange={setFilters}
        filtersComponent={AssociationFilters}
        listComponent={AssociationsList}
        createDialog={
          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={() => setCreateOpen(true)}
          >
            Add Association
          </Button>
        }
        createDialogInHeader
      />

      <AssociationFormSheet
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSaved={() => {
          void client.refetchQueries({ include: [MTO_ASSOCIATIONS] });
        }}
      />
    </>
  );
}
