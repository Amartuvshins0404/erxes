import { useApolloClient, useQuery } from '@apollo/client';
import { useState } from 'react';
import { Button, Dialog, Spinner } from 'erxes-ui';
import { MtoListPageLayout } from '~/components/MtoListPageLayout';
import { RegistrationFilters } from '@/registration/components/RegistrationFilters';
import { RegistrationsList } from '@/registration/components/RegistrationsList';
import { RegistrationFilters as RegistrationFiltersType } from '@/registration/types/registrationFilters';
import { RegistrationFormSheet } from '@/registration/components/RegistrationFormSheet';
import {
  MTO_REGISTRATION_APPLICATIONS,
  MTO_REGISTRATION_MEMBERSHIP_SUMMARIES,
} from '@/registration/graphql/registrationQueries';

export function RegistrationsPage() {
  const client = useApolloClient();
  const [filters, setFilters] = useState<RegistrationFiltersType>({});
  const { data, loading } = useQuery(MTO_REGISTRATION_MEMBERSHIP_SUMMARIES);
  const [chooserOpen, setChooserOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);
  const [selectedTitle, setSelectedTitle] = useState<string | undefined>();

  const fillFormTypes = (data?.mtoRegistrationMembershipSummaries ?? []).slice(
    0,
    6,
  );

  function openSheet(row: {
    membershipTypeId: string;
    title: string;
    schemaVersion: string;
  }) {
    setSelectedTypeId(row.membershipTypeId);
    setSelectedTitle(row.title);
    setSheetOpen(true);
  }

  function handleSheetOpenChange(open: boolean) {
    setSheetOpen(open);
    if (!open) {
      setSelectedTypeId(null);
      setSelectedTitle(undefined);
    }
  }

  return (
    <>
      <MtoListPageLayout
        pageName="Бүртгэлүүд"
        filters={filters}
        onFiltersChange={setFilters}
        filtersComponent={RegistrationFilters}
        listComponent={RegistrationsList}
        headerActions={
          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={() => setChooserOpen(true)}
            disabled={loading || !fillFormTypes.length}
          >
            Бүртгэл нэмэх
          </Button>
        }
      />

      <Dialog open={chooserOpen} onOpenChange={setChooserOpen}>
        <Dialog.Content>
          <Dialog.Header>
            <Dialog.Title>FillForm төрлөө сонгоно уу</Dialog.Title>
            <Dialog.Description>
              Формын төрлөө сонгоход шууд маягт нээгдэнэ.
            </Dialog.Description>
          </Dialog.Header>
          {loading ? (
            <div className="flex justify-center py-6">
              <Spinner />
            </div>
          ) : (
            <div className="space-y-2 py-3">
              {fillFormTypes.map(
                (row: {
                  membershipTypeId: string;
                  title: string;
                  schemaVersion: string;
                }) => (
                  <Button
                    key={row.membershipTypeId}
                    type="button"
                    variant="outline"
                    className="w-full justify-start h-auto py-3"
                    onClick={() => {
                      setChooserOpen(false);
                      openSheet(row);
                    }}
                  >
                    <span className="flex flex-col items-start gap-0.5">
                      <span className="font-medium">{row.title}</span>
                      <span className="text-xs text-muted-foreground font-normal">
                        Хувилбар: {row.schemaVersion}
                      </span>
                    </span>
                  </Button>
                ),
              )}
            </div>
          )}
        </Dialog.Content>
      </Dialog>

      <RegistrationFormSheet
        open={sheetOpen}
        onOpenChange={handleSheetOpenChange}
        membershipTypeId={selectedTypeId}
        summaryTitle={selectedTitle}
        onSubmitted={() => {
          void client.refetchQueries({ include: [MTO_REGISTRATION_APPLICATIONS] });
        }}
      />
    </>
  );
}
