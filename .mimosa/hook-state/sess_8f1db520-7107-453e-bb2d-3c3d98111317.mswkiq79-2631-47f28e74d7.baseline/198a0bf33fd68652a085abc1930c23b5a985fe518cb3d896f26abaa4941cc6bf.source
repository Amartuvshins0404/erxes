import { IconSettings } from '@tabler/icons-react';
import { Button } from 'erxes-ui';
import { Link } from 'react-router-dom';

export function OneFitOnboardingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
      <h1 className="text-2xl font-bold mb-2">OneFit setup required</h1>
      <p className="text-muted-foreground max-w-md mb-6">
        OneFit requires an Instance ID to run. You can set it from your
        organization ID in Settings (SAAS), or enter it manually (self-hosted).
        Complete setup to access Bookings, Customers, and other OneFit features.
      </p>
      <Button asChild>
        <Link to="/settings/onefit">
          <IconSettings className="mr-2 size-4" />
          Go to OneFit Settings
        </Link>
      </Button>
    </div>
  );
}
