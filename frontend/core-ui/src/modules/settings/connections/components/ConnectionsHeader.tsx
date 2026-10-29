import { IconPlugConnected, IconPlus } from '@tabler/icons-react';
import { Breadcrumb, Button } from 'erxes-ui';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { PageHeader, PageHeaderEnd, PageHeaderStart } from 'ui-modules';

interface IConnectionsHeaderProps {
  onAdd: () => void;
  addDisabled: boolean;
}

export const ConnectionsHeader = ({
  onAdd,
  addDisabled,
}: IConnectionsHeaderProps) => {
  const { t } = useTranslation('settings', { keyPrefix: 'connections' });

  return (
    <PageHeader>
      <PageHeaderStart>
        <Breadcrumb>
          <Breadcrumb.List className="gap-1">
            <Breadcrumb.Item>
              <Button variant="ghost" asChild>
                <Link to="/settings/connections">
                  <IconPlugConnected />
                  {t('title', 'Connections')}
                </Link>
              </Button>
            </Breadcrumb.Item>
          </Breadcrumb.List>
        </Breadcrumb>
      </PageHeaderStart>
      <PageHeaderEnd>
        <Button onClick={onAdd} disabled={addDisabled}>
          <IconPlus />
          {t('add-connection', 'Add connection')}
        </Button>
      </PageHeaderEnd>
    </PageHeader>
  );
};
