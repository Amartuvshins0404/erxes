import type { ReactNode } from 'react';
import { IconCarSuv, IconFolders } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Breadcrumb, Button, PageContainer, Separator } from 'erxes-ui';
import { PageHeader } from 'ui-modules';

import { CarSidebar } from './CarSidebar';

type CarModule = 'cars' | 'categories';

const moduleIconByKey = {
  cars: IconCarSuv,
  categories: IconFolders,
};

export const CarLayout = ({
  activeModule,
  actions,
  children,
}: {
  activeModule: CarModule;
  actions?: ReactNode;
  children: ReactNode;
}) => {
  const { t } = useTranslation('car');
  const ActiveIcon = moduleIconByKey[activeModule];
  const activeLabel =
    activeModule === 'categories'
      ? t('Categories', { defaultValue: 'Categories' })
      : t('Cars', { defaultValue: 'Cars' });

  return (
    <PageContainer>
      <PageHeader>
        <PageHeader.Start>
          <Breadcrumb>
            <Breadcrumb.List className="gap-1">
              {activeModule === 'categories' ? (
                <>
                  <Breadcrumb.Item>
                    <Button variant="ghost" asChild>
                      <Link to="/car">
                        <IconCarSuv />
                        {t('Cars', { defaultValue: 'Cars' })}
                      </Link>
                    </Button>
                  </Breadcrumb.Item>
                  <Breadcrumb.Separator />
                </>
              ) : null}
              <Breadcrumb.Page>
                <Button variant="ghost" asChild>
                  <Link
                    to={
                      activeModule === 'categories' ? '/car/categories' : '/car'
                    }
                  >
                    <ActiveIcon />
                    {activeLabel}
                  </Link>
                </Button>
              </Breadcrumb.Page>
            </Breadcrumb.List>
          </Breadcrumb>
          <Separator.Inline />
          <PageHeader.FavoriteToggleButton />
        </PageHeader.Start>
        {actions ? <PageHeader.End>{actions}</PageHeader.End> : null}
      </PageHeader>

      <div className="flex overflow-hidden flex-auto">
        <CarSidebar />
        <div className="flex overflow-hidden flex-col flex-auto w-full">
          {children}
        </div>
      </div>
    </PageContainer>
  );
};
