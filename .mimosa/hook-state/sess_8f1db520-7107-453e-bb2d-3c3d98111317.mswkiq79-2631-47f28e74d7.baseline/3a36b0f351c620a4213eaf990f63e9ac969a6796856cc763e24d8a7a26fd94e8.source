import { useEffect, useMemo, useState } from 'react';
import { useDebounce } from 'use-debounce';
import { useInView } from 'react-intersection-observer';
import { IconCarSuv, IconSearch } from '@tabler/icons-react';
import {
  Badge,
  Button,
  Checkbox,
  Dialog,
  Empty,
  Input,
  ScrollArea,
  Spinner,
} from 'erxes-ui';
import { useTranslation } from 'react-i18next';

import { useCarsMain } from '~/hooks/useCarsData';
import { getCarDisplayName } from '~/lib/car';

export const SelectCarsDialog = ({
  open,
  onOpenChange,
  selectedIds,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIds: string[];
  onSubmit: (ids: string[]) => void;
}) => {
  const { t } = useTranslation('car');
  const [searchValue, setSearchValue] = useState('');
  const [debouncedSearch] = useDebounce(searchValue, 300);
  const [draftIds, setDraftIds] = useState<string[]>(selectedIds);

  const {
    cars,
    totalCount,
    loading,
    fetchingMore,
    hasMore,
    fetchMoreCars,
  } = useCarsMain(
    {
      page: 1,
      searchValue: debouncedSearch || undefined,
      perPage: 40,
      sortField: 'createdAt',
      sortDirection: -1,
    },
    { skip: !open },
  );

  const { ref: bottomRef } = useInView({
    onChange: (inView) => {
      if (inView) {
        fetchMoreCars?.();
      }
    },
  });

  useEffect(() => {
    if (open) {
      setDraftIds(selectedIds);
    }
  }, [open, selectedIds]);

  const selectedCount = draftIds.length;

  const selectedMap = useMemo(() => new Set(draftIds), [draftIds]);

  const toggleId = (carId: string) => {
    setDraftIds((current) =>
      current.includes(carId)
        ? current.filter((id) => id !== carId)
        : [...current, carId],
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Dialog.ContentCombined
        title={t('Attach cars', { defaultValue: 'Attach cars' })}
        description={t(
          'Search cars and choose which ones should stay related.',
          {
            defaultValue:
              'Search cars and choose which ones should stay related.',
          },
        )}
        className="grid max-w-2xl grid-rows-[auto_auto_1fr_auto] gap-0 overflow-hidden p-0"
        style={{ height: 'min(720px, calc(100dvh - 2rem))' }}
      >
        <div className="border-b px-6 py-4">
          <div className="relative">
            <IconSearch className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder={t('Search by plate number, VIN, or description', {
                defaultValue: 'Search by plate number, VIN, or description',
              })}
              className="pl-9"
            />
          </div>
        </div>

        <ScrollArea className="min-h-0">
          <div className="space-y-2 p-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                {t('Selected cars', { defaultValue: 'Selected cars' })}
              </span>
              <div className="flex items-center gap-2">
                <span>
                  {t('Total cars count', {
                    count: totalCount,
                    defaultValue: '{{count}} total',
                  })}
                </span>
                <Badge variant="secondary">{selectedCount}</Badge>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-10">
                <Spinner />
              </div>
            ) : cars.length ? (
              cars.map((car) => {
                const checked = selectedMap.has(car._id);

                return (
                  <button
                    key={car._id}
                    type="button"
                    className="flex w-full items-start gap-3 rounded-lg border bg-background p-3 text-left transition hover:border-primary/40 hover:bg-muted/50"
                    onClick={() => toggleId(car._id)}
                  >
                    <Checkbox checked={checked} className="mt-1" />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium">
                        {getCarDisplayName(car, t)}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        <span>
                          {t('VIN: {{vin}}', {
                            vin: car.vinNumber || '—',
                            defaultValue: 'VIN: {{vin}}',
                          })}
                        </span>
                        <span>
                          {t('Category: {{category}}', {
                            category: car.category?.name || '—',
                            defaultValue: 'Category: {{category}}',
                          })}
                        </span>
                        <span>
                          {t('Import year: {{year}}', {
                            year: car.importYear || '—',
                            defaultValue: 'Import year: {{year}}',
                          })}
                        </span>
                      </div>
                      {car.description ? (
                        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                          {car.description}
                        </p>
                      ) : null}
                    </div>
                  </button>
                );
              })
            ) : (
              <Empty>
                <Empty.Header>
                  <Empty.Media variant="icon">
                    <IconCarSuv />
                  </Empty.Media>
                  <Empty.Title>
                    {t('No matching cars', {
                      defaultValue: 'No matching cars',
                    })}
                  </Empty.Title>
                  <Empty.Description>
                    {t(
                      'Try another search term to find the right car records.',
                      {
                        defaultValue:
                          'Try another search term to find the right car records.',
                      },
                    )}
                  </Empty.Description>
                </Empty.Header>
              </Empty>
            )}

            {hasMore ? (
              <div
                ref={bottomRef}
                className="flex h-10 items-center gap-2 px-2 text-sm text-muted-foreground"
              >
                <Spinner className="size-4" />
                <span className={fetchingMore ? 'animate-pulse' : undefined}>
                  {t('Loading more cars...', {
                    defaultValue: 'Loading more cars...',
                  })}
                </span>
              </div>
            ) : null}
          </div>
        </ScrollArea>

        <Dialog.Footer className="border-t bg-background px-6 py-4">
          <Dialog.Close asChild>
            <Button variant="secondary">
              {t('Cancel', { defaultValue: 'Cancel' })}
            </Button>
          </Dialog.Close>
          <Button
            type="button"
            onClick={() => {
              onSubmit(draftIds);
              onOpenChange(false);
            }}
          >
            {t('Save selection', { defaultValue: 'Save selection' })}
          </Button>
        </Dialog.Footer>
      </Dialog.ContentCombined>
    </Dialog>
  );
};
