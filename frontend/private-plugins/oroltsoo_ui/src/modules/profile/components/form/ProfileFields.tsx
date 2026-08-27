import { DatePicker, Form, Input, Select, Textarea } from 'erxes-ui';
import { Control, FieldPathByValue } from 'react-hook-form';

import { ProfileFormValues } from '../../constants/profileFormSchema';

type ProfileControl = Control<ProfileFormValues>;

type StringFieldName = FieldPathByValue<ProfileFormValues, string>;
type DateFieldName = FieldPathByValue<ProfileFormValues, Date | null>;
type NumberFieldName = FieldPathByValue<ProfileFormValues, number>;
type OptionalNumberFieldName = FieldPathByValue<
  ProfileFormValues,
  number | null
>;

export const ProfileTextField = ({
  control,
  name,
  label,
  placeholder,
  description,
}: {
  control: ProfileControl;
  name: StringFieldName;
  label: string;
  placeholder?: string;
  description?: string;
}) => (
  <Form.Field
    control={control}
    name={name}
    render={({ field }) => (
      <Form.Item>
        <Form.Label>{label}</Form.Label>
        <Form.Control>
          <Input {...field} placeholder={placeholder} />
        </Form.Control>
        {description && <Form.Description>{description}</Form.Description>}
        <Form.Message />
      </Form.Item>
    )}
  />
);

export const ProfileTextareaField = ({
  control,
  name,
  label,
  placeholder,
  description,
  rows = 5,
}: {
  control: ProfileControl;
  name: StringFieldName;
  label: string;
  placeholder?: string;
  description?: string;
  rows?: number;
}) => (
  <Form.Field
    control={control}
    name={name}
    render={({ field }) => (
      <Form.Item>
        <Form.Label>{label}</Form.Label>
        <Form.Control>
          <Textarea {...field} rows={rows} placeholder={placeholder} />
        </Form.Control>
        {description && <Form.Description>{description}</Form.Description>}
        <Form.Message />
      </Form.Item>
    )}
  />
);

export const ProfileDateField = ({
  control,
  name,
  label,
  placeholder = 'Огноо сонгох',
}: {
  control: ProfileControl;
  name: DateFieldName;
  label: string;
  placeholder?: string;
}) => (
  <Form.Field
    control={control}
    name={name}
    render={({ field }) => (
      <Form.Item>
        <Form.Label>{label}</Form.Label>
        <Form.Control>
          <DatePicker
            value={field.value ?? undefined}
            onChange={(date) => field.onChange(date instanceof Date ? date : null)}
            placeholder={placeholder}
            className="w-full"
          />
        </Form.Control>
        <Form.Message />
      </Form.Item>
    )}
  />
);

export const ProfileSelectField = ({
  control,
  name,
  label,
  options,
  placeholder = 'Сонгох',
}: {
  control: ProfileControl;
  name: StringFieldName;
  label: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}) => (
  <Form.Field
    control={control}
    name={name}
    render={({ field }) => (
      <Form.Item>
        <Form.Label>{label}</Form.Label>
        <Select value={field.value} onValueChange={field.onChange}>
          <Form.Control>
            <Select.Trigger>
              <Select.Value placeholder={placeholder} />
            </Select.Trigger>
          </Form.Control>
          <Select.Content>
            {options.map((option) => (
              <Select.Item key={option.value} value={option.value}>
                {option.label}
              </Select.Item>
            ))}
          </Select.Content>
        </Select>
        <Form.Message />
      </Form.Item>
    )}
  />
);

export const ProfileNumberField = ({
  control,
  name,
  label,
  min,
  max,
  suffix,
}: {
  control: ProfileControl;
  name: NumberFieldName;
  label: string;
  min?: number;
  max?: number;
  suffix?: string;
}) => (
  <Form.Field
    control={control}
    name={name}
    render={({ field }) => (
      <Form.Item>
        <Form.Label>{label}</Form.Label>
        <div className="flex items-center gap-2">
          <Form.Control>
            <Input
              type="number"
              min={min}
              max={max}
              name={field.name}
              ref={field.ref}
              onBlur={field.onBlur}
              value={Number.isFinite(field.value) ? String(field.value) : ''}
              onChange={(event) =>
                field.onChange(
                  event.target.value === '' ? 0 : event.target.valueAsNumber,
                )
              }
            />
          </Form.Control>
          {suffix && (
            <span className="text-sm text-muted-foreground">{suffix}</span>
          )}
        </div>
        <Form.Message />
      </Form.Item>
    )}
  />
);

export const ProfileOptionalNumberField = ({
  control,
  name,
  label,
  placeholder,
  min,
  max,
  suffix,
}: {
  control: ProfileControl;
  name: OptionalNumberFieldName;
  label: string;
  placeholder?: string;
  min?: number;
  max?: number;
  suffix?: string;
}) => (
  <Form.Field
    control={control}
    name={name}
    render={({ field }) => (
      <Form.Item>
        <Form.Label>{label}</Form.Label>
        <div className="flex items-center gap-2">
          <Form.Control>
            <Input
              type="number"
              min={min}
              max={max}
              placeholder={placeholder}
              name={field.name}
              ref={field.ref}
              onBlur={field.onBlur}
              value={field.value === null ? '' : String(field.value)}
              onChange={(event) =>
                field.onChange(
                  event.target.value === '' ? null : event.target.valueAsNumber,
                )
              }
            />
          </Form.Control>
          {suffix && (
            <span className="text-sm text-muted-foreground">{suffix}</span>
          )}
        </div>
        <Form.Message />
      </Form.Item>
    )}
  />
);

const NO_SELECTION = '__none__';

export const ProfileOptionalSelectField = ({
  control,
  name,
  label,
  options,
  emptyLabel,
}: {
  control: ProfileControl;
  name: StringFieldName;
  label: string;
  options: { value: string; label: string }[];
  emptyLabel: string;
}) => (
  <Form.Field
    control={control}
    name={name}
    render={({ field }) => (
      <Form.Item>
        <Form.Label>{label}</Form.Label>
        <Select
          value={field.value || NO_SELECTION}
          onValueChange={(value) =>
            field.onChange(value === NO_SELECTION ? '' : value)
          }
        >
          <Form.Control>
            <Select.Trigger>
              <Select.Value placeholder={emptyLabel} />
            </Select.Trigger>
          </Form.Control>
          <Select.Content>
            <Select.Item value={NO_SELECTION}>{emptyLabel}</Select.Item>
            {options.map((option) => (
              <Select.Item key={option.value} value={option.value}>
                {option.label}
              </Select.Item>
            ))}
          </Select.Content>
        </Select>
        <Form.Message />
      </Form.Item>
    )}
  />
);

export const ProfileSectionTitle = ({ children }: { children: string }) => (
  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
    {children}
  </h3>
);
