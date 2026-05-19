import { IconPlus, IconX } from '@tabler/icons-react';
import { Button, Input } from 'erxes-ui';

export const UrlListField = ({
  value,
  onValueChange,
  placeholder = 'https://...',
  disabled,
}: {
  value?: string[];
  onValueChange: (next: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}) => {
  const items = value || [];

  const setItem = (index: number, next: string) => {
    const updated = items.slice();
    updated[index] = next;
    onValueChange(updated);
  };

  const remove = (index: number) => {
    onValueChange(items.filter((_, i) => i !== index));
  };

  const add = () => {
    onValueChange([...items, '']);
  };

  return (
    <div className="flex flex-col gap-2">
      {items.map((url, i) => (
        <div key={i} className="flex items-center gap-2">
          <Input
            value={url}
            onChange={(e) => setItem(i, e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground hover:text-destructive shrink-0"
            onClick={() => remove(i)}
            disabled={disabled}
          >
            <IconX className="size-4" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-2 self-start"
        onClick={add}
        disabled={disabled}
      >
        <IconPlus className="size-4" /> Add URL
      </Button>
    </div>
  );
};
