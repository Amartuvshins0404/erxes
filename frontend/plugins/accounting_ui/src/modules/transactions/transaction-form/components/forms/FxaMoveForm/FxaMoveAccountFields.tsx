import { useTranslation } from 'react-i18next';
import { Form } from 'erxes-ui';
import { SelectStructureEntities } from 'ui-modules';
import { ITransactionGroupForm } from '../../../types/JournalForms';

export const FxaMoveAccountFields = ({
  form,
  index,
}: {
  form: ITransactionGroupForm;
  index: number;
}) => {
  const { t } = useTranslation('accounting');
  return (
    <>
      <Form.Field
        control={form.control}
        name={`trDocs.${index}.followInfos.moveInPlaceEntityId`}
        render={({ field }) => (
          <Form.Item>
            <Form.Label>
              {t('destination-place', 'Destination place')}
            </Form.Label>
            <Form.Control>
              <SelectStructureEntities.FormItem
                value={field.value}
                onValueChange={field.onChange}
              />
            </Form.Control>
            <Form.Message />
          </Form.Item>
        )}
      />
      <Form.Field
        control={form.control}
        name={`trDocs.${index}.followInfos.moveInResponsibleEntityId`}
        render={({ field }) => (
          <Form.Item>
            <Form.Label>
              {t('destination-responsible', 'Destination responsible')}
            </Form.Label>
            <Form.Control>
              <SelectStructureEntities.FormItem
                value={field.value}
                onValueChange={field.onChange}
              />
            </Form.Control>
            <Form.Message />
          </Form.Item>
        )}
      />
    </>
  );
};
