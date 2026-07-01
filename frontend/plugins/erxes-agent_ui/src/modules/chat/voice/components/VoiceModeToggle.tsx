import { IconMicrophone } from '@tabler/icons-react';
import { Button, Tooltip } from 'erxes-ui';

// The composer's entry point into hands-free voice mode. A low-key ghost mic
// button next to the reasoning control, always rendered: when voice is
// configured it toggles voice mode; when not, it shows dimmed-but-clickable
// and nudges the user to the voice settings page to set it up.

export const VoiceModeToggle = ({
  configured,
  active,
  onToggle,
  onConfigure,
  disabled,
}: {
  configured: boolean;
  active: boolean;
  onToggle: () => void;
  onConfigure: () => void;
  disabled?: boolean;
}) => {
  if (!configured) {
    return (
      <Tooltip.Provider>
        <Tooltip>
          <Tooltip.Trigger asChild>
            <Button
              size="icon"
              variant="ghost"
              aria-label="Set up voice"
              onClick={onConfigure}
              className="size-9 shrink-0 text-muted-foreground/50 opacity-60 transition-colors hover:text-foreground hover:opacity-100"
            >
              <IconMicrophone className="size-4" />
            </Button>
          </Tooltip.Trigger>
          <Tooltip.Content>Voice not set up — click to configure</Tooltip.Content>
        </Tooltip>
      </Tooltip.Provider>
    );
  }

  return (
    <Tooltip.Provider>
      <Tooltip>
        <Tooltip.Trigger asChild>
          <Button
            size="icon"
            variant="ghost"
            aria-label="Voice mode"
            aria-pressed={active}
            disabled={disabled}
            onClick={onToggle}
            className={`size-9 shrink-0 transition-colors hover:text-foreground ${
              active ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <IconMicrophone className="size-4" />
          </Button>
        </Tooltip.Trigger>
        <Tooltip.Content>
          {active ? 'Exit voice mode' : 'Start voice mode'}
        </Tooltip.Content>
      </Tooltip>
    </Tooltip.Provider>
  );
};
