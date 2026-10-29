import { Button } from 'erxes-ui';

export const ContactWidgetRow = ({
  leading,
  title,
  meta,
  onClick,
}: {
  leading?: React.ReactNode;
  title: React.ReactNode;
  meta?: React.ReactNode;
  onClick?: () => void;
}) => (
  <Button
    variant="ghost"
    onClick={onClick}
    className="h-8 w-full min-w-0 justify-start gap-2 rounded-lg px-2 text-left font-normal"
  >
    {leading && (
      <span className="flex flex-none items-center text-muted-foreground">
        {leading}
      </span>
    )}
    <span className="min-w-0 flex-1 truncate">{title}</span>
    {meta && (
      <span className="flex flex-none items-center gap-1 text-xs text-muted-foreground">
        {meta}
      </span>
    )}
  </Button>
);
