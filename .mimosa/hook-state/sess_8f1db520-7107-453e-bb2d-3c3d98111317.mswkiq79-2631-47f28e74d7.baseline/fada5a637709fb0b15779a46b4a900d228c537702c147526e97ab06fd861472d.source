import { IconSettings } from '@tabler/icons-react';
import { Button } from 'erxes-ui';
import { Link } from 'react-router-dom';

export function MtoOnboardingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
      <h1 className="text-2xl font-bold mb-2">Mto setup required</h1>
      <p className="text-muted-foreground max-w-md mb-6">
        Mto requires an Instance ID to run. You can set it from your
        organization ID in Settings (SAAS), or enter it manually (self-hosted).
        Complete setup to access Mto features.
      </p>
      <Button asChild>
        <Link to="/settings/mto">
          <IconSettings className="mr-2 size-4" />
          Go to Mto Settings
        </Link>
      </Button>
    </div>
  );
}
