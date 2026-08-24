import { InfoCard, Spinner, Upload } from 'erxes-ui';
import { useGetMemberProfile } from '../hooks/useGetMemberProfile';
import { useUpdateMemberAvatar } from '../hooks/useUpdateMemberAvatar';
import { ProfileForm } from './ProfileForm';

export const MemberProfile = () => {
  const { loading } = useGetMemberProfile();
  const { avatar, onAvatarChange, updating } = useUpdateMemberAvatar();

  if (loading) {
    return <Spinner containerClassName="py-32" />;
  }

  return (
    <InfoCard title="Profile" className="max-w-4xl mx-auto w-full my-4">
      <InfoCard.Content className="flex-1 flex flex-col overflow-hidden">
        <div>
          <Upload.Root
            value={avatar ?? ''}
            onChange={onAvatarChange}
          >
            <Upload.Preview />
            <div className="flex gap-2 items-start">
              <Upload.Button
                size="sm"
                variant="outline"
                type="button"
                disabled={updating}
              />
              <Upload.RemoveButton
                size="sm"
                variant="outline"
                type="button"
                disabled={updating}
              />
            </div>
          </Upload.Root>
        </div>
        <ProfileForm />
      </InfoCard.Content>
    </InfoCard>
  );
};
