import { useState } from 'react';
import { CategoriesList } from '~/modules/category/components/CategoriesList';
import { CategoryDialog } from '~/modules/category/components/CategoryDialog';
import { IconPlus } from '@tabler/icons-react';
import { Button } from 'erxes-ui';
import { CategoryFiltersComponent } from '~/modules/category/components/CategoryFilters';
import { CategoryFilters } from '~/modules/category/types/category';
import { OneFitTabbedListPageLayout } from '~/components/OneFitTabbedListPageLayout';
import { CityDistrictManagement } from '~/modules/location/components/CityDistrictManagement';

export function CategoriesPage() {
  const [categoryFilters, setCategoryFilters] = useState<CategoryFilters>({});
  const [locationFilters, setLocationFilters] = useState<Record<string, never>>(
    {},
  );

  return (
    <OneFitTabbedListPageLayout
      pageName="Categories"
      tabs={[
        {
          value: 'categories',
          label: 'Categories',
          filters: categoryFilters,
          onFiltersChange: setCategoryFilters,
          filtersComponent: CategoryFiltersComponent,
          listComponent: CategoriesList,
          createDialog: (
            <CategoryDialog
              trigger={
                <Button>
                  <IconPlus />
                  Create Category
                </Button>
              }
            />
          ),
        },
        {
          value: 'locations',
          label: 'Cities & Districts',
          filters: locationFilters,
          onFiltersChange: setLocationFilters,
          // no top-level filters; management component handles its own UI
          filtersComponent: () => null,
          listComponent: () => <CityDistrictManagement />,
        },
      ]}
    />
  );
}
