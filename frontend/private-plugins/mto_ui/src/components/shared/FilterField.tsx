import { ReactNode } from 'react';

interface FilterFieldProps {
  label: string;
  children: ReactNode;
  optional?: boolean;
  className?: string;
}

export function FilterField({
  label,
  children,
  optional,
  className,
}: FilterFieldProps) {
  return (
    <div className={className}>
      <label className="mb-2 block text-sm font-medium">
        {label}
        {optional && (
          <span className="ml-1 text-muted-foreground">(optional)</span>
        )}
      </label>
      {children}
    </div>
  );
}
