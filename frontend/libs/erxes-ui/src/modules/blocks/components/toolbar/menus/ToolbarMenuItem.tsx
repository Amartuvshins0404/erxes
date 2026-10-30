import type { ToolbarMenuItemProps } from 'erxes-ui/modules/blocks/types/toolbar/ToolbarMenuItemProps';
import { components } from '@blocknote/shadcn';
import { cn } from 'erxes-ui/lib';
import { DropdownMenu } from 'erxes-ui/components';

export const ToolbarMenuItem = ({
  className,
  disabled,
  ...props
}: ToolbarMenuItemProps) => {
  const itemClassName = cn(
    'rounded-lg! pl-2! [&>.bn-absolute]:hidden!',
    'hover:bg-accent! hover:text-foreground!',
    'focus:bg-accent! focus:text-foreground!',
    'data-[state=checked]:bg-primary/10! data-[state=checked]:text-primary!',
    className,
  );

  if (disabled) {
    return (
      <DropdownMenu.Item
        disabled
        className={itemClassName}
        role={props.checked === undefined ? 'menuitem' : 'menuitemcheckbox'}
        aria-checked={props.checked}
      >
        {props.icon}
        {props.children}
      </DropdownMenu.Item>
    );
  }

  return <components.Generic.Menu.Item {...props} className={itemClassName} />;
};
