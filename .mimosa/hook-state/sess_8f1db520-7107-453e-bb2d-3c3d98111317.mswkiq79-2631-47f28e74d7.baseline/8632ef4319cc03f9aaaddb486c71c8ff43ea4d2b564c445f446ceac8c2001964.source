import { Form, Select } from 'erxes-ui';
import { Control, FieldValues, Path } from 'react-hook-form';
import { usePosConfigs } from '../hooks/usePosConfigs';

interface SyncPosFieldProps<T extends FieldValues> {
  control: Control<T>;
}

export const SyncPosField = <T extends FieldValues>({
  control,
}: SyncPosFieldProps<T>) => {
  const { posConfigs, loading } = usePosConfigs();

  return (
    <Form.Field
      name={'posToken' as Path<T>}
      control={control}
      render={({ field }) => (
        <Form.Item>
          <Form.Label>POS</Form.Label>
          <Select
            value={(field.value as string) || ''}
            onValueChange={field.onChange}
            disabled={loading}
          >
            <Form.Control>
              <Select.Trigger>
                <Select.Value
                  placeholder={loading ? 'Loading…' : 'Select POS'}
                />
              </Select.Trigger>
            </Form.Control>
            <Select.Content>
              {posConfigs.map((pos) => (
                <Select.Item key={pos._id} value={pos.token}>
                  {pos.name}
                </Select.Item>
              ))}
            </Select.Content>
          </Select>
          <Form.Message />
        </Form.Item>
      )}
    />
  );
};
