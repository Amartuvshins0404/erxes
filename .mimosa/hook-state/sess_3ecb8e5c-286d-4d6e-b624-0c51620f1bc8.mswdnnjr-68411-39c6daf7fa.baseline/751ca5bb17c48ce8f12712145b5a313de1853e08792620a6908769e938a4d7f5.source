import { useQuery } from '@apollo/client';
import { Button, Label, Sheet, Spinner } from 'erxes-ui';
import { useEffect, useState } from 'react';
import { MTO_REGISTRATION_FORM_DEFINITION } from '@/registration/graphql/registrationQueries';
import { DynamicRegistrationForm } from '@/registration/components/DynamicRegistrationForm';
import { isFormDefinition } from '@/registration/utils/isFormDefinition';
import {
  ClientPortalUserSelect,
  IClientPortalUserRow,
} from '@/registration/components/ClientPortalUserSelect';
import { ClientPortalRemoteSelect } from '@/registration/components/ClientPortalRemoteSelect';

interface RegistrationFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  membershipTypeId: string | null;
  summaryTitle?: string;
  onSubmitted?: () => void;
}

export function RegistrationFormSheet({
  open,
  onOpenChange,
  membershipTypeId,
  summaryTitle,
  onSubmitted,
}: RegistrationFormSheetProps) {
  const [clientPortalRemoteId, setClientPortalRemoteId] = useState<
    string | undefined
  >();
  const [selectedCpUser, setSelectedCpUser] =
    useState<IClientPortalUserRow | null>(null);

  useEffect(() => {
    if (!open) {
      setSelectedCpUser(null);
      setClientPortalRemoteId(undefined);
    }
  }, [open]);

  useEffect(() => {
    setSelectedCpUser(null);
  }, [clientPortalRemoteId]);

  const { data, loading, error } = useQuery(MTO_REGISTRATION_FORM_DEFINITION, {
    variables: {
      membershipTypeId: membershipTypeId ?? '',
    },
    skip: !open || !membershipTypeId,
  });

  const raw = data?.mtoRegistrationFormDefinition;
  const definition = isFormDefinition(raw) ? raw : null;

  function handleSubmitted() {
    onOpenChange(false);
    onSubmitted?.();
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <Sheet.View className="sm:max-w-2xl lg:max-w-4xl w-full md:w-[min(56rem,calc(100vw-1rem))]">
        <Sheet.Header className="shrink-0">
          <div className="flex flex-col items-start gap-1 min-w-0 flex-1 pr-2">
            <Sheet.Title className="truncate w-full">
              {definition?.title ?? summaryTitle ?? 'Бүртгэлийн маягт'}
            </Sheet.Title>
            {definition?.description ? (
              <Sheet.Description className="line-clamp-2">
                {definition.description}
              </Sheet.Description>
            ) : null}
          </div>
          <Sheet.Close />
        </Sheet.Header>
        <Sheet.Content className="overflow-y-auto min-h-0 flex-1">
          <div className="p-5 pb-10">
            {!membershipTypeId ? (
              <p className="text-sm text-muted-foreground">Төрөл сонгоно уу.</p>
            ) : loading ? (
              <div className="flex justify-center py-16">
                <Spinner />
              </div>
            ) : error ? (
              <div className="space-y-3">
                <p className="text-destructive text-sm">{error.message}</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                >
                  Хаах
                </Button>
              </div>
            ) : !definition ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Маягт олдсонгүй.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                >
                  Хаах
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-4 mb-6 max-w-md">
                  <div className="space-y-2">
                    <Label>Client portal</Label>
                    <ClientPortalRemoteSelect
                      value={clientPortalRemoteId}
                      onValueChange={setClientPortalRemoteId}
                      placeholder="Портал сонгох"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Client portal user</Label>
                    <ClientPortalUserSelect
                      clientPortalIdFilter={clientPortalRemoteId}
                      value={selectedCpUser?._id}
                      onValueChange={setSelectedCpUser}
                      allowClear
                      placeholder="Сонгох (заавал биш)"
                    />
                  </div>
                </div>
                <DynamicRegistrationForm
                  definition={definition}
                  onSubmitted={handleSubmitted}
                  formClassName="max-w-full"
                  hideDescription
                  selectedCpUser={selectedCpUser}
                />
              </>
            )}
          </div>
        </Sheet.Content>
      </Sheet.View>
    </Sheet>
  );
}
