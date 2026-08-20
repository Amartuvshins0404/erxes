import { IconClipboardList } from '@tabler/icons-react';
import {
  Empty,
  isUndefinedOrNull,
  RecordTable,
  useQueryState,
} from 'erxes-ui';
import { useSetAtom } from 'jotai';
import { useEffect } from 'react';
import { registrationColumns } from '@/registration/components/RegistrationColumns';
import { RegistrationDetailSheet } from '@/registration/components/RegistrationDetailSheet';
import { REGISTRATIONS_CURSOR_SESSION_KEY } from '@/registration/constants/registrationsCursorSessionKey';
import { useRegistrations } from '@/registration/hooks/useRegistrations';
import { registrationsTotalCountAtom } from '@/registration/states/registrationsTotalCountState';

export function RegistrationsRecordTable() {
  const setTotalCount = useSetAtom(registrationsTotalCountAtom);
  const [archived] = useQueryState<string>('archived');
  const hideArchive = archived === 'true';

  const {
    registrations,
    handleFetchMore,
    loading,
    pageInfo,
    totalCount,
    refetch,
  } = useRegistrations();

  const { hasPreviousPage, hasNextPage } = pageInfo || {};

  useEffect(() => {
    if (isUndefinedOrNull(totalCount)) return;
    setTotalCount(totalCount);
  }, [totalCount, setTotalCount]);

  if (!loading && (!registrations || registrations.length === 0)) {
    return (
      <>
        <Empty>
          <Empty.Header>
            <Empty.Media variant="icon">
              <IconClipboardList />
            </Empty.Media>
            <Empty.Title>Бүртгэл олдсонгүй</Empty.Title>
            <Empty.Description>
              Шүүлтийн нөхцөлд тохирох бүртгэл байхгүй байна.
            </Empty.Description>
          </Empty.Header>
        </Empty>
        <RegistrationDetailSheet onSaved={() => void refetch()} />
      </>
    );
  }

  return (
    <>
      <div className="flex flex-col overflow-hidden h-full">
        <RecordTable.Provider
          columns={registrationColumns({
            hideArchive,
            onChanged: () => void refetch(),
          })}
          data={registrations || (loading ? [{} as never] : [])}
          className="m-3 h-full"
          stickyColumns={['isRead', 'membershipTypeTitle']}
          tableId="registrations_record_table"
        >
          <RecordTable.CursorProvider
            hasPreviousPage={hasPreviousPage}
            hasNextPage={hasNextPage}
            dataLength={registrations?.length}
            sessionKey={REGISTRATIONS_CURSOR_SESSION_KEY}
          >
            <RecordTable>
              <RecordTable.Header />
              <RecordTable.Body>
                <RecordTable.CursorBackwardSkeleton
                  handleFetchMore={handleFetchMore}
                />
                {loading && <RecordTable.RowSkeleton rows={40} />}
                <RecordTable.RowList />
                <RecordTable.CursorForwardSkeleton
                  handleFetchMore={handleFetchMore}
                />
              </RecordTable.Body>
            </RecordTable>
          </RecordTable.CursorProvider>
        </RecordTable.Provider>
      </div>
      <RegistrationDetailSheet
        hideArchive={hideArchive}
        onSaved={() => void refetch()}
      />
    </>
  );
}
