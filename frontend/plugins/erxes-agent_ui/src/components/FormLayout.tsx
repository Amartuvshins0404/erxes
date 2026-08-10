import { cloneElement, isValidElement, useId } from 'react';
import { Card, Label } from 'erxes-ui';

// Shared scaffolding for plugin create/edit pages.

/** Card wrapper for one group of related form fields. */
export const FormSection = ({
  title,
  description,
  step,
  children,
}: {
  title: string;
  description?: string;
  step?: number;
  children: React.ReactNode;
}) => (
  <Card className="overflow-hidden shadow-none">
    <Card.Header className="border-b bg-muted/20 pb-4">
      <div className="flex items-start gap-3">
        {step !== undefined && (
          <span
            aria-hidden
            className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground"
          >
            {step}
          </span>
        )}
        <div className="min-w-0 space-y-1">
          <Card.Title className="text-base">{title}</Card.Title>
          {description && <Card.Description>{description}</Card.Description>}
        </div>
      </div>
    </Card.Header>
    <Card.Content className="space-y-5 pt-5">{children}</Card.Content>
  </Card>
);

/**
 * Labeled form control with an optional hint line. A single element child is
 * bound to the label: it gets an auto-generated id (its own id wins when set)
 * and the label's htmlFor points at it, so screen readers and label clicks
 * reach the control.
 */
export const Field = ({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) => {
  const autoId = useId();
  let control = children;
  let htmlFor: string | undefined;
  if (isValidElement<{ id?: string }>(children)) {
    htmlFor = children.props.id ?? autoId;
    control = cloneElement(children, { id: htmlFor });
  }
  return (
    <div className="space-y-1.5">
      <Label className="font-medium" htmlFor={htmlFor}>
        {label}
      </Label>
      {control}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
};
