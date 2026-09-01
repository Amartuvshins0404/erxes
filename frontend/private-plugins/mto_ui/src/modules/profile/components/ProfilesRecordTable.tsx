import { IconUser } from '@tabler/icons-react';
import { Empty, RecordTable, toast, useConfirm } from 'erxes-ui';
import { useMutation } from '@apollo/client';
import { useAtomValue } from 'jotai';
import { useState } from 'react';
import { currentUserState, IUser } from 'ui-modules';
import { profileColumns } from '@/profile/components/ProfileColumns';
import { ProfileFormSheet } from '@/profile/components/ProfileFormSheet';
import { PROFILES_CURSOR_SESSION_KEY } from '@/profile/constants/profilesCursorSessionKey';
import { useProfiles } from '@/profile/hooks/useProfiles';
import {
  MTO_PROFILE_APPROVE,
  MTO_PROFILE_REJECT,
  MTO_PROFILES_REMOVE,
} from '@/profile/graphql/profileMutations';

export function ProfilesRecordTable() {
  const { confirm } = useConfirm();
  const { profiles, loading, refetch, handleFetchMore, pageInfo } =
    useProfiles();
  const { hasPreviousPage, hasNextPage } = pageInfo || {};
  const currentUser = useAtomValue(currentUserState) as IUser | null;
  const [removeProfiles] = useMutation(MTO_PROFILES_REMOVE);
  const [approveProfile] = useMutation(MTO_PROFILE_APPROVE);
  const [rejectProfile] = useMutation(MTO_PROFILE_REJECT);
  const [editId, setEditId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const requireUserId = () => {
    const userId = currentUser?._id;
    if (!userId) {
      toast({
        title: 'Error',
        description: 'You must be signed in to do this',
        variant: 'destructive',
      });
      return null;
    }
    return userId;
  };

  const handleRemove = (id: string) => {
    void confirm({
      message: 'Are you sure you want to remove this profile?',
      options: { confirmationValue: 'delete' },
    }).then(() => {
      void removeProfiles({ variables: { ids: [id] } }).then(() => refetch());
    });
  };

  const handleApprove = (id: string) => {
    const approvedBy = requireUserId();
    if (!approvedBy) return;

    void confirm({
      message: 'Approve this profile?',
    }).then(() => {
      void approveProfile({ variables: { _id: id, approvedBy } }).then(() =>
        refetch(),
      );
    });
  };

  const handleReject = (id: string) => {
    const rejectedBy = requireUserId();
    if (!rejectedBy) return;

    void confirm({
      message: 'Reject this profile?',
      options: { confirmationValue: 'reject' },
    }).then(() => {
      void rejectProfile({
        variables: {
          _id: id,
          rejectionReason: 'Rejected',
          rejectedBy,
        },
      }).then(() => refetch());
    });
  };

  if (!loading && profiles.length === 0) {
    return (
      <Empty>
        <Empty.Header>
          <Empty.Media variant="icon">
            <IconUser />
          </Empty.Media>
          <Empty.Title>No profiles found</Empty.Title>
          <Empty.Description>There seem to be no profiles.</Empty.Description>
        </Empty.Header>
      </Empty>
    );
  }

  return (
    <>
      <div className="flex flex-col overflow-hidden h-full">
        <RecordTable.Provider
          columns={profileColumns({
            onEdit: (id) => {
              setEditId(id);
              setSheetOpen(true);
            },
            onRemove: handleRemove,
            onApprove: handleApprove,
            onReject: handleReject,
          })}
          data={profiles}
          className="m-3 h-full"
          stickyColumns={['businessName']}
          tableId="profiles_record_table"
        >
          <RecordTable.CursorProvider
            hasPreviousPage={hasPreviousPage}
            hasNextPage={hasNextPage}
            dataLength={profiles.length}
            sessionKey={PROFILES_CURSOR_SESSION_KEY}
          >
            <RecordTable>
              <RecordTable.Header />
              <RecordTable.Body>
                <RecordTable.CursorBackwardSkeleton
                  handleFetchMore={handleFetchMore}
                />
                {loading && <RecordTable.RowSkeleton rows={10} />}
                <RecordTable.RowList />
                <RecordTable.CursorForwardSkeleton
                  handleFetchMore={handleFetchMore}
                />
              </RecordTable.Body>
            </RecordTable>
          </RecordTable.CursorProvider>
        </RecordTable.Provider>
      </div>

      <ProfileFormSheet
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open);
          if (!open) setEditId(null);
        }}
        editId={editId}
        onSaved={() => void refetch()}
      />
    </>
  );
}
