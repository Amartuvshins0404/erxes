import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  IconCarSuv,
  IconFolder,
  IconHash,
  IconImageInPicture,
  IconPencil,
  IconPlus,
  IconSearch,
  IconTrash,
} from '@tabler/icons-react';
import { CellContext, ColumnDef } from '@tanstack/react-table';
import {
  Avatar,
  Badge,
  Button,
  Combobox,
  Command,
  CommandBar,
  Empty,
  Filter,
  PageSubHeader,
  Popover,
  RecordTable,
  RecordTableInlineCell,
  RecordTableTree,
  Separator,
  TextOverflowTooltip,
  useConfirm,
  Kbd,
  usePreviousHotkeyScope,
  useQueryState,
  useScopedHotkeys,
  useSetHotkeyScope,
} from 'erxes-ui';
import { Can, usePermissionCheck } from 'ui-modules';
import { useTranslation } from 'react-i18next';

import { CategoryFormSheet } from '~/components/categories/CategoryFormSheet';
import { CarLayout } from '~/components/layout/CarLayout';
import { useCarCategories } from '~/hooks/useCarsData';
import { useCarMutations } from '~/hooks/useCarMutations';
import { CarHotKeyScope } from '~/lib/hotkeys';
import { ICarCategory } from '~/types/car';

type CategoryRow = ICarCategory & { hasChildren: boolean };
type Translate = (
  key: string,
  options: { defaultValue: string } & Record<string, unknown>,
) => string;

const CategoryFilter = ({ totalCount }: { totalCount: number }) => {
  const { t } = useTranslation('car');

  return (
    <Filter id="car-categories-filter">
      <Filter.Bar>
        <Filter.Popover scope={CarHotKeyScope.CarCategoriesPage}>
          <Filter.Trigger />
          <Combobox.Content>
            <Filter.View>
              <Command>
                <Filter.CommandInput
                  placeholder={t('Filter', { defaultValue: 'Filter' })}
                  variant="secondary"
                />
                <Command.List className="p-1">
                  <Filter.Item value="searchValue" inDialog>
                    <IconSearch />
                    {t('Search', { defaultValue: 'Search' })}
                  </Filter.Item>
                </Command.List>
              </Command>
            </Filter.View>
          </Combobox.Content>
        </Filter.Popover>
        <Filter.Dialog>
          <Filter.View filterKey="searchValue" inDialog>
            <Filter.DialogStringView
              filterKey="searchValue"
              label={t('Search', { defaultValue: 'Search' })}
            />
          </Filter.View>
        </Filter.Dialog>
        <Filter.SearchValueBarItem />
        <div className="ml-auto text-sm text-muted-foreground">
          {t('categories count', {
            count: totalCount,
            defaultValue: '{{count}} categories',
          })}
        </div>
      </Filter.Bar>
    </Filter>
  );
};

const CategoryMoreCell = ({
  cell,
  onEdit,
  onDelete,
  t,
}: CellContext<CategoryRow, unknown> & {
  onEdit: (category: ICarCategory) => void;
  onDelete: (categoryIds: string[]) => void;
  t: Translate;
}) => {
  const category = cell.row.original;

  return (
    <Popover>
      <Can action="manageCars">
        <Popover.Trigger asChild>
          <RecordTable.MoreButton className="h-full w-full" />
        </Popover.Trigger>
      </Can>
      <Combobox.Content>
        <Command shouldFilter={false}>
          <Command.List>
            <Command.Item value="edit" onSelect={() => onEdit(category)}>
              <IconPencil className="size-4" />
              {t('Edit', { defaultValue: 'Edit' })}
            </Command.Item>
            <Command.Item
              value="delete"
              onSelect={() => onDelete([category._id])}
            >
              <IconTrash className="size-4" />
              {t('Delete', { defaultValue: 'Delete' })}
            </Command.Item>
          </Command.List>
        </Command>
      </Combobox.Content>
    </Popover>
  );
};

const CategoryNameCell = ({
  cell,
  onEdit,
  canEdit,
}: CellContext<CategoryRow, unknown> & {
  onEdit: (category: ICarCategory) => void;
  canEdit: boolean;
}) => {
  const category = cell.row.original;
  const name = (cell.getValue() as string) || category.code;

  return (
    <RecordTableInlineCell>
      <RecordTableTree.Trigger
        order={category.order}
        name={name}
        hasChildren={category.hasChildren}
      >
        <Badge
          variant="secondary"
          className={`px-2 py-1 font-medium ${
            canEdit ? 'cursor-pointer hover:bg-accent' : 'cursor-default'
          }`}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            if (!canEdit) {
              return;
            }
            onEdit(category);
          }}
        >
          <TextOverflowTooltip value={name} />
        </Badge>
      </RecordTableTree.Trigger>
    </RecordTableInlineCell>
  );
};

const createCategoryColumns = ({
  categoryMap,
  onEdit,
  onDelete,
  canEdit,
  t,
}: {
  categoryMap: Record<string, ICarCategory>;
  onEdit: (category: ICarCategory) => void;
  onDelete: (categoryIds: string[]) => void;
  canEdit: boolean;
  t: Translate;
}): ColumnDef<CategoryRow>[] => [
  {
    id: 'more',
    header: () => <RecordTable.ColumnSelector />,
    cell: (props) => (
      <CategoryMoreCell
        {...props}
        onEdit={onEdit}
        onDelete={onDelete}
        t={t}
      />
    ),
    size: 33,
  },
  RecordTable.checkboxColumn as ColumnDef<CategoryRow>,
  {
    id: 'image',
    accessorKey: 'image',
    header: () => <RecordTable.InlineHead icon={IconImageInPicture} label="" />,
    cell: ({ row }) => (
      <RecordTableInlineCell className="justify-center px-1">
        <Avatar>
          <Avatar.Image src={row.original.image?.url || ''} />
          <Avatar.Fallback>
            {(row.original.name || row.original.code || '?').charAt(0)}
          </Avatar.Fallback>
        </Avatar>
      </RecordTableInlineCell>
    ),
    size: 44,
  },
  {
    id: 'name',
    accessorKey: 'name',
    header: () => (
      <RecordTable.InlineHead
        icon={IconFolder}
        label={t('Name', { defaultValue: 'Name' })}
      />
    ),
    cell: (props) => (
      <CategoryNameCell {...props} onEdit={onEdit} canEdit={canEdit} />
    ),
    size: 320,
  },
  {
    id: 'code',
    accessorKey: 'code',
    header: () => (
      <RecordTable.InlineHead
        icon={IconHash}
        label={t('Code', { defaultValue: 'Code' })}
      />
    ),
    cell: ({ cell }) => (
      <RecordTableInlineCell>
        <TextOverflowTooltip value={(cell.getValue() as string) || '—'} />
      </RecordTableInlineCell>
    ),
    size: 160,
  },
  {
    id: 'carCount',
    accessorKey: 'carCount',
    header: () => (
      <RecordTable.InlineHead
        icon={IconCarSuv}
        label={t('Cars', { defaultValue: 'Cars' })}
      />
    ),
    cell: ({ cell }) => (
      <RecordTableInlineCell>
        {(cell.getValue() as number) || 0}
      </RecordTableInlineCell>
    ),
    size: 120,
  },
  {
    id: 'parentId',
    accessorKey: 'parentId',
    header: () => (
      <RecordTable.InlineHead
        icon={IconFolder}
        label={t('Parent category', { defaultValue: 'Parent category' })}
      />
    ),
    cell: ({ cell }) => {
      const parent = categoryMap[cell.getValue() as string];

      return (
        <RecordTableInlineCell>
          <TextOverflowTooltip value={parent?.name || parent?.code || '—'} />
        </RecordTableInlineCell>
      );
    },
    size: 220,
  },
];

const CategoriesCommandBar = ({
  onDelete,
}: {
  onDelete: (categoryIds: string[]) => Promise<void>;
}) => {
  const { t } = useTranslation('car');
  const { table } = RecordTable.useRecordTable();
  const selectedIds = table
    .getFilteredSelectedRowModel()
    .rows.map((row) => row.original._id);

  const handleDelete = async () => {
    await onDelete(selectedIds);
    table.resetRowSelection(true);
  };

  return (
    <CommandBar open={selectedIds.length > 0}>
      <CommandBar.Bar>
        <CommandBar.Value onClose={() => table.resetRowSelection(true)}>
          {t('Selected count', {
            count: selectedIds.length,
            defaultValue: '{{count}} selected',
          })}
        </CommandBar.Value>
        <Separator.Inline />
        <Can action="manageCars">
          <Button variant="destructive" onClick={handleDelete}>
            <IconTrash />
            {t('Delete', { defaultValue: 'Delete' })}
          </Button>
        </Can>
      </CommandBar.Bar>
    </CommandBar>
  );
};

export const CarCategoriesPage = () => {
  const { t } = useTranslation('car');
  const { carCategories, loading, error } = useCarCategories();
  const { carCategoriesRemove } = useCarMutations();
  const { confirm } = useConfirm();
  const setHotkeyScope = useSetHotkeyScope();
  const {
    setHotkeyScopeAndMemorizePreviousScope,
    goBackToPreviousHotkeyScope,
  } = usePreviousHotkeyScope();
  const { isLoaded: permissionsLoaded, hasActionPermission } =
    usePermissionCheck();
  const [searchValue] = useQueryState<string>('searchValue');
  const [formOpen, setFormOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] =
    useQueryState<string>('category_id');
  const canManageCategories =
    permissionsLoaded && hasActionPermission('manageCars');

  const categoryMap = useMemo(
    () =>
      carCategories.reduce<Record<string, ICarCategory>>((acc, category) => {
        acc[category._id] = category;
        return acc;
      }, {}),
    [carCategories],
  );

  const categories = useMemo(() => {
    const normalizedSearch = (searchValue || '').trim().toLowerCase();
    const rows = [...carCategories]
      .sort((a, b) => (a.order || '').localeCompare(b.order || ''))
      .map<CategoryRow>((category) => ({
        ...category,
        hasChildren: carCategories.some(
          (child) => child.parentId === category._id,
        ),
      }));

    if (!normalizedSearch) {
      return rows;
    }

    return rows.filter((category) =>
      [category.name, category.code, category.description]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(normalizedSearch),
        ),
    );
  }, [carCategories, searchValue]);

  const editingCategory = editingCategoryId
    ? categoryMap[editingCategoryId]
    : null;
  const categorySheetOpen =
    canManageCategories &&
    (formOpen || (!!editingCategoryId && !!editingCategory));

  useEffect(() => {
    setHotkeyScope(
      categorySheetOpen
        ? editingCategory
          ? CarHotKeyScope.CarCategoryEditSheet
          : CarHotKeyScope.CarCategoryAddSheet
        : CarHotKeyScope.CarCategoriesPage,
    );
  }, [categorySheetOpen, editingCategory, setHotkeyScope]);

  const openCreateCategory = useCallback(() => {
    if (!canManageCategories) {
      return;
    }

    setEditingCategoryId(null);
    setFormOpen(true);
    setHotkeyScopeAndMemorizePreviousScope(
      CarHotKeyScope.CarCategoryAddSheet,
    );
  }, [
    canManageCategories,
    setEditingCategoryId,
    setHotkeyScopeAndMemorizePreviousScope,
  ]);

  const openEditCategory = useCallback(
    (category: ICarCategory) => {
      if (!canManageCategories) {
        return;
      }

      setFormOpen(false);
      setEditingCategoryId(category._id);
      setHotkeyScopeAndMemorizePreviousScope(
        CarHotKeyScope.CarCategoryEditSheet,
      );
    },
    [
      canManageCategories,
      setEditingCategoryId,
      setHotkeyScopeAndMemorizePreviousScope,
    ],
  );

  const closeCategorySheet = useCallback(() => {
    setFormOpen(false);
    setEditingCategoryId(null);
    goBackToPreviousHotkeyScope();
  }, [goBackToPreviousHotkeyScope, setEditingCategoryId]);

  useScopedHotkeys(
    'c',
    () => {
      openCreateCategory();
    },
    CarHotKeyScope.CarCategoriesPage,
    [openCreateCategory],
  );

  useScopedHotkeys(
    'esc',
    () => {
      closeCategorySheet();
    },
    CarHotKeyScope.CarCategoryAddSheet,
    [closeCategorySheet],
  );

  useScopedHotkeys(
    'esc',
    () => {
      closeCategorySheet();
    },
    CarHotKeyScope.CarCategoryEditSheet,
    [closeCategorySheet],
  );

  const handleDeleteCategories = useCallback(
    async (categoryIds: string[]) => {
      if (!categoryIds.length) {
        return;
      }

      await confirm({
        message:
          categoryIds.length === 1
            ? t('Delete the selected category?', {
                defaultValue: 'Delete the selected category?',
              })
            : t('Delete {{count}} selected categories?', {
                count: categoryIds.length,
                defaultValue: 'Delete {{count}} selected categories?',
              }),
        options: {
          okLabel: t('Delete', { defaultValue: 'Delete' }),
          description: t(
            'This category can only be deleted when it has no child categories or cars.',
            {
              defaultValue:
                'This category can only be deleted when it has no child categories or cars.',
            },
          ),
        },
      });

      for (const _id of categoryIds) {
        await carCategoriesRemove({
          variables: {
            _id,
          },
        });
      }
    },
    [carCategoriesRemove, confirm, t],
  );

  const columns = useMemo(
    () =>
      createCategoryColumns({
        categoryMap,
        onEdit: openEditCategory,
        onDelete: handleDeleteCategories,
        canEdit: canManageCategories,
        t,
      }),
    [
      canManageCategories,
      categoryMap,
      handleDeleteCategories,
      openEditCategory,
      t,
    ],
  );

  return (
    <CarLayout
      activeModule="categories"
      actions={
        <Can action="manageCars">
          <Button onClick={openCreateCategory}>
            <IconPlus />
            {t('Add category', { defaultValue: 'Add category' })}
            <Kbd>C</Kbd>
          </Button>
        </Can>
      }
    >
      <PageSubHeader>
        <CategoryFilter totalCount={carCategories.length} />
      </PageSubHeader>

      <div className="min-h-0 flex-1 overflow-hidden p-3">
        {error ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm">
            <div className="font-medium text-destructive">
              {t('Could not load categories', {
                defaultValue: 'Could not load categories',
              })}
            </div>
            <p className="mt-1 text-muted-foreground">{error.message}</p>
          </div>
        ) : (
          <RecordTable.Provider
            columns={columns}
            data={categories}
            stickyColumns={['more', 'checkbox', 'name']}
            tableId="car-categories-record-table"
            className="h-full"
          >
            <RecordTableTree
              id="car-categories"
              ordered
              length={categories.length}
            >
              <RecordTable.Scroll>
                <RecordTable>
                  <RecordTable.Header />
                  <RecordTable.Body>
                    <RecordTable.RowList Row={RecordTableTree.Row} />
                    {loading ? <RecordTable.RowSkeleton rows={12} /> : null}
                  </RecordTable.Body>
                </RecordTable>
              </RecordTable.Scroll>
              {!loading && !categories.length ? (
                <div className="p-6">
                  <Empty>
                    <Empty.Header>
                      <Empty.Media variant="icon">
                        <IconFolder />
                      </Empty.Media>
                      <Empty.Title>
                        {t('No categories yet', {
                          defaultValue: 'No categories yet',
                        })}
                      </Empty.Title>
                      <Empty.Description>
                        {t(
                          'Create the first category to organize cars into a tree.',
                          {
                            defaultValue:
                              'Create the first category to organize cars into a tree.',
                          },
                        )}
                      </Empty.Description>
                    </Empty.Header>
                  </Empty>
                </div>
              ) : null}
              <CategoriesCommandBar onDelete={handleDeleteCategories} />
            </RecordTableTree>
          </RecordTable.Provider>
        )}
      </div>

      <CategoryFormSheet
        open={categorySheetOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeCategorySheet();
          }
        }}
        category={editingCategory}
        categories={carCategories}
      />
    </CarLayout>
  );
};
