import { IconCheck, IconCopy, IconLinkOff } from '@tabler/icons-react';
import { Button, Empty, InfoCard, toast } from 'erxes-ui';
import { useState } from 'react';
import { useAgencyDetail } from '../hooks/useAgencyDetail';
import { AgencyDetailField } from './AgencyDetailField';

const buildMessengerScript = (
  messengerIntegrationId: string,
  widgetBundleUrl: string,
) => `<script>
  window.erxesSettings = {
    messenger: {
      integrationId: '${messengerIntegrationId}',
    },
  };

  (function () {
    const script = document.createElement("script");
    script.src = "${widgetBundleUrl}";
    script.async = true;
    const entry = document.getElementsByTagName("script")[0];
    entry.parentNode.insertBefore(script, entry);
  })();
</script>`;

export const AgencyDetailIntegrations = () => {
  const { agency } = useAgencyDetail();
  const [copied, setCopied] = useState(false);

  const { messengerIntegrationId, widgetBundleUrl } = agency ?? {};

  if (!messengerIntegrationId || !widgetBundleUrl) {
    return (
      <div className="flex flex-col gap-6 p-8">
        <InfoCard
          title="Frontline integration"
          description="The erxes messenger widget connected to this agency"
        >
          <InfoCard.Content>
            <Empty>
              <Empty.Content>
                <Empty.Header>
                  <Empty.Media>
                    <IconLinkOff />
                  </Empty.Media>
                  <Empty.Title>
                    Erxes messenger integration has not been deployed.
                  </Empty.Title>
                  <Empty.Description>
                    The erxes messenger integration is not configured for this
                    agency.
                  </Empty.Description>
                </Empty.Header>
              </Empty.Content>
            </Empty>
          </InfoCard.Content>
        </InfoCard>
      </div>
    );
  }

  const script = buildMessengerScript(messengerIntegrationId, widgetBundleUrl);

  const handleCopy = () => {
    navigator.clipboard
      .writeText(script)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      })
      .catch(() => {
        toast({
          title: 'Failed to copy script',
          description: 'Please try again.',
          variant: 'destructive',
        });
      });
  };

  return (
    <div className="flex flex-col gap-6 p-8">
      <InfoCard
        title="Frontline integration"
        description="The erxes messenger widget connected to this agency"
      >
        <InfoCard.Content className="gap-6">
          <div className="grid grid-cols-2 gap-6">
            <AgencyDetailField
              label="Integration ID"
              value={messengerIntegrationId}
            />
            <AgencyDetailField
              label="Widget bundle URL"
              value={widgetBundleUrl}
            />
          </div>

          <div className="relative">
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm font-mono">
              <code>{script}</code>
            </pre>
            <Button
              size="sm"
              variant="secondary"
              className="absolute top-2 right-2"
              onClick={handleCopy}
            >
              {copied ? (
                <>
                  <IconCheck className="size-4" />
                  Copied
                </>
              ) : (
                <>
                  <IconCopy className="size-4" />
                  Copy
                </>
              )}
            </Button>
          </div>
        </InfoCard.Content>
      </InfoCard>
    </div>
  );
};
