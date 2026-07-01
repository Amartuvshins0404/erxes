export const Row = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div className="flex items-baseline gap-3 py-1">
    <div className="w-24 text-muted-foreground text-xs uppercase tracking-wide shrink-0">
      {label}
    </div>
    <div className="flex-1 min-w-0 font-medium break-words">{children}</div>
  </div>
);
