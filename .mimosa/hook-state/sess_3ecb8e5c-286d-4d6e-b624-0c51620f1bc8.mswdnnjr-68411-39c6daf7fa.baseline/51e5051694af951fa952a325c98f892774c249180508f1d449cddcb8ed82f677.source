import { BTK_GET_NEWS_LIST } from '~/modules/news/graphql/newsQueries';
import { useRemoveNews } from '~/modules/news/hooks/useRemoveNews';
import { IconTrash } from '@tabler/icons-react';
import { Button, toast, useConfirm } from 'erxes-ui';
import { useNavigate, useParams } from 'react-router-dom';

export const NewsDetailActions = () => {
  const { id: projectId } = useParams();
  const { confirm } = useConfirm();
  const { removeNews } = useRemoveNews();
  const navigate = useNavigate();

  return (
    <Button
      variant="outline"
      className="text-destructive"
      onClick={() =>
        confirm({
          message: 'Are you sure you want to delete this news?',
          options: { okLabel: 'Delete' },
        }).then(() => {
          removeNews({
            variables: { id: projectId },
            refetchQueries: [{ query: BTK_GET_NEWS_LIST }],
            onCompleted: () => {
              navigate('/btk/news');
              toast({ title: 'Success', description: 'News deleted successfully' });
            },
            onError: (error) => {
              toast({ title: 'Error', description: error.message, variant: 'destructive' });
            },
          });
        })
      }
    >
      <IconTrash />
      Delete
    </Button>
  );
};
