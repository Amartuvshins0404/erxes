import { IconCategory, IconPlus } from '@tabler/icons-react';
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
import { CategoriesRecordTable } from '@/category/components/CategoriesRecordTable';
import { CategoryFilters } from '@/category/components/CategoryFilters';
import { CategoryFormSheet } from '@/category/components/CategoryFormSheet';
import { useCategories } from '@/category/hooks/useCategories';

export function CategoriesPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const { refetch } = useCategories();

  return (
    <PageContainer>
      <PageHeader>
        <PageHeader.Start>
          <Breadcrumb>
            <Breadcrumb.List className="gap-1">
              <Breadcrumb.Item>
                <Button variant="ghost" asChild>
                  <Link to="/mto/categories">
                    <IconCategory />
                    Categories
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
            Add Category
          </Button>
        </PageHeader.End>
      </PageHeader>
      <PageSubHeader>
        <CategoryFilters />
      </PageSubHeader>
      <CategoriesRecordTable />
      <CategoryFormSheet
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSaved={() => void refetch()}
      />
    </PageContainer>
  );
}
