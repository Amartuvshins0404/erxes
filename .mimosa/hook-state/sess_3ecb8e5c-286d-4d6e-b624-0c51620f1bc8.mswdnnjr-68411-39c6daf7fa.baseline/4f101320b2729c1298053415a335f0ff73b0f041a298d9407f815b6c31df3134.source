import { Alert } from 'erxes-ui';
import { getSubscriptionProviderOption } from '../llmProviders';

interface SubscriptionProviderGuideProps {
  provider?: string | null;
}

export const SubscriptionProviderGuide = ({
  provider,
}: SubscriptionProviderGuideProps) => {
  const option = getSubscriptionProviderOption(provider);

  return (
    <Alert>
      <Alert.Title>{option.guideTitle}</Alert.Title>
      <Alert.Description className="space-y-3">
        <p>{option.guideDescription}</p>
        <ol className="list-decimal space-y-1 pl-4">
          {option.guideSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <p>
          After connection, OpenClaw keeps the credential in this assistant’s
          private auth profile on persistent storage, so ordinary pod restarts
          do not require another sign-in.
        </p>
        <a
          href={option.guideUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex font-medium text-primary underline underline-offset-4"
        >
          Open the official OpenClaw setup guide
        </a>
      </Alert.Description>
    </Alert>
  );
};
