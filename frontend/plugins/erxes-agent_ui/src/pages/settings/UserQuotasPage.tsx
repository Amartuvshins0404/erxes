import { useState } from 'react';
import { useLazyQuery, useMutation, useQuery } from '@apollo/client';
import { IconCheck } from '@tabler/icons-react';
import { Button, Form, toast } from 'erxes-ui';
import { ClampedNumberInput } from '~/components/ClampedNumberInput';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { SelectMemberFormItem } from 'ui-modules';
import { MASTRA_USER_AGENT_QUOTA, MASTRA_SETTINGS } from '~/graphql/queries';
import { MASTRA_USER_AGENT_QUOTA_SET } from '~/graphql/mutations';
import { toastError } from '~/lib/mutationToast';
import {
  IUserAgentQuotaResponse,
  ISettingsResponse,
} from './types';

const quotaFormSchema = z.object({
  userId: z.string().min(1, 'Select a user'),
  quota: z.number().int().min(0).nullable(),
});

type QuotaFormValues = z.infer<typeof quotaFormSchema>;

export const UserQuotasPage = () => {
  const [saved, setSaved] = useState(false);

  const { data: settingsData } = useQuery<ISettingsResponse>(MASTRA_SETTINGS);
  const defaultQuota = settingsData?.mastraSettings?.defaultAgentQuota ?? 0;

  const form = useForm<QuotaFormValues>({
    resolver: zodResolver(quotaFormSchema),
    defaultValues: { userId: '', quota: null },
  });

  const [fetchUserQuota] = useLazyQuery<IUserAgentQuotaResponse>(
    MASTRA_USER_AGENT_QUOTA,
    {
      onCompleted: (data) => {
        const q = data?.mastraUserAgentQuota?.agentQuota;
        form.setValue('quota', q ?? null);
      },
    },
  );

  const [setQuota, { loading: saving }] = useMutation(MASTRA_USER_AGENT_QUOTA_SET, {
    onCompleted: () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      toast({ title: 'Quota saved' });
    },
    onError: toastError(),
  });

  const handleUserChange = (userId: string | null) => {
    form.setValue('quota', null);
    if (userId) fetchUserQuota({ variables: { userId } });
  };

  const onSubmit = (values: QuotaFormValues) => {
    if (!values.userId) return;
    setQuota({
      variables: {
        userId: values.userId,
        quota: values.quota && values.quota > 0 ? values.quota : null,
      },
    });
  };

  const userId = form.watch('userId');

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6 max-w-xl space-y-8">
        <div>
          <h1 className="text-2xl font-bold">User Agent Quotas</h1>
          <p className="text-muted-foreground mt-1">
            Set per-user agent creation limits. Overrides the default quota for
            the selected user. Admins are always exempt from quotas.
          </p>
        </div>

        <div className="rounded-lg border bg-muted/50 px-4 py-3 text-sm">
          Default quota:{' '}
          <span className="font-semibold">
            {defaultQuota === 0 ? 'Unlimited' : defaultQuota}
          </span>
          <span className="text-muted-foreground ml-1">
            (configured in General Settings)
          </span>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <Form.Field
              control={form.control}
              name="userId"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>User</Form.Label>
                  <SelectMemberFormItem
                    mode="single"
                    value={userId || undefined}
                    onValueChange={(v) => {
                      const id = typeof v === 'string' ? v : '';
                      field.onChange(id);
                      handleUserChange(id || null);
                    }}
                    placeholder="Select a team member…"
                  />
                  <Form.Message />
                </Form.Item>
              )}
            />

            {userId && (
              <Form.Field
                control={form.control}
                name="quota"
                render={({ field }) => (
                  <Form.Item>
                    <Form.Label>Custom limit</Form.Label>
                    <Form.Control>
                      <ClampedNumberInput
                        field={{
                          ...field,
                          value: field.value ?? 0,
                          onChange: (v: number) => field.onChange(v === 0 ? null : v),
                        }}
                        min={0}
                        max={10000}
                        fallback={0}
                        className="w-32"
                      />
                    </Form.Control>
                    <Form.Description>
                      Leave blank or set to 0 to clear the override and use the
                      default. Existing agents are never deleted when the limit
                      is lowered.
                    </Form.Description>
                    <Form.Message />
                  </Form.Item>
                )}
              />
            )}

            {userId && (
              <Button type="submit" disabled={saving}>
                {saved ? (
                  <>
                    <IconCheck size={16} /> Saved
                  </>
                ) : saving ? (
                  'Saving…'
                ) : (
                  'Save Quota'
                )}
              </Button>
            )}
          </form>
        </Form>
      </div>
    </div>
  );
};
