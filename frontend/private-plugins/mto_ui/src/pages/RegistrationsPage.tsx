import { useLazyQuery, useQuery } from '@apollo/client';
import { IconClipboardList, IconPlus } from '@tabler/icons-react';
import {
  Breadcrumb,
  Button,
  Dialog,
  PageContainer,
  PageSubHeader,
  ScrollArea,
  Separator,
  Spinner,
  toast,
  useQueryState,
} from 'erxes-ui';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from 'ui-modules';
import { RegistrationFilters } from '@/registration/components/RegistrationFilters';
import { RegistrationFormSheet } from '@/registration/components/RegistrationFormSheet';
import { RegistrationsRecordTable } from '@/registration/components/RegistrationsRecordTable';
import {
  MTO_REGISTRATION_APPLICATIONS_EXPORT,
  MTO_REGISTRATION_MEMBERSHIP_SUMMARIES,
} from '@/registration/graphql/registrationQueries';
import {
  useRegistrations,
  useRegistrationsFilterVariables,
} from '@/registration/hooks/useRegistrations';

function downloadCsv(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

interface MembershipSummary {
  membershipTypeId: string;
  title: string;
  schemaVersion: string;
}

export function RegistrationsPage() {
  const filters = useRegistrationsFilterVariables();
  const [membershipTypeId] = useQueryState<string>('membershipTypeId');
  const { refetch } = useRegistrations();
  const { data, loading } = useQuery(MTO_REGISTRATION_MEMBERSHIP_SUMMARIES);
  const [chooserOpen, setChooserOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);
  const [selectedTitle, setSelectedTitle] = useState<string | undefined>();
  const [exportCsv, { loading: exportLoading }] = useLazyQuery(
    MTO_REGISTRATION_APPLICATIONS_EXPORT,
  );

  const summaries = (data?.mtoRegistrationMembershipSummaries ??
    []) as MembershipSummary[];

  const fillFormTypes = summaries.slice(0, 6);

  const activeTypeTitle = useMemo(() => {
    if (!membershipTypeId) return null;
    return (
      summaries.find((row) => row.membershipTypeId === membershipTypeId)
        ?.title ?? membershipTypeId
    );
  }, [membershipTypeId, summaries]);

  function openSheet(row: MembershipSummary) {
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

  async function handleExport() {
    try {
      const result = await exportCsv({ variables: { ...filters } });
      const csv = result.data?.mtoRegistrationApplicationsExport;
      if (typeof csv !== 'string') {
        throw new Error('Export returned empty data');
      }
      const date = new Date().toISOString().slice(0, 10);
      downloadCsv(csv, `registrations-${date}.csv`);
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : 'CSV export амжилтгүй боллоо';
      toast({
        title: 'Алдаа',
        description: message,
        variant: 'destructive',
      });
    }
  }

  return (
    <PageContainer>
      <PageHeader>
        <PageHeader.Start>
          <Breadcrumb>
            <Breadcrumb.List className="gap-1">
              <Breadcrumb.Item>
                <Button variant="ghost" asChild>
                  <Link to="/mto/registrations">
                    <IconClipboardList />
                    Бүртгэлүүд
                  </Link>
                </Button>
              </Breadcrumb.Item>
              {activeTypeTitle ? (
                <>
                  <Breadcrumb.Separator />
                  <Breadcrumb.Item>
                    <Button variant="ghost" disabled>
                      {activeTypeTitle}
                    </Button>
                  </Breadcrumb.Item>
                </>
              ) : null}
            </Breadcrumb.List>
          </Breadcrumb>
          <Separator.Inline />
          <PageHeader.FavoriteToggleButton />
        </PageHeader.Start>
        <PageHeader.End>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              type="button"
              onClick={() => void handleExport()}
              disabled={exportLoading}
            >
              {exportLoading ? 'Export...' : 'Export CSV'}
            </Button>
            <Button
              type="button"
              onClick={() => setChooserOpen(true)}
              disabled={loading || !fillFormTypes.length}
            >
              <IconPlus />
              Бүртгэл нэмэх
            </Button>
          </div>
        </PageHeader.End>
      </PageHeader>
      <PageSubHeader>
        <RegistrationFilters />
      </PageSubHeader>
      <RegistrationsRecordTable />

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
            <ScrollArea className="max-h-[min(60vh,24rem)]">
              <div className="space-y-2 py-3 pr-3">
                {fillFormTypes.map((row) => (
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
                ))}
              </div>
            </ScrollArea>
          )}
        </Dialog.Content>
      </Dialog>

      <RegistrationFormSheet
        open={sheetOpen}
        onOpenChange={handleSheetOpenChange}
        membershipTypeId={selectedTypeId}
        summaryTitle={selectedTitle}
        onSubmitted={() => {
          void refetch();
        }}
      />
    </PageContainer>
  );
}
