import { DropdownMenu } from 'erxes-ui';
import { useDeveloperInfo } from '@/block/hooks/useDeveloperInfo';
import { useUpdateDeveloperInfo } from '@/block/hooks/useUpdateDeveloperInfo';
import { useParams } from 'react-router-dom';
import { IconEye } from '@tabler/icons-react';
import { IconEyeOff } from '@tabler/icons-react';

const DeveloperVisibilityControl = () => {
  const { id } = useParams();
  const { developerInfo } = useDeveloperInfo(id);

  const { updateDeveloperInfoMutation } = useUpdateDeveloperInfo();

  const handleVisibilityChange = () => {
    const visibility =
      developerInfo?.visibility === 'public' ? 'private' : 'public';

    updateDeveloperInfoMutation(developerInfo?._id || '', {
      visibility,
    });
  };

  return (
    <DropdownMenu.Item onClick={handleVisibilityChange}>
      {developerInfo?.visibility === 'public' ? <IconEyeOff /> : <IconEye />}
      {developerInfo?.visibility === 'public' ? 'Private' : 'Public'}
    </DropdownMenu.Item>
  );
};

export default DeveloperVisibilityControl;
