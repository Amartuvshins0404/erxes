import {
  Button,
  Checkbox,
  Form,
  Input,
  Label,
  Select,
  Spinner,
  Textarea,
  cn,
} from 'erxes-ui';
import { useForm } from 'react-hook-form';
import { useEffect, useMemo } from 'react';
import { useMutation } from '@apollo/client';
import { toast } from 'erxes-ui';
import { MtoUpload } from '~/components/onefit-upload';
import { useUploadConfig } from '@/config/hooks/useUploadConfig';
import {
  MTO_REGISTRATION_APPLICATION_UPDATE,
  MTO_REGISTRATION_SUBMIT,
} from '@/registration/graphql/registrationMutations';
import {
  defaultValuesFromDefinition,
  mergeInitialAnswers,
} from '@/registration/utils/defaultValues';
import { isAnswerEmpty } from '@/registration/utils/isAnswerEmpty';
import {
  RegistrationField,
  RegistrationFormDefinition,
} from '@/registration/types/registrationForm';
import { IClientPortalUserRow } from '@/registration/components/ClientPortalUserSelect';

interface DynamicRegistrationFormProps {
  definition: RegistrationFormDefinition;
  onSubmitted?: () => void;
  /** Extra classes for the `<form>` (e.g. `max-w-full` in a Sheet). */
  formClassName?: string;
  /** Hide the top description block (e.g. when the Sheet header already shows it). */
  hideDescription?: boolean;
  /** Pre-fill field values (e.g. edit existing application). */
  initialAnswers?: Record<string, unknown>;
  /** When set, persist with update mutation instead of new submission. */
  editApplicationId?: string;
  /** Workflow status; required when `editApplicationId` is set. */
  registrationStatus?: string;
  /** Overrides default submit button label. */
  submitLabel?: string;
  /** When creating (no `editApplicationId`), optional linked client portal user (staff). */
  selectedCpUser?: IClientPortalUserRow | null;
}

function toggleInList(list: string[], value: string): string[] {
  if (list.includes(value)) return list.filter((x) => x !== value);
  return [...list, value];
}

function RegistrationFieldControl({
  field,
  uploadUrl,
  value,
  onChange,
}: {
  field: RegistrationField;
  uploadUrl: string;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const help = field.ui?.helpText ? (
    <p className="text-sm text-muted-foreground mt-1">{field.ui.helpText}</p>
  ) : null;

  switch (field.kind) {
    case 'text':
      return (
        <>
          <Input
            placeholder={field.ui?.placeholder}
            value={typeof value === 'string' ? value : ''}
            onChange={(e) => onChange(e.target.value)}
          />
          {help}
        </>
      );
    case 'textarea':
      return (
        <>
          <Textarea
            placeholder={field.ui?.placeholder}
            value={typeof value === 'string' ? value : ''}
            onChange={(e) => onChange(e.target.value)}
            rows={4}
          />
          {help}
        </>
      );
    case 'date':
      return (
        <>
          <Input
            type="date"
            value={typeof value === 'string' ? value : ''}
            onChange={(e) => onChange(e.target.value)}
          />
          {help}
        </>
      );
    case 'boolean':
      return (
        <div className="flex items-center gap-2">
          <Checkbox
            checked={value === true}
            onCheckedChange={(checked) => onChange(checked === true)}
          />
          {help}
        </div>
      );
    case 'select':
      return (
        <>
          <Select
            value={typeof value === 'string' && value ? value : undefined}
            onValueChange={onChange}
          >
            <Select.Trigger>
              <Select.Value placeholder={field.ui?.placeholder || 'Сонгох'} />
            </Select.Trigger>
            <Select.Content>
              {(field.options || []).map((opt) => (
                <Select.Item key={opt.value} value={opt.value}>
                  {opt.label}
                </Select.Item>
              ))}
            </Select.Content>
          </Select>
          {help}
        </>
      );
    case 'multiselect':
    case 'checkbox_group': {
      const list = Array.isArray(value)
        ? (value as unknown[]).filter((x): x is string => typeof x === 'string')
        : [];
      return (
        <div className="space-y-2 rounded-md border p-3">
          {(field.options || []).map((opt) => (
            <label
              key={opt.value}
              className="flex items-start gap-2 text-sm cursor-pointer"
            >
              <Checkbox
                checked={list.includes(opt.value)}
                onCheckedChange={() => {
                  onChange(toggleInList(list, opt.value));
                }}
              />
              <span>{opt.label}</span>
            </label>
          ))}
          {help}
        </div>
      );
    }
    case 'file': {
      const url = typeof value === 'string' ? value : '';
      return (
        <>
          <MtoUpload.Root
            value={url}
            onChange={(v) => onChange(typeof v.url === 'string' ? v.url : '')}
            uploadUrl={uploadUrl}
          >
            <div className="w-full border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center min-h-[120px]">
              {url ? (
                <p className="text-xs break-all text-center">{url}</p>
              ) : null}
              <MtoUpload.Button variant="outline" type="button">
                Файл оруулах
              </MtoUpload.Button>
            </div>
          </MtoUpload.Root>
          {help}
        </>
      );
    }
    case 'file_list': {
      const urls = Array.isArray(value)
        ? (value as unknown[]).filter((x): x is string => typeof x === 'string')
        : [];
      return (
        <div className="space-y-2">
          {urls.map((u, i) => (
            <div
              key={`${u}-${i}`}
              className="flex items-center gap-2 text-xs break-all"
            >
              <span className="flex-1">{u}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onChange(urls.filter((_, j) => j !== i))}
              >
                ×
              </Button>
            </div>
          ))}
          <MtoUpload.Root
            value=""
            onChange={(v) => {
              const next = typeof v.url === 'string' ? v.url : '';
              if (next) onChange([...urls, next]);
            }}
            uploadUrl={uploadUrl}
          >
            <MtoUpload.Button variant="outline" type="button" size="sm">
              Файл нэмэх
            </MtoUpload.Button>
          </MtoUpload.Root>
          {help}
        </div>
      );
    }
    default:
      return null;
  }
}

export function DynamicRegistrationForm({
  definition,
  onSubmitted,
  formClassName,
  hideDescription,
  initialAnswers,
  editApplicationId,
  registrationStatus,
  submitLabel,
  selectedCpUser,
}: DynamicRegistrationFormProps) {
  const { uploadUrl } = useUploadConfig();
  const form = useForm<Record<string, unknown>>({
    defaultValues: {},
  });

  const answersKey = useMemo(
    () => (initialAnswers ? JSON.stringify(initialAnswers) : ''),
    [initialAnswers],
  );

  useEffect(() => {
    if (editApplicationId) {
      form.reset(mergeInitialAnswers(definition, initialAnswers ?? {}));
    } else {
      form.reset(defaultValuesFromDefinition(definition));
    }
  }, [definition, form, editApplicationId, answersKey]);

  const [submitMutation, { loading: createLoading }] = useMutation(
    MTO_REGISTRATION_SUBMIT,
  );
  const [updateMutation, { loading: updateLoading }] = useMutation(
    MTO_REGISTRATION_APPLICATION_UPDATE,
  );

  const loading = editApplicationId ? updateLoading : createLoading;

  async function onSubmit(values: Record<string, unknown>) {
    for (const section of definition.sections) {
      for (const field of section.fields) {
        if (!field.required) continue;
        if (isAnswerEmpty(field, values[field.id])) {
          toast({
            title: 'Алдаа',
            description: `Заавал талбар: ${field.label}`,
            variant: 'destructive',
          });
          return;
        }
      }
    }

    try {
      if (editApplicationId) {
        await updateMutation({
          variables: {
            _id: editApplicationId,
            answers: values,
            status: registrationStatus,
          },
        });
        toast({
          title: 'Амжилттай',
          description: 'Өөрчлөлт хадгалагдлаа',
        });
      } else {
        await submitMutation({
          variables: {
            membershipTypeId: definition.membershipTypeId,
            schemaVersion: definition.schemaVersion,
            answers: values,
            ...(selectedCpUser
              ? {
                  cpUserId: selectedCpUser._id,
                }
              : {}),
          },
        });
        toast({
          title: 'Амжилттай',
          description: 'Бүртгэл амжилттай илгээгдлээ',
        });
      }
      onSubmitted?.();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Илгээхэд алдаа гарлаа';
      toast({
        title: 'Алдаа',
        description: message,
        variant: 'destructive',
      });
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn('space-y-8', formClassName ?? 'max-w-3xl')}
      >
        {!hideDescription && definition.description ? (
          <p className="text-sm text-muted-foreground">
            {definition.description}
          </p>
        ) : null}

        {definition.sections.map((section) => (
          <section key={section.id} className="space-y-4">
            {section.title ? (
              <h3 className="text-lg font-semibold border-b pb-2">
                {section.title}
              </h3>
            ) : null}
            {section.description ? (
              <p className="text-sm text-muted-foreground">
                {section.description}
              </p>
            ) : null}

            <div className="space-y-6">
              {section.fields.map((field) => (
                <Form.Field
                  key={field.id}
                  control={form.control}
                  name={field.id}
                  render={({ field: f }) => (
                    <Form.Item>
                      <Label>
                        {field.label}
                        {field.required ? (
                          <span className="text-destructive ml-0.5">*</span>
                        ) : null}
                      </Label>
                      <RegistrationFieldControl
                        field={field}
                        uploadUrl={uploadUrl}
                        value={f.value}
                        onChange={f.onChange}
                      />
                      <Form.Message />
                    </Form.Item>
                  )}
                />
              ))}
            </div>
          </section>
        ))}

        <div className="flex justify-end gap-2 pt-4">
          <Button type="submit" disabled={loading}>
            <Spinner show={loading} />
            {submitLabel ?? (editApplicationId ? 'Хадгалах' : 'Илгээх')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
