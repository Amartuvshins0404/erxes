import { useQuery } from '@apollo/client';
import { Button, Dialog, ScrollArea, Spinner } from 'erxes-ui';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MtoPageLayout } from '~/components/MtoPageLayout';
import { MTO_REGISTRATION_MEMBERSHIP_SUMMARIES } from '@/registration/graphql/registrationQueries';
import { RegistrationFormSheet } from '@/registration/components/RegistrationFormSheet';
import { useMtoMode } from '~/modules/config/hooks/useMtoMode';

export function RegistrationIndexPage() {
  const { data, loading, error } = useQuery(
    MTO_REGISTRATION_MEMBERSHIP_SUMMARIES,
  );
  const { isSlaveMode } = useMtoMode();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);
  const [selectedTitle, setSelectedTitle] = useState<string | undefined>();
  const [chooserOpen, setChooserOpen] = useState(false);
  const [pendingTypeId, setPendingTypeId] = useState<string | null>(null);

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

  if (loading) {
    return (
      <MtoPageLayout pageName="Гишүүнчлэлийн бүртгэл">
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      </MtoPageLayout>
    );
  }

  if (error) {
    return (
      <MtoPageLayout pageName="Гишүүнчлэлийн бүртгэл">
        <p className="text-destructive text-sm">{error.message}</p>
      </MtoPageLayout>
    );
  }

  const list = data?.mtoRegistrationMembershipSummaries ?? [];
  const fillFormTypes = list.slice(0, 6);

  function handleContinueToForm() {
    if (!pendingTypeId) {
      return;
    }

    const target = fillFormTypes.find(
      (item: { membershipTypeId: string }) =>
        item.membershipTypeId === pendingTypeId,
    );

    if (!target) {
      return;
    }

    setChooserOpen(false);
    openSheet(target);
  }

  return (
    <MtoPageLayout pageName="Гишүүнчлэлийн бүртгэл">
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Button variant="secondary" size="sm" asChild>
          <Link to="/mto/registrations">Илгээсэн бүртгэлүүдийг харах</Link>
        </Button>
        {!isSlaveMode && (
          <Button variant="outline" size="sm" asChild>
            <Link to="/mto/fillform">FillForm</Link>
          </Button>
        )}
      </div>
      <p className="text-muted-foreground text-sm mb-6 max-w-2xl">
        Эхлээд FillForm-ын төрлөө сонгоод Continue дарж маягтаа бөглөнө үү.
      </p>
      <Button
        type="button"
        onClick={() => {
          setPendingTypeId(fillFormTypes[0]?.membershipTypeId ?? null);
          setChooserOpen(true);
        }}
        disabled={!fillFormTypes.length}
      >
        FillForm сонгох
      </Button>

      <Dialog open={chooserOpen} onOpenChange={setChooserOpen}>
        <Dialog.Content>
          <Dialog.Header>
            <Dialog.Title>FillForm төрлөө сонгоно уу</Dialog.Title>
            <Dialog.Description>
              Дараах {fillFormTypes.length} төрлөөс нэгийг сонгоод Continue
              дарна уу.
            </Dialog.Description>
          </Dialog.Header>

          <ScrollArea className="max-h-[min(60vh,24rem)]">
            <div className="space-y-2 py-3 pr-3">
              {fillFormTypes.map(
              (row: {
                membershipTypeId: string;
                title: string;
                schemaVersion: string;
              }) => (
                <Button
                  key={row.membershipTypeId}
                  type="button"
                  variant={
                    pendingTypeId === row.membershipTypeId
                      ? 'default'
                      : 'outline'
                  }
                  className="w-full justify-start h-auto py-3"
                  onClick={() => setPendingTypeId(row.membershipTypeId)}
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
          </ScrollArea>

          <Dialog.Footer>
            <Button
              type="button"
              variant="outline"
              onClick={() => setChooserOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleContinueToForm}
              disabled={!pendingTypeId}
            >
              Continue
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog>

      <RegistrationFormSheet
        open={sheetOpen}
        onOpenChange={handleSheetOpenChange}
        membershipTypeId={selectedTypeId}
        summaryTitle={selectedTitle}
      />
    </MtoPageLayout>
  );
}
