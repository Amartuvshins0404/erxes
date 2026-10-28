import { AccountingHotkeyScope } from '@/types/AccountingHotkeyScope';
import {
  Form,
  RecordTableHotKeyControl,
  RecordTableInlineCell,
  Table,
} from 'erxes-ui';
import { SelectStructureEntities } from 'ui-modules';
import { ITransactionGroupForm } from '../../types/JournalForms';

export const FxaDetailLocationCells = ({
  detailId,
  detailIndex,
  form,
  journalIndex,
}: {
  detailId?: string;
  detailIndex: number;
  form: ITransactionGroupForm;
  journalIndex: number;
}) => {
  const rowId = detailId || '';

  return (
    <>
      <RecordTableHotKeyControl
        rowId={rowId}
        rowIndex={detailIndex}
        enableOnFormTags
      >
        <Table.Cell>
          <RecordTableInlineCell className="justify-center">
            <Form.Field
              control={form.control}
              name={`trDocs.${journalIndex}.details.${detailIndex}.placeEntityId`}
              render={({ field }) => (
                <Form.Item>
                  <Form.Control>
                    <SelectStructureEntities.InlineCell
                      mode="single"
                      value={field.value ?? ''}
                      onValueChange={(entityId) => field.onChange(entityId)}
                      scope={AccountingHotkeyScope.TransactionFormPage}
                    />
                  </Form.Control>
                  <Form.Message />
                </Form.Item>
              )}
            />
          </RecordTableInlineCell>
        </Table.Cell>
      </RecordTableHotKeyControl>
      <RecordTableHotKeyControl
        rowId={rowId}
        rowIndex={detailIndex}
        enableOnFormTags
      >
        <Table.Cell>
          <RecordTableInlineCell className="justify-center">
            <Form.Field
              control={form.control}
              name={`trDocs.${journalIndex}.details.${detailIndex}.responsibleEntityId`}
              render={({ field }) => (
                <Form.Item>
                  <Form.Control>
                    <SelectStructureEntities.InlineCell
                      mode="single"
                      value={field.value ?? ''}
                      onValueChange={(entityId) => field.onChange(entityId)}
                      scope={AccountingHotkeyScope.TransactionFormPage}
                    />
                  </Form.Control>
                  <Form.Message />
                </Form.Item>
              )}
            />
          </RecordTableInlineCell>
        </Table.Cell>
      </RecordTableHotKeyControl>
    </>
  );
};
