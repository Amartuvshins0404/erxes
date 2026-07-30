import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Icon, IconArrowLeft } from '@tabler/icons-react';
import {
  FieldValues,
  SubmitHandler,
  UseFormReturn,
} from 'react-hook-form';
import { Breadcrumb, Button, Form, Separator } from 'erxes-ui';
import { PageHeader } from 'ui-modules';

interface ResourceFormLayoutProps<T extends FieldValues> {
  icon: Icon;
  /** Breadcrumb root label (plural, e.g. "Agents"). */
  title: string;
  /** Singular noun for the edit/new crumb (e.g. "Agent" → "Edit Agent"). */
  noun: string;
  rootPath: string;
  isEdit: boolean;
  saving: boolean;
  saveLabel: string;
  formId: string;
  submitDisabled?: boolean;
  form: UseFormReturn<T>;
  onSubmit: SubmitHandler<T>;
  /** Mobile-only sticky footer (cancel/save); omitted for forms that lack one. */
  mobileFooter?: boolean;
  /**
   * Rendered inside a host that already supplies its own PageHeader (e.g. the
   * agent detail Settings tab). Drops the full PageHeader — whose Sidebar.Trigger
   * would otherwise stack a second collapse control under the host's — and keeps
   * only a compact Save action bar.
   */
  embedded?: boolean;
  children: ReactNode;
}

// Shared create/edit shell: breadcrumb actions, scroll container, and form.
export const ResourceFormLayout = <T extends FieldValues>({
  icon: Icon,
  title,
  noun,
  rootPath,
  isEdit,
  saving,
  saveLabel,
  formId,
  submitDisabled,
  form,
  onSubmit,
  mobileFooter = false,
  embedded = false,
  children,
}: ResourceFormLayoutProps<T>) => (
  <div className="flex flex-col h-full">
    {embedded ? (
      <div className="flex items-center justify-end gap-2 px-3 pt-3">
        <Button
          type="submit"
          form={formId}
          disabled={saving || submitDisabled}
        >
          {saving ? 'Saving…' : saveLabel}
        </Button>
      </div>
    ) : (
    <PageHeader>
      <PageHeader.Start>
        <Breadcrumb>
          <Breadcrumb.List className="gap-1">
            <Breadcrumb.Item>
              <Button variant="ghost" asChild>
                <Link to={rootPath}>
                  <Icon />
                  {title}
                </Link>
              </Button>
            </Breadcrumb.Item>
            <Breadcrumb.Separator />
            <Breadcrumb.Item>
              <span className="text-muted-foreground">
                {isEdit ? `Edit ${noun}` : `New ${noun}`}
              </span>
            </Breadcrumb.Item>
          </Breadcrumb.List>
        </Breadcrumb>
        <Separator.Inline />
      </PageHeader.Start>
      <PageHeader.End>
        <Button variant="outline" asChild>
          <Link to={rootPath}>
            <IconArrowLeft /> Back
          </Link>
        </Button>
        <Button
          type="submit"
          form={formId}
          disabled={saving || submitDisabled}
        >
          {saving ? 'Saving…' : saveLabel}
        </Button>
      </PageHeader.End>
    </PageHeader>
    )}

    <div className="flex-1 overflow-auto p-4">
      <Form {...form}>
        <form
          id={formId}
          onSubmit={form.handleSubmit(onSubmit)}
          className="max-w-2xl mx-auto space-y-4"
        >
          {children}

          {mobileFooter && (
            <div className="flex gap-3 pb-4 sm:hidden">
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving…' : saveLabel}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link to={rootPath}>Cancel</Link>
              </Button>
            </div>
          )}
        </form>
      </Form>
    </div>
  </div>
);
