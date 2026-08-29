import { InfoCard, InfoCardContent } from '@/block/components/card';
import {
  useContractPaymentSettings,
  usePaymentMethods,
  useUpdateContractPaymentSettings,
} from '@/contract-payment/hooks/usePaymentSettings';
import { IconAlertTriangle } from '@tabler/icons-react';
import { Badge, Checkbox, Label, Spinner, Switch, toast } from 'erxes-ui';

const SettingsMessage = ({ children }: { children: React.ReactNode }) => (
  <p className="text-sm text-muted-foreground">{children}</p>
);

export const ContractPaymentSettings = ({
  projectId,
}: {
  projectId: string;
}) => {
  const { settings, loading, error } = useContractPaymentSettings(projectId);
  const {
    paymentMethods,
    loading: methodsLoading,
    error: methodsError,
  } = usePaymentMethods();
  const { updateContractPaymentSettings, loading: saving } =
    useUpdateContractPaymentSettings(projectId);

  const selectedIds = settings?.paymentIds || [];
  const allowPartial = settings?.allowPartial || false;
  // A project with no settings of its own reads the org-wide default; the first
  // save here writes a project-specific document.
  const inherited = !settings || settings.projectId !== projectId;

  // Both fields go on every save so that the first write for a project carries
  // the inherited value of whichever field was not being edited.
  const save = async (input: { paymentIds: string[]; allowPartial: boolean }) => {
    try {
      await updateContractPaymentSettings(input);

      toast({ title: 'Payment settings saved', variant: 'success' });
    } catch (e) {
      toast({
        title: 'Error',
        description: e instanceof Error ? e.message : 'Failed to save settings',
        variant: 'destructive',
      });
    }
  };

  const toggleMethod = (paymentId: string, checked: boolean) =>
    save({
      paymentIds: checked
        ? [...selectedIds, paymentId]
        : selectedIds.filter((id) => id !== paymentId),
      allowPartial,
    });

  const renderMethods = () => {
    if (methodsLoading) {
      return <Spinner containerClassName="py-6" />;
    }

    if (methodsError) {
      return <SettingsMessage>{methodsError.message}</SettingsMessage>;
    }

    if (!paymentMethods.length) {
      return (
        <SettingsMessage>
          No active payment method is configured yet. Add one (QPay, bank, ...)
          in the Payments settings first.
        </SettingsMessage>
      );
    }

    return (
      <div className="space-y-2">
        {paymentMethods.map((method) => (
          <Label
            key={method._id}
            className="flex items-center gap-3 rounded-md border p-3 font-normal cursor-pointer"
          >
            <Checkbox
              checked={selectedIds.includes(method._id)}
              disabled={saving}
              onCheckedChange={(checked) =>
                toggleMethod(method._id, checked === true)
              }
            />
            <span className="flex-1 font-medium">{method.name}</span>
            <Badge variant="secondary" className="uppercase">
              {method.kind}
            </Badge>
          </Label>
        ))}
      </div>
    );
  };

  if (loading) {
    return <Spinner containerClassName="py-12" />;
  }

  if (error) {
    return (
      <InfoCard title="ONLINE PAYMENT">
        <InfoCardContent>
          <SettingsMessage>{error.message}</SettingsMessage>
        </InfoCardContent>
      </InfoCard>
    );
  }

  return (
    <div className="space-y-6">
      <InfoCard
        title="ONLINE PAYMENT"
        description="Which payment methods a customer may use to pay this project's contract payments online."
      >
        <InfoCardContent className="space-y-4">
          {inherited && (
            <SettingsMessage>
              Using the organization-wide default. Changing anything here saves
              settings for this project only.
            </SettingsMessage>
          )}

          {!selectedIds.length && !methodsLoading && (
            <div className="flex items-center gap-2 text-sm text-warning">
              <IconAlertTriangle className="size-4 flex-none" />
              Online payment is off for this project until a method is selected.
            </div>
          )}

          {renderMethods()}
        </InfoCardContent>
      </InfoCard>

      <InfoCard title="PARTIAL PAYMENT">
        <InfoCardContent>
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <Label htmlFor="block-allow-partial">Allow partial payment</Label>
              <SettingsMessage>
                Off: a customer must settle a scheduled payment's full remaining
                amount. On: any amount up to the remainder is accepted.
              </SettingsMessage>
            </div>
            <Switch
              id="block-allow-partial"
              checked={allowPartial}
              disabled={saving}
              onCheckedChange={(checked) =>
                save({ paymentIds: selectedIds, allowPartial: checked })
              }
            />
          </div>
        </InfoCardContent>
      </InfoCard>
    </div>
  );
};
