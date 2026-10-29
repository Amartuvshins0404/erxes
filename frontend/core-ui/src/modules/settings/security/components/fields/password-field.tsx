import { IconEye, IconEyeOff } from '@tabler/icons-react';
import { Button, Input } from 'erxes-ui';
import { ComponentProps, useState } from 'react';

export const PasswordInput = (
  props: Omit<ComponentProps<typeof Input>, 'type'>,
) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative">
      <Input
        {...props}
        type={isVisible ? 'text' : 'password'}
        className="pr-9"
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        tabIndex={-1}
        className="absolute inset-y-0 end-0 h-full w-9 text-muted-foreground"
        onClick={() => setIsVisible((prev) => !prev)}
        aria-label={isVisible ? 'Hide password' : 'Show password'}
        aria-pressed={isVisible}
      >
        {isVisible ? <IconEyeOff size={16} /> : <IconEye size={16} />}
      </Button>
    </div>
  );
};
