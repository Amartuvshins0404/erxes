import { IconChevronDown } from '@tabler/icons-react';
import {
  Button,
  CommandBar,
  Combobox,
  Command,
  Dialog,
  Label,
  Popover,
  PopoverScoped,
  RecordTable,
  Separator,
  Textarea,
} from 'erxes-ui';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@apollo/client';
import { Can } from 'ui-modules';
import {
  MUSHOP_BULK_UPDATE_PRODUCT_STATUS,
  MUSHOP_ASSIGN_PRODUCT_CATEGORY,
} from '../graphql/mutations';
import { MUSHOP_PRODUCTS } from '../graphql/queries';
import { useCoreProductCategories } from '../hooks/useAssignProductCategory';
import { IMushopProduct, IMushopProductCategory } from '../types';

const STATUSES = [
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

const BulkStatusSelect = ({
  selectedIds,
  onDone,
}: {
  selectedIds: string[];
  onDone: () => void;
}) => {
  const { t } = useTranslation('mushop');
  const [open, setOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [note, setNote] = useState('');
  const [bulkUpdateStatus, { loading }] = useMutation(
    MUSHOP_BULK_UPDATE_PRODUCT_STATUS,
    { refetchQueries: [{ query: MUSHOP_PRODUCTS }] },
  );

  const handleSelect = (status: string) => {
    setOpen(false);
    if (status === 'rejected') {
      setNote('');
      setRejectOpen(true);
    } else {
      bulkUpdateStatus({ variables: { ids: selectedIds, status } });
      onDone();
    }
  };

  const handleConfirmReject = async () => {
    await bulkUpdateStatus({ variables: { ids: selectedIds, status: 'rejected', note } });
    setRejectOpen(false);
    onDone();
  };

  return (
    <>
      <PopoverScoped open={open} onOpenChange={setOpen}>
        <Popover.Trigger asChild>
          <Button variant="secondary" size="sm" disabled={loading}>
            {t('Change status')}
            <IconChevronDown className="ml-1 size-4" />
          </Button>
        </Popover.Trigger>
        <Combobox.Content>
          <Command>
            <Command.List>
              {STATUSES.map((s) => (
                <Command.Item
                  key={s.value}
                  value={s.value}
                  onSelect={() => handleSelect(s.value)}
                >
                  {t(s.label)}
                </Command.Item>
              ))}
            </Command.List>
          </Command>
        </Combobox.Content>
      </PopoverScoped>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <Dialog.Content className="sm:max-w-md">
          <Dialog.Header>
            <Dialog.Title>{t('Reject products')}</Dialog.Title>
            <Dialog.Description>
              {t('Provide a reason for rejection. This note will be sent to the suppliers.')}
            </Dialog.Description>
          </Dialog.Header>
          <div className="flex flex-col gap-2">
            <Label htmlFor="bulk-reject-note">{t('Note')}</Label>
            <Textarea
              id="bulk-reject-note"
              placeholder={t('Enter rejection reason...')}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
            />
          </div>
          <Dialog.Footer>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>
              {t('Cancel')}
            </Button>
            <Button variant="destructive" onClick={handleConfirmReject}>
              {t('Reject')}
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog>
    </>
  );
};

const BulkCategorySelect = ({
  selectedIds,
  onDone,
}: {
  selectedIds: string[];
  onDone: () => void;
}) => {
  const { t } = useTranslation('mushop');
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const { categories, loading: loadingCats } = useCoreProductCategories();
  const [assignCategory, { loading }] = useMutation(
    MUSHOP_ASSIGN_PRODUCT_CATEGORY,
    {
      refetchQueries: [{ query: MUSHOP_PRODUCTS }],
    },
  );

  const filtered = search
    ? categories.filter((c: IMushopProductCategory) =>
        c.name?.toLowerCase().includes(search.toLowerCase()),
      )
    : categories;

  const handleSelect = async (categoryId: string) => {
    await Promise.all(
      selectedIds.map((id) =>
        assignCategory({ variables: { _id: id, categoryId } }),
      ),
    );
    setOpen(false);
    onDone();
  };

  return (
    <PopoverScoped open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <Button variant="secondary" size="sm" disabled={loading}>
          {t('Assign category')}
          <IconChevronDown className="ml-1 size-4" />
        </Button>
      </Popover.Trigger>
      <Combobox.Content>
        <Command shouldFilter={false}>
          <Command.Input
            placeholder={t('Search categories...')}
            value={search}
            onValueChange={setSearch}
          />
          <Command.List>
            {loadingCats && <Command.Item disabled>{t('Loading...')}</Command.Item>}
            <Command.Empty>{t('No categories found.')}</Command.Empty>
            {filtered.map((cat: IMushopProductCategory) => (
              <Command.Item
                key={cat._id}
                value={cat._id}
                onSelect={() => cat._id && handleSelect(cat._id)}
              >
                {cat.name}
              </Command.Item>
            ))}
          </Command.List>
        </Command>
      </Combobox.Content>
    </PopoverScoped>
  );
};

export const ProductsCommandBar = () => {
  const { t } = useTranslation('mushop');
  const { table } = RecordTable.useRecordTable();
  const selected = table
    .getFilteredSelectedRowModel()
    .rows.map((r) => r.original as IMushopProduct);
  const selectedIds = selected.map((p) => p._id);

  const clearSelection = () => table.toggleAllPageRowsSelected(false);

  return (
    <CommandBar open={selectedIds.length > 0}>
      <CommandBar.Bar>
        <CommandBar.Value onClose={clearSelection}>
          {t('{{count}} selected', { count: selectedIds.length })}
        </CommandBar.Value>
        <Separator.Inline />
        <Can action="mushopBulkUpdateProductStatus">
          <BulkStatusSelect selectedIds={selectedIds} onDone={clearSelection} />
          <Separator.Inline />
        </Can>
        <Can action="mushopAssignProductCategory">
          <BulkCategorySelect
            selectedIds={selectedIds}
            onDone={clearSelection}
          />
        </Can>
      </CommandBar.Bar>
    </CommandBar>
  );
};
