import { Button, cn } from 'erxes-ui';
import { IconX } from '@tabler/icons-react';
import { useMessenger } from '../hooks/useMessenger';

export const HERO_ICON_BUTTON_CLASS =
  'size-8 flex-none rounded-full text-primary-foreground hover:bg-primary-foreground/15 hover:text-primary-foreground';

export const CloseButton = ({ className }: { className?: string }) => {
  const { closeWindow } = useMessenger();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={closeWindow}
      aria-label="Close messenger"
      className={cn(HERO_ICON_BUTTON_CLASS, className)}
    >
      <IconX />
    </Button>
  );
};
