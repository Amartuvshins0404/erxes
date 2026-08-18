import type { ComponentProps } from 'react';
import { useMemo } from 'react';
import { Empty, RecordTable } from 'erxes-ui';
import { IconCarSuv } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

import { createCarsColumns } from './CarsColumns';
import { CarsCommandBar } from './CarsCommandBar';
import { ICar } from '~/types/car';

const CarsRow = ({
  original,
  children,
  onOpenCar,
  ...props
}: ComponentProps<typeof RecordTable.Row> & {
  onOpenCar?: (carId: string) => void;
}) => {
  return (
    <RecordTable.Row
      {...props}
      original={original}
      className="cursor-pointer"
      onClick={(event) => {
        const target = event.target as HTMLElement;

        if (
          target.closest(
            'a,button,input,[role="checkbox"],[cmdk-item],[data-radix-collection-item]',
          )
        ) {
          return;
        }

        if (original?._id) {
          onOpenCar?.(original._id);
        }
      }}
    >
      {children}
    </RecordTable.Row>
  );
};

export const CarsRecordTable = ({
  cars,
  loading,
  fetchingMore,
  hasMore,
  onFetchMore,
  sortField,
  sortDirection,
  onSort,
  onOpenCar,
  onEditCar,
  onMergeSelected,
  onTagsUpdated,
}: {
  cars: ICar[];
  loading: boolean;
  fetchingMore: boolean;
  hasMore: boolean;
  onFetchMore?: () => void;
  sortField: string | null;
  sortDirection: number | null;
  onSort: (field: string) => void;
  onOpenCar: (carId: string) => void;
  onEditCar: (car: ICar) => void;
  onMergeSelected: (cars: ICar[]) => void;
  onTagsUpdated?: () => void;
}) => {
  const { t } = useTranslation('car');
  const columns = useMemo(
    () =>
      createCarsColumns({
        sortField,
        sortDirection,
        onSort,
        onEditCar,
        t,
      }),
    [onEditCar, onOpenCar, onSort, sortDirection, sortField, t],
  );

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <RecordTable.Provider
        columns={columns}
        data={cars}
        stickyColumns={['more', 'checkbox', 'plateNumber']}
        tableId="cars-record-table"
        className="m-3 mb-0 overflow-hidden"
      >
        <CarsCommandBar
          onMergeSelected={onMergeSelected}
          onTagsUpdated={onTagsUpdated}
        />
        {loading ? (
          <RecordTable.Scroll>
            <RecordTable>
              <RecordTable.Header />
              <RecordTable.Body>
                <RecordTable.RowSkeleton rows={12} />
              </RecordTable.Body>
            </RecordTable>
          </RecordTable.Scroll>
        ) : cars.length ? (
          <RecordTable.Scroll>
            <RecordTable>
              <RecordTable.Header />
              <RecordTable.Body>
                <RecordTable.RowList
                  Row={(props) => (
                    <CarsRow {...props} onOpenCar={onOpenCar} />
                  )}
                />
                {hasMore ? (
                  <RecordTable.RowSkeleton
                    rows={fetchingMore ? 3 : 1}
                    handleInView={onFetchMore}
                  />
                ) : null}
              </RecordTable.Body>
            </RecordTable>
          </RecordTable.Scroll>
        ) : (
          <div className="p-6">
            <Empty>
              <Empty.Header>
                <Empty.Media variant="icon">
                  <IconCarSuv />
                </Empty.Media>
                <Empty.Title>
                  {t('No cars found', { defaultValue: 'No cars found' })}
                </Empty.Title>
                <Empty.Description>
                  {t(
                    'Adjust filters or create a new car to start building the garage.',
                    {
                      defaultValue:
                        'Adjust filters or create a new car to start building the garage.',
                    },
                  )}
                </Empty.Description>
              </Empty.Header>
            </Empty>
          </div>
        )}
      </RecordTable.Provider>
    </div>
  );
};
