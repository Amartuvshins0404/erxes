import { useMemo } from 'react';
import {
  IconTrash,
  IconVersions,
} from '@tabler/icons-react';
import {
  Button,
  Combobox,
  CommandBar,
  RecordTable,
  Separator,
  useConfirm,
} from 'erxes-ui';
import { Can, TagsSelect } from 'ui-modules';
import { useTranslation } from 'react-i18next';

import { ROOT_CAR_CONTENT_TYPE } from '~/lib/constants';
import { useCarMutations } from '~/hooks/useCarMutations';
import { ICar } from '~/types/car';

export const CarsCommandBar = ({
  onMergeSelected,
  onTagsUpdated,
}: {
  onMergeSelected: (cars: ICar[]) => void;
  onTagsUpdated?: () => void;
}) => {
  const { t } = useTranslation('car');
  const { table } = RecordTable.useRecordTable();
  const { confirm } = useConfirm();
  const { carsRemove, loading } = useCarMutations();

  const selectedCars = table
    .getFilteredSelectedRowModel()
    .rows.map((row) => row.original as ICar);
  const selectedIds = selectedCars.map((car) => car._id);

  const selectedTagIds = useMemo(
    () =>
      Array.from(
        new Set(
          selectedCars.flatMap((car) => car.tagIds || []).filter(Boolean),
        ),
      ),
    [selectedCars],
  );

  const handleDelete = async () => {
    if (selectedIds.length === 0) {
      return;
    }

    await confirm({
      message:
        selectedIds.length === 1
          ? t('Delete the selected car?', {
              defaultValue: 'Delete the selected car?',
            })
          : t('Delete {{count}} selected cars?', {
              count: selectedIds.length,
              defaultValue: 'Delete {{count}} selected cars?',
            }),
      options: {
        okLabel: t('Delete', { defaultValue: 'Delete' }),
        description: t('This permanently removes the selected car records.', {
          defaultValue: 'This permanently removes the selected car records.',
        }),
      },
    });

    await carsRemove({
      variables: {
        carIds: selectedIds,
      },
    });

    table.toggleAllPageRowsSelected(false);
  };

  return (
    <CommandBar open={selectedIds.length > 0}>
      <CommandBar.Bar>
        <CommandBar.Value
          onClose={() => table.toggleAllPageRowsSelected(false)}
        >
          {t('Selected count', {
            count: selectedIds.length,
            defaultValue: '{{count}} selected',
          })}
        </CommandBar.Value>
        <Separator.Inline />
        <Can action="manageCars">
          <TagsSelect.Provider
            mode="multiple"
            type={ROOT_CAR_CONTENT_TYPE}
            targetIds={selectedIds}
            value={selectedTagIds}
            options={() => ({
              refetchQueries: 'active',
              awaitRefetchQueries: true,
              onCompleted: onTagsUpdated,
            })}
          >
            <TagsSelect.Trigger
              variant="secondary"
              size="sm"
              placeholder={t('Assign tags', { defaultValue: 'Assign tags' })}
            />
            <Combobox.Content className="w-80">
              <TagsSelect.Content />
            </Combobox.Content>
          </TagsSelect.Provider>
        </Can>

        <Can action="manageCars">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={selectedIds.length !== 2}
            onClick={() => onMergeSelected(selectedCars)}
          >
            <IconVersions className="size-4" />
            {t('Merge', { defaultValue: 'Merge' })}
          </Button>
        </Can>

        <Can action="manageCars">
          <Button
            type="button"
            variant="destructive"
            size="sm"
            disabled={loading}
            onClick={handleDelete}
          >
            <IconTrash className="size-4" />
            {t('Delete', { defaultValue: 'Delete' })}
          </Button>
        </Can>
      </CommandBar.Bar>
    </CommandBar>
  );
};
