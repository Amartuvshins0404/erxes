import { useState } from 'react';
import { IconPlus } from '@tabler/icons-react';
import { Button } from 'erxes-ui';
import { OneFitListPageLayout } from '~/components/OneFitListPageLayout';
import { BulkMembershipPurchaseDialog } from '~/modules/membership-purchase/components/BulkMembershipPurchaseDialog';
import { CreateMembershipPurchaseDialog } from '~/modules/membership-purchase/components/CreateMembershipPurchaseDialog';
import { MembershipPurchaseFiltersComponent } from '~/modules/membership-purchase/components/MembershipPurchaseFilters';
import { MembershipPurchasesList } from '~/modules/membership-purchase/components/MembershipPurchasesList';
import { MembershipPurchaseFilters } from '~/modules/membership-purchase/types/membershipPurchase';

export function MembershipPurchasesPage() {
  const [filters, setFilters] = useState<MembershipPurchaseFilters>({});

  return (
    <OneFitListPageLayout
      pageName="Membership Purchases"
      filters={filters}
      onFiltersChange={setFilters}
      filtersComponent={MembershipPurchaseFiltersComponent}
      createDialog={
        <div className="flex items-center gap-2">
          <CreateMembershipPurchaseDialog
            trigger={
              <Button>
                <IconPlus />
                Create purchase
              </Button>
            }
          />
          <BulkMembershipPurchaseDialog
            trigger={<Button variant="outline">Bulk purchase</Button>}
          />
        </div>
      }
      createDialogInHeader={true}
      listComponent={MembershipPurchasesList}
    />
  );
}
