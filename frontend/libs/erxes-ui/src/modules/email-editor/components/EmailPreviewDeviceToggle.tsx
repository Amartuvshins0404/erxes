import { IconDeviceDesktop, IconDeviceMobile } from '@tabler/icons-react';
import { Button, ToggleGroup } from 'erxes-ui/components';
import { cn } from 'erxes-ui/lib';
import { EmailPreviewDevice } from '../types';

/** Which width the rendered email is being read at. */
export const EmailPreviewDeviceToggle = ({
  value,
  onChange,
  className,
}: {
  value: EmailPreviewDevice;
  onChange: (device: EmailPreviewDevice) => void;
  className?: string;
}) => (
  <ToggleGroup
    type="single"
    value={value}
    onValueChange={(device) => device && onChange(device as EmailPreviewDevice)}
    className={cn('gap-0.5 rounded-full bg-muted p-0.5', className)}
  >
    <ToggleGroup.Item value="desktop" asChild>
      <Button
        variant="ghost"
        size="icon"
        className="rounded-full text-muted-foreground data-[state=on]:bg-card data-[state=on]:text-foreground data-[state=on]:shadow-xs"
        aria-label="Desktop preview"
      >
        <IconDeviceDesktop className="size-4" />
      </Button>
    </ToggleGroup.Item>
    <ToggleGroup.Item value="mobile" asChild>
      <Button
        variant="ghost"
        size="icon"
        className="rounded-full text-muted-foreground data-[state=on]:bg-card data-[state=on]:text-foreground data-[state=on]:shadow-xs"
        aria-label="Mobile preview"
      >
        <IconDeviceMobile className="size-4" />
      </Button>
    </ToggleGroup.Item>
  </ToggleGroup>
);
