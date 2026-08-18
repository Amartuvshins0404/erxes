import { ReactNode } from 'react';

interface FilterFieldProps {
  label: string;
  children: ReactNode;
  optional?: boolean;
}

export function FilterField({ label, children, optional }: FilterFieldProps) {
  return (
    <div>
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
