import { useState } from 'react';
import { BannersList } from '~/modules/banner/components/BannersList';
import { CreateBannerDialog } from '~/modules/banner/components/BannerDialog';
import { BannerFilters } from '~/modules/banner/components/BannerFilters';
import { BannerFilters as BannerFiltersType } from '~/modules/banner/types/banner';
import { OneFitListPageLayout } from '~/components/OneFitListPageLayout';

export function BannersPage() {
  const [filters, setFilters] = useState<BannerFiltersType>({});

  return (
    <OneFitListPageLayout
      pageName="Banners"
      filters={filters}
      onFiltersChange={setFilters}
      filtersComponent={BannerFilters}
      createDialog={<CreateBannerDialog />}
      listComponent={BannersList}
    />
  );
}
