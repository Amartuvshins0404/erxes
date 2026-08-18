import { BTK_GET_NEWS_LIST, BTK_GET_NEWS_DETAIL } from '~/modules/news/graphql/newsQueries';
import { BTK_ADMIN_UPDATE_NEWS_VERIFICATION_STATUS } from '~/modules/news/graphql/newsMutations';
import { useRemoveNews } from '~/modules/news/hooks/useRemoveNews';
import { useNewsDetail } from '~/modules/news/hooks/useNewsDetail';
import { IconTrash } from '@tabler/icons-react';
import { Button, Select, toast, useConfirm } from 'erxes-ui';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation } from '@apollo/client';

const VERIFICATION_STATUSES = [
  { value: 'pending', label: 'Шалгаж байна' },
  { value: 'need_info', label: 'Нэмэлт мэдээлэл хэрэгтэй' },
  { value: 'approved', label: 'Зөвшөөрөгдсөн' },
  { value: 'rejected', label: 'Зөвшөөрөгдөөгүй' },
  { value: 'violation', label: 'Дүрэм зөрчсөн' },
];

export const NewsDetailActions = () => {
  const { id } = useParams();
  const { confirm } = useConfirm();
  const { removeNews } = useRemoveNews();
  const { news } = useNewsDetail();
  const navigate = useNavigate();

  const [updateVerificationStatus, { loading }] = useMutation(
    BTK_ADMIN_UPDATE_NEWS_VERIFICATION_STATUS,
    {
      refetchQueries: [{ query: BTK_GET_NEWS_DETAIL, variables: { id } }],
    },
  );

  const handleStatusChange = (verificationStatus: string) => {
    updateVerificationStatus({
      variables: { id, verificationStatus },
      onError: (error) => {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      },
    });
  };

  return (
    <div className="flex items-center gap-2">
      <Select
        value={news?.verificationStatus || 'pending'}
        onValueChange={handleStatusChange}
        disabled={loading}
      >
        <Select.Trigger className="w-52">
          <Select.Value placeholder="Статус сонгох" />
        </Select.Trigger>
        <Select.Content>
          {VERIFICATION_STATUSES.map((s) => (
            <Select.Item key={s.value} value={s.value}>
              {s.label}
            </Select.Item>
          ))}
        </Select.Content>
      </Select>

      <Button
        variant="outline"
        size="icon"
        className="text-destructive"
        onClick={() =>
          confirm({
            message: 'Are you sure you want to delete this news?',
            options: { okLabel: 'Delete' },
          }).then(() => {
            removeNews({
              variables: { id },
              refetchQueries: [{ query: BTK_GET_NEWS_LIST }],
              onCompleted: () => {
                navigate('/btkadmin/news');
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
      </Button>
    </div>
  );
};
