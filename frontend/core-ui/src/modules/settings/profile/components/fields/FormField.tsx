import { ControllerRenderProps, Path, useFormContext } from 'react-hook-form';
import { FormType } from '@/settings/profile/hooks/useProfileForm';
import { cn, DatePicker, Form, Input, PhoneInput } from 'erxes-ui';

type RenderProps = {
  field: ControllerRenderProps;
  element: string;
  attributes: Record<string, unknown>;
};

type Props = {
  name: keyof FormType;
  element: string;
  attributes: Record<string, unknown>;
};

const RenderFormField = ({ field, element, attributes }: RenderProps) => {
  const form = useFormContext<FormType>();
  const fieldState = form.getFieldState(field.name as Path<FormType>);

  switch (element) {
    case 'input':
      return (
        <Input
          {...field}
          {...attributes}
          aria-invalid={!!fieldState.error}
          className={cn(fieldState.error && 'ring-1 ring-destructive')}
        />
      );
    case 'date':
      return (
        <DatePicker {...field} {...attributes} defaultMonth={field.value} />
      );
    case 'telephone':
      return <PhoneInput value={field.value} onChange={field.onChange} />;
    default:
      return <></>;
  }
};

export const FormField = ({ name, element, attributes }: Props) => {
  const form = useFormContext();

  return (
    <Form.Field
      key={name}
      name={name}
      control={form.control}
      render={({ field }) => (
        <Form.Item>
          <Form.Control>
            <RenderFormField
              field={field}
              element={element}
              attributes={attributes}
            />
          </Form.Control>
        </Form.Item>
      )}
    />
  );
};
