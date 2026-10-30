import { ChoiceboxGroup, Form } from 'erxes-ui';
import { UPLOAD_SERVICE_DATA } from '@/settings/file-upload/constants/serviceData';
import { FormProps } from 'react-hook-form';
import { UploadConfigFormT } from '@/settings/file-upload/types';

interface Props {
  form: FormProps<UploadConfigFormT>;
  selected: string;
}

export function UploadServiceRadioGroup({ form, selected }: Props) {
  const current = UPLOAD_SERVICE_DATA.find(
    (config) => config.value.toUpperCase() === selected?.toUpperCase(),
  )?.value;

  return (
    <Form.Field
      control={form.control}
      name="UPLOAD_SERVICE_TYPE"
      render={({ field }) => (
        <ChoiceboxGroup
          value={current ?? field.value}
          onValueChange={field.onChange}
          direction="row"
          className="grid grid-cols-3"
        >
          {UPLOAD_SERVICE_DATA.map((config) => (
            <ChoiceboxGroup.Item key={config.value} value={config.value}>
              <span className="flex flex-col items-center gap-3 text-center">
                <config.icon className="stroke-primary" />
                {config.label}
              </span>
            </ChoiceboxGroup.Item>
          ))}
        </ChoiceboxGroup>
      )}
    />
  );
}
