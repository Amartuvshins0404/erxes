import { Breadcrumb, Button, Separator } from 'erxes-ui';
import { useParams } from 'react-router-dom';
import { useAgencyDetail } from '../hooks/useAgencyDetail';

export const AgencyDetailBreadcrumb = () => {
  const { id } = useParams();
  const { agency } = useAgencyDetail({
    variables: { id: id },
  });
  return (
    <>
      <Separator.Inline />
      <Breadcrumb.Item>
        <Button variant="ghost">{agency?.name || 'Agency Detail'}</Button>
      </Breadcrumb.Item>
    </>
  );
};
