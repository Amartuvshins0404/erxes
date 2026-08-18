import { useApolloClient } from '@apollo/client';
import { useState } from 'react';
import { Button } from 'erxes-ui';
import { IconCategory } from '@tabler/icons-react';
import { MtoListPageLayout } from '~/components/MtoListPageLayout';
import { CategoryFilters } from '@/category/components/CategoryFilters';
import { CategoriesList } from '@/category/components/CategoriesList';
import { CategoryFilters as CategoryFiltersType } from '@/category/types/categoryFilters';
import { CategoryFormSheet } from '@/category/components/CategoryFormSheet';
import { MTO_CATEGORIES } from '@/category/graphql/categoryQueries';

export function CategoriesPage() {
  const client = useApolloClient();
  const [filters, setFilters] = useState<CategoryFiltersType>({});
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <>
      <MtoListPageLayout
        pageName="Categories"
        pageIcon={<IconCategory />}
        filters={filters}
        onFiltersChange={setFilters}
        filtersComponent={CategoryFilters}
        listComponent={CategoriesList}
        createDialog={
          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={() => setCreateOpen(true)}
          >
            Add Category
          </Button>
        }
        createDialogInHeader
      />

      <CategoryFormSheet
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSaved={() => {
          void client.refetchQueries({ include: [MTO_CATEGORIES] });
        }}
      />
    </>
  );
}
