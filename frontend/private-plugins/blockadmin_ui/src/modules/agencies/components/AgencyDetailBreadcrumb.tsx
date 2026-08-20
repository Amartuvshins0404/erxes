import { Breadcrumb, Button, Separator, Skeleton } from 'erxes-ui';
import { useAgencyDetail } from '../hooks/useAgencyDetail';

export const AgencyDetailBreadcrumb = () => {
  const { agency, loading } = useAgencyDetail();

  return (
    <>
      <Separator.Inline />
      <Breadcrumb.Item>
        {loading ? (
          <Skeleton className="w-32 h-4" />
        ) : (
          <Button variant="ghost">
            <Breadcrumb.Page>{agency?.name || 'Agency detail'}</Breadcrumb.Page>
          </Button>
        )}
      </Breadcrumb.Item>
    </>
  );
};
