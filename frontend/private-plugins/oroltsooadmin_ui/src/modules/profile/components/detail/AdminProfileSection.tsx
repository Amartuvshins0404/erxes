import { ReactNode } from 'react';

export const AdminProfileSection = ({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) => (
  <section className="rounded-lg border bg-card p-6">
    <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
      {title}
    </h2>
    <div className="flex flex-col gap-5">{children}</div>
  </section>
);

export const AdminProfileTextBlock = ({
  label,
  value,
}: {
  label: string;
  value?: string;
}) => (
  <div>
    <div className="text-sm font-medium">{label}</div>
    {value ? (
      <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">
        {value}
      </p>
    ) : (
      <p className="mt-1 text-sm italic text-muted-foreground">
        Мэдээлэл оруулаагүй байна.
      </p>
    )}
  </div>
);
