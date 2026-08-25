import { IconEye, IconEyeOff } from '@tabler/icons-react';
import { Button, Input, cn } from 'erxes-ui';
import {
  forwardRef,
  useEffect,
  useState,
  type ComponentProps,
} from 'react';

type SecretInputProps = Omit<ComponentProps<typeof Input>, 'type'>;

// Mirrors core-ui's login password reveal: auto-hide after 10s so a revealed
// credential never lingers on screen.
const REVEAL_TIMEOUT_MS = 10_000;

// Password-style input with a reveal toggle so users can check a pasted
// credential before submitting. There is no shared erxes-ui component for
// this (core-ui composes it locally too), so the plugin keeps its own.
export const SecretInput = forwardRef<HTMLInputElement, SecretInputProps>(
  ({ className, disabled, ...props }, ref) => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
      if (!visible) return;
      const timer = setTimeout(() => setVisible(false), REVEAL_TIMEOUT_MS);
      return () => clearTimeout(timer);
    }, [visible]);

    return (
      <div className="relative">
        <Input
          ref={ref}
          {...props}
          disabled={disabled}
          type={visible ? 'text' : 'password'}
          className={cn('pr-8', className)}
        />
        <Button
          type="button"
          variant="ghost"
          disabled={disabled}
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? 'Hide credential' : 'Show credential'}
          title={visible ? 'Hide credential' : 'Show credential'}
          className="absolute inset-y-0 right-1 my-auto size-6 rounded-sm p-0 text-accent-foreground/60 hover:text-foreground"
        >
          {visible ? (
            <IconEyeOff size={15} stroke={1.75} />
          ) : (
            <IconEye size={15} stroke={1.75} />
          )}
        </Button>
      </div>
    );
  },
);

SecretInput.displayName = 'SecretInput';
