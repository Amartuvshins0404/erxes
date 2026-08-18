import { IconBuildingStore } from '@tabler/icons-react';
import {
  Breadcrumb,
  Button,
  PageContainer,
  Separator,
} from 'erxes-ui';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageHeader } from 'ui-modules';
import { CollectivesTable } from '../components/CollectivesTable';
import { CollectiveDetailSheet } from '../components/CollectiveDetailSheet';
import { CollectiveAddSheet } from '../components/CollectiveAddSheet';

export const CollectivesPage = () => {
  const { t } = useTranslation('mushop');
  return (
    <PageContainer>
      <PageHeader>
        <PageHeader.Start>
          <Breadcrumb>
            <Breadcrumb.List className="gap-1">
              <Breadcrumb.Item>
                <Button variant="ghost" asChild>
                  <Link to="/mushop/collectives">
                    <IconBuildingStore />
                    {t('Collectives')}
                  </Link>
                </Button>
              </Breadcrumb.Item>
            </Breadcrumb.List>
          </Breadcrumb>
          <Separator.Inline />
          <PageHeader.FavoriteToggleButton />
        </PageHeader.Start>
        <PageHeader.End>
          <CollectiveAddSheet />
        </PageHeader.End>
      </PageHeader>

      <CollectivesTable />
      <CollectiveDetailSheet />
    </PageContainer>
  );
};

export default CollectivesPage;
