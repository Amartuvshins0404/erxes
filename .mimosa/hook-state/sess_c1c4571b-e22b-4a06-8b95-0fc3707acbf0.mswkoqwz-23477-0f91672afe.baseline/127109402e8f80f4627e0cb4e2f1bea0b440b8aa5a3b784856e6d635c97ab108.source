import { useState } from 'react';
import { PromoCodesList } from '~/modules/promoCode/components/PromoCodesList';
import { CreatePromoCodeDialog } from '~/modules/promoCode/components/PromoCodeDialog';
import { PromoCodeFilters } from '~/modules/promoCode/components/PromoCodeFilters';
import { PromoCodeFilters as PromoCodeFiltersType } from '~/modules/promoCode/types/promoCode';
import { OneFitListPageLayout } from '~/components/OneFitListPageLayout';

export function PromoCodesPage() {
  const [filters, setFilters] = useState<PromoCodeFiltersType>({});

  return (
    <OneFitListPageLayout
      pageName="Promo Codes"
      filters={filters}
      onFiltersChange={setFilters}
      filtersComponent={PromoCodeFilters}
      createDialog={<CreatePromoCodeDialog />}
      listComponent={PromoCodesList}
    />
  );
}
