import { Button, Form, Upload } from 'erxes-ui';
import { useState } from 'react';
import { Control, FieldPathByValue } from 'react-hook-form';

import { ProfileFormValues } from '../../constants/profileFormSchema';

export const ProfileImageField = ({
  control,
  name,
  label,
  description,
}: {
  control: Control<ProfileFormValues>;
  name: FieldPathByValue<ProfileFormValues, string>;
  label: string;
  description: string;
}) => {
  const [uploadKey, setUploadKey] = useState(0);

  return (
    <Form.Field
      control={control}
      name={name}
      render={({ field }) => (
        <Form.Item>
          <Form.Label>{label}</Form.Label>
          <Form.Control>
            <Upload.Root
              key={uploadKey}
              value={field.value}
              onChange={(value) =>
                field.onChange(
                  value && 'url' in value ? value.url : '',
                )
              }
            >
              <Upload.Preview />
              <div className="flex flex-col gap-2">
                <Upload.Button type="button" variant="secondary" size="sm">
                  {field.value ? 'Солих' : 'Зураг оруулах'}
                </Upload.Button>
                {field.value && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      field.onChange('');
                      setUploadKey((key) => key + 1);
                    }}
                  >
                    Устгах
                  </Button>
                )}
              </div>
            </Upload.Root>
          </Form.Control>
          <Form.Description>{description}</Form.Description>
          <Form.Message />
        </Form.Item>
      )}
    />
  );
};
