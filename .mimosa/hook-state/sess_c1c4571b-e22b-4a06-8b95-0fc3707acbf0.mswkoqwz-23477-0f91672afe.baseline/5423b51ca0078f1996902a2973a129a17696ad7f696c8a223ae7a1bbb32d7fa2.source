import { InfoCard, Spinner, Upload } from 'erxes-ui';
import { useGetMemberProfile } from '../hooks/useGetMemberProfile';
import { ProfileForm } from './ProfileForm';
import { useAtom } from 'jotai';
import { currentUserState } from 'ui-modules';

export const MemberProfile = () => {
  const { loading } = useGetMemberProfile();
  const [currentUser] = useAtom(currentUserState);

  if (loading) {
    return <Spinner containerClassName="py-32" />;
  }

  return (
    <InfoCard title="Profile" className="max-w-4xl mx-auto w-full my-4">
      <InfoCard.Content>
        <div>
          <Upload.Root
            value={currentUser?.details?.avatar as string}
            onChange={() => {}}
          >
            <Upload.Preview />
          </Upload.Root>
        </div>
        <ProfileForm />
      </InfoCard.Content>
    </InfoCard>
  );
};
