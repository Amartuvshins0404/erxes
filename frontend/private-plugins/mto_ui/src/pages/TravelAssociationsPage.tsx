import { IconBuildingCommunity, IconPlus } from '@tabler/icons-react';
import {
  Breadcrumb,
  Button,
  PageContainer,
  PageSubHeader,
  Separator,
} from 'erxes-ui';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from 'ui-modules';
import { TravelAssociationFilters } from '@/travelAssociation/components/TravelAssociationFilters';
import { TravelAssociationFormSheet } from '@/travelAssociation/components/TravelAssociationFormSheet';
import { TravelAssociationsRecordTable } from '@/travelAssociation/components/TravelAssociationsRecordTable';
import { useTravelAssociations } from '@/travelAssociation/hooks/useTravelAssociations';

export function TravelAssociationsPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const { refetch } = useTravelAssociations();

  return (
    <PageContainer>
      <PageHeader>
        <PageHeader.Start>
          <Breadcrumb>
            <Breadcrumb.List className="gap-1">
              <Breadcrumb.Item>
                <Button variant="ghost" asChild>
                  <Link to="/mto/travel-associations">
                    <IconBuildingCommunity />
                    Travel Associations
                  </Link>
                </Button>
              </Breadcrumb.Item>
            </Breadcrumb.List>
          </Breadcrumb>
          <Separator.Inline />
          <PageHeader.FavoriteToggleButton />
        </PageHeader.Start>
        <PageHeader.End>
          <Button onClick={() => setCreateOpen(true)}>
            <IconPlus />
            Add Travel Association
          </Button>
        </PageHeader.End>
      </PageHeader>
      <PageSubHeader>
        <TravelAssociationFilters />
      </PageSubHeader>
      <TravelAssociationsRecordTable />
      <TravelAssociationFormSheet
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSaved={() => void refetch()}
      />
    </PageContainer>
  );
}
