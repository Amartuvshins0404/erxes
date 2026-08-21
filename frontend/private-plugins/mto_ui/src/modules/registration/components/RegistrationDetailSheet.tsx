import { useMutation, useQuery } from '@apollo/client';
import {
  Badge,
  Button,
  FocusSheet,
  Label,
  ScrollArea,
  Select,
  Sheet,
  Spinner,
  toast,
  useConfirm,
} from 'erxes-ui';
import { useAtom } from 'jotai';
import { useEffect, useMemo, useState } from 'react';
import { DynamicRegistrationForm } from '@/registration/components/DynamicRegistrationForm';
import {
  ClientPortalUserSelect,
  IClientPortalUserRow,
} from '@/registration/components/ClientPortalUserSelect';
import { ClientPortalRemoteSelect } from '@/registration/components/ClientPortalRemoteSelect';
import {
  MTO_REGISTRATION_APPLICATION_PAYMENT_URL,
  MTO_REGISTRATION_APPLICATION_REMOVE,
  MTO_REGISTRATION_APPLICATION_UPDATE,
  MTO_REGISTRATION_APPLICATION_VERIFY_MANUAL_PAYMENT,
} from '@/registration/graphql/registrationMutations';
import {
  MTO_REGISTRATION_APPLICATION,
  MTO_REGISTRATION_FORM_DEFINITION,
} from '@/registration/graphql/registrationQueries';
import { registrationDetailSheetState } from '@/registration/states/registrationDetailSheetState';
import { isFormDefinition } from '@/registration/utils/isFormDefinition';

const STATUS_OPTIONS = [
  { value: 'draft', label: 'draft' },
  { value: 'submitted', label: 'submitted' },
  { value: 'under_review', label: 'under_review' },
  { value: 'approved', label: 'approved' },
  { value: 'rejected', label: 'rejected' },
];

function paymentStatusBadgeVariant(
  paymentStatus?: string | null,
): 'success' | 'warning' | 'secondary' {
  if (paymentStatus === 'paid' || paymentStatus === 'manual_verified') {
    return 'success';
  }
  if (paymentStatus === 'unpaid') {
    return 'warning';
  }
  return 'secondary';
}

function hasManualPaymentProof(answers: Record<string, unknown>): boolean {
  const proof = answers.doc_membership_fee;
  if (proof === null || proof === undefined) return false;
  if (typeof proof === 'string') return proof.trim().length > 0;
  if (Array.isArray(proof)) return proof.length > 0;
  if (typeof proof === 'object') {
    return Object.keys(proof as object).length > 0;
  }
  return true;
}

interface RegistrationDetailSheetProps {
  onSaved?: () => void;
  hideArchive?: boolean;
}

export function RegistrationDetailSheet({
  onSaved,
  hideArchive,
}: RegistrationDetailSheetProps) {
  const [applicationId, setApplicationId] = useAtom(
    registrationDetailSheetState,
  );
  const open = Boolean(applicationId);
  const { confirm } = useConfirm();

  const { data, loading, error, refetch } = useQuery(
    MTO_REGISTRATION_APPLICATION,
    {
      variables: { _id: applicationId ?? '' },
      skip: !open || !applicationId,
    },
  );

  const [updateCpLink, { loading: cpLinkSaving }] = useMutation(
    MTO_REGISTRATION_APPLICATION_UPDATE,
  );
  const [verifyManualPayment, { loading: verifyManualLoading }] = useMutation(
    MTO_REGISTRATION_APPLICATION_VERIFY_MANUAL_PAYMENT,
  );
  const [getPaymentUrl, { loading: paymentUrlLoading }] = useMutation(
    MTO_REGISTRATION_APPLICATION_PAYMENT_URL,
  );
  const [removeApplication, { loading: removeLoading }] = useMutation(
    MTO_REGISTRATION_APPLICATION_REMOVE,
  );

  const row = data?.mtoRegistrationApplication;
  const [status, setStatus] = useState<string>('submitted');
  const [portalRemoteId, setPortalRemoteId] = useState<string | undefined>();

  useEffect(() => {
    if (row?.status) setStatus(row.status);
  }, [row?.status, row?._id]);

  useEffect(() => {
    setPortalRemoteId(undefined);
  }, [row?._id]);

  const { data: defData, loading: defLoading } = useQuery(
    MTO_REGISTRATION_FORM_DEFINITION,
    {
      variables: {
        membershipTypeId: row?.membershipTypeId ?? '',
        version: row?.schemaVersion,
      },
      skip: !open || !row?.membershipTypeId,
    },
  );

  const definition = useMemo(() => {
    const raw = defData?.mtoRegistrationFormDefinition;
    return isFormDefinition(raw) ? raw : null;
  }, [defData?.mtoRegistrationFormDefinition]);

  const initialAnswers = useMemo(() => {
    const a = row?.answers;
    if (a && typeof a === 'object' && !Array.isArray(a)) {
      return a as Record<string, unknown>;
    }
    return {};
  }, [row?.answers, row?.modifiedAt]);

  async function handleCpUserChange(user: IClientPortalUserRow | null) {
    if (!applicationId) return;
    await updateCpLink({
      variables: { _id: applicationId, cpUserId: user?._id ?? null },
    });
    await refetch();
    onSaved?.();
  }

  async function handleVerifyManualPayment() {
    if (!applicationId) return;
    try {
      await verifyManualPayment({ variables: { _id: applicationId } });
      await refetch();
      onSaved?.();
      toast({
        title: 'Амжилттай',
        description: 'Гараар төлсөн төлбөр баталгаажлаа',
      });
    } catch (e: unknown) {
      toast({
        title: 'Алдаа',
        description:
          e instanceof Error ? e.message : 'Баталгаажуулахад алдаа гарлаа',
        variant: 'destructive',
      });
    }
  }

  async function handleCopyPaymentLink() {
    if (!applicationId) return;
    try {
      const result = await getPaymentUrl({ variables: { _id: applicationId } });
      const url = result.data?.mtoRegistrationApplicationPaymentUrl as
        | string
        | undefined;
      if (!url) throw new Error('Төлбөрийн холбоос олдсонгүй');
      await navigator.clipboard.writeText(url);
      toast({
        title: 'Хуулсан',
        description: 'Төлбөрийн холбоос хуулбарлагдлаа',
      });
    } catch (e: unknown) {
      toast({
        title: 'Алдаа',
        description:
          e instanceof Error ? e.message : 'Холбоос авахад алдаа гарлаа',
        variant: 'destructive',
      });
    }
  }

  function handleRemove() {
    if (!applicationId) return;
    void confirm({
      message: 'Та энэ бүртгэлийг архивлахдаа итгэлтэй байна уу?',
      options: { confirmationValue: 'archive' },
    }).then(async () => {
      try {
        await removeApplication({ variables: { _id: applicationId } });
        setApplicationId(null);
        onSaved?.();
        toast({
          title: 'Амжилттай',
          description: 'Бүртгэл архивлагдлаа',
        });
      } catch (e: unknown) {
        toast({
          title: 'Алдаа',
          description:
            e instanceof Error ? e.message : 'Архивлахад алдаа гарлаа',
          variant: 'destructive',
        });
      }
    });
  }

  const paymentStatus = row?.paymentStatus as string | undefined;
  const invoiceStatus = (row?.invoice as { status?: string } | null | undefined)
    ?.status;
  const showManualVerify =
    row &&
    paymentStatus !== 'paid' &&
    paymentStatus !== 'manual_verified' &&
    hasManualPaymentProof(initialAnswers);
  const showPaymentLink =
    row &&
    Boolean(row.invoiceId) &&
    paymentStatus !== 'paid' &&
    paymentStatus !== 'manual_verified';
  const showApprovePaymentNote =
    status === 'approved' &&
    paymentStatus !== 'paid' &&
    paymentStatus !== 'manual_verified';

  return (
    <FocusSheet
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) setApplicationId(null);
      }}
    >
      <FocusSheet.View className="sm:w-full sm:max-w-4xl">
        <FocusSheet.Header
          title={row?.membershipTypeTitle ?? 'Бүртгэлийн дэлгэрэнгүй'}
        />
        <FocusSheet.Content className="flex flex-auto overflow-hidden">
          <ScrollArea className="flex-auto h-full">
            <div className="p-4 flex flex-col gap-6">
              {loading ? (
                <Spinner />
              ) : error ? (
                <p className="text-destructive text-sm">{error.message}</p>
              ) : !row ? (
                <p className="text-muted-foreground text-sm">Олдсонгүй.</p>
              ) : defLoading ? (
                <Spinner />
              ) : !definition ? (
                <p className="text-muted-foreground text-sm">
                  Маягтын тодорхойлолт олдсонгүй.
                </p>
              ) : (
                <>
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div>
                      <dt className="text-muted-foreground">Schema</dt>
                      <dd className="font-mono text-xs">{row.schemaVersion}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Subdomain</dt>
                      <dd className="font-mono text-xs">{row.subdomain}</dd>
                    </div>
                    {row.instanceId ? (
                      <div className="sm:col-span-2">
                        <dt className="text-muted-foreground">Instance</dt>
                        <dd className="font-mono text-xs break-all">
                          {row.instanceId}
                        </dd>
                      </div>
                    ) : null}
                  </dl>

                  <div className="space-y-4 max-w-md">
                    <div className="space-y-2">
                      <Label>Client portal</Label>
                      <ClientPortalRemoteSelect
                        value={portalRemoteId}
                        onValueChange={setPortalRemoteId}
                        placeholder="Портал сонгох"
                        disabled={cpLinkSaving}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Client portal user</Label>
                      <ClientPortalUserSelect
                        clientPortalIdFilter={portalRemoteId}
                        value={row.cpUserId}
                        onValueChange={(user) => {
                          void handleCpUserChange(user);
                        }}
                        disabled={cpLinkSaving}
                        allowClear
                      />
                    </div>
                  </div>

                  <div className="space-y-2 max-w-xs">
                    <Label>Төлөв</Label>
                    <Select value={status} onValueChange={setStatus}>
                      <Select.Trigger>
                        <Select.Value placeholder="Төлөв" />
                      </Select.Trigger>
                      <Select.Content>
                        {STATUS_OPTIONS.map((o) => (
                          <Select.Item key={o.value} value={o.value}>
                            {o.label}
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select>
                  </div>

                  <div className="space-y-3 rounded-md border p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Label className="mb-0">Төлбөрийн төлөв</Label>
                      <Badge
                        variant={paymentStatusBadgeVariant(paymentStatus)}
                        className="capitalize"
                      >
                        {paymentStatus ?? 'unpaid'}
                      </Badge>
                      {row.membershipFeeAmount ? (
                        <span className="text-sm text-muted-foreground">
                          {row.membershipFeeAmount.toLocaleString()} ₮
                        </span>
                      ) : null}
                    </div>
                    {invoiceStatus ? (
                      <p className="text-sm text-muted-foreground">
                        Нэхэмжлэх:{' '}
                        <span className="capitalize font-medium text-foreground">
                          {invoiceStatus}
                        </span>
                      </p>
                    ) : null}
                    {showApprovePaymentNote ? (
                      <p className="text-sm text-muted-foreground">
                        Баталгаажуулахад онлайн нэхэмжлэх үүснэ (гараар
                        баталгаажуулаагүй бол).
                      </p>
                    ) : null}
                    <div className="flex flex-wrap gap-2">
                      {showManualVerify ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={verifyManualLoading}
                          onClick={() => void handleVerifyManualPayment()}
                        >
                          Гараар төлсөн баталгаажуулах
                        </Button>
                      ) : null}
                      {showPaymentLink ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={paymentUrlLoading}
                          onClick={() => void handleCopyPaymentLink()}
                        >
                          Төлбөрийн холбоос хуулах
                        </Button>
                      ) : null}
                    </div>
                  </div>

                  <DynamicRegistrationForm
                    definition={definition}
                    editApplicationId={applicationId!}
                    initialAnswers={initialAnswers}
                    registrationStatus={status}
                    formClassName="max-w-full"
                    hideDescription
                    onSubmitted={async () => {
                      await refetch();
                      onSaved?.();
                    }}
                  />
                </>
              )}
            </div>
          </ScrollArea>
        </FocusSheet.Content>
        <Sheet.Footer className="flex-none gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setApplicationId(null)}
          >
            Хаах
          </Button>
          {!hideArchive && row && !row.archivedAt ? (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={removeLoading}
              onClick={handleRemove}
            >
              Архивлах
            </Button>
          ) : null}
        </Sheet.Footer>
      </FocusSheet.View>
    </FocusSheet>
  );
}
