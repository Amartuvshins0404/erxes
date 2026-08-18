import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { IconPlus } from '@tabler/icons-react';
import {
  Button,
  Kbd,
  PageSubHeader,
  usePreviousHotkeyScope,
  useQueryState,
  useScopedHotkeys,
  useSetHotkeyScope,
} from 'erxes-ui';
import { Can, usePermissionCheck } from 'ui-modules';
import { useTranslation } from 'react-i18next';

import { CarDetailSheet } from '~/components/cars/CarDetailSheet';
import { CarFormSheet } from '~/components/cars/CarFormSheet';
import { CarsFilter } from '~/components/cars/CarsFilter';
import { CarsRecordTable } from '~/components/cars/CarsRecordTable';
import { MergeCarsDialog } from '~/components/cars/MergeCarsDialog';
import { CarLayout } from '~/components/layout/CarLayout';
import { useCarCategories, useCarsMain } from '~/hooks/useCarsData';
import { useCarsQueryState } from '~/hooks/useCarsQueryState';
import { CarHotKeyScope } from '~/lib/hotkeys';
import { ICar } from '~/types/car';

const RESERVED_CAR_ROUTE_SEGMENTS = new Set(['categories', 'projects', 'tasks']);

export const CarsIndexPage = () => {
  const { t } = useTranslation('car');
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const setHotkeyScope = useSetHotkeyScope();
  const {
    setHotkeyScopeAndMemorizePreviousScope,
    goBackToPreviousHotkeyScope,
  } = usePreviousHotkeyScope();
  const { isLoaded: permissionsLoaded, hasActionPermission } =
    usePermissionCheck();
  const {
    filters,
    setSort,
  } = useCarsQueryState();
  const { carCategories } = useCarCategories();
  const [activeCarId, setActiveCarId] = useQueryState<string>('activeCarId');

  const variables = useMemo(
    () => ({
      page: 1,
      perPage: filters.perPage,
      categoryId: filters.categoryId || undefined,
      tag: filters.tag || undefined,
      segment: filters.segment || undefined,
      segmentData: filters.segmentData || undefined,
      searchValue: filters.searchValue || undefined,
      sortField: filters.sortField || undefined,
      sortDirection: filters.sortDirection || undefined,
      ids: filters.ids || undefined,
    }),
    [filters],
  );

  const {
    cars,
    totalCount,
    loading,
    error,
    refetch,
    fetchMoreCars,
    fetchingMore,
    hasMore,
  } = useCarsMain(variables);
  const [carFormOpen, setCarFormOpen] = useState(false);
  const [editingCar, setEditingCar] = useState<ICar | null>(null);
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false);
  const [mergeCars, setMergeCars] = useState<ICar[]>([]);
  const directRouteSegment = useMemo(() => {
    const match = pathname.match(/^\/car\/([^/?#]+)/);

    if (!match) {
      return undefined;
    }

    return decodeURIComponent(match[1]);
  }, [pathname]);
  const isReservedCarRouteSegment =
    !!directRouteSegment && RESERVED_CAR_ROUTE_SEGMENTS.has(directRouteSegment);
  const directRouteCarId =
    directRouteSegment && !isReservedCarRouteSegment
      ? directRouteSegment
      : undefined;
  const detailCarId = directRouteCarId || activeCarId;
  const canManageCars =
    permissionsLoaded && hasActionPermission('manageCars');

  useEffect(() => {
    if (isReservedCarRouteSegment && pathname !== '/car/categories') {
      navigate('/car', { replace: true });
    }
  }, [isReservedCarRouteSegment, navigate, pathname]);

  useEffect(() => {
    if (carFormOpen || editingCar) {
      return;
    }

    setHotkeyScope(
      detailCarId ? CarHotKeyScope.CarDetailSheet : CarHotKeyScope.CarsPage,
    );
  }, [carFormOpen, detailCarId, editingCar, setHotkeyScope]);

  const openCreateCar = useCallback(() => {
    if (!canManageCars) {
      return;
    }

    setEditingCar(null);
    setCarFormOpen(true);
    setHotkeyScopeAndMemorizePreviousScope(CarHotKeyScope.CarAddSheet);
  }, [
    canManageCars,
    setHotkeyScopeAndMemorizePreviousScope,
  ]);

  const openEditCar = useCallback(
    (car: ICar) => {
      if (!canManageCars) {
        return;
      }

      setActiveCarId(null);
      setEditingCar(car);
      setCarFormOpen(true);
      setHotkeyScopeAndMemorizePreviousScope(CarHotKeyScope.CarEditSheet);
    },
    [
      canManageCars,
      setActiveCarId,
      setHotkeyScopeAndMemorizePreviousScope,
    ],
  );

  const closeCarForm = useCallback(() => {
    setCarFormOpen(false);
    setEditingCar(null);
    goBackToPreviousHotkeyScope();
  }, [goBackToPreviousHotkeyScope]);

  useScopedHotkeys(
    'c',
    () => {
      openCreateCar();
    },
    CarHotKeyScope.CarsPage,
    [openCreateCar],
  );

  useScopedHotkeys(
    'esc',
    () => {
      closeCarForm();
    },
    CarHotKeyScope.CarAddSheet,
    [closeCarForm],
  );

  useScopedHotkeys(
    'esc',
    () => {
      closeCarForm();
    },
    CarHotKeyScope.CarEditSheet,
    [closeCarForm],
  );

  const handleCloseDetail = useCallback(() => {
    setActiveCarId(null);

    if (directRouteCarId) {
      navigate('/car', { replace: true });
    }
  }, [directRouteCarId, navigate, setActiveCarId]);

  const handleTagsUpdated = useCallback(() => {
    void refetch();
  }, [refetch]);

  return (
    <CarLayout
      activeModule="cars"
      actions={
        <Can action="manageCars">
          <Button onClick={openCreateCar}>
            <IconPlus />
            {t('Add car', { defaultValue: 'Add car' })}
            <Kbd>C</Kbd>
          </Button>
        </Can>
      }
    >
      <PageSubHeader>
        <CarsFilter totalCount={totalCount} />
      </PageSubHeader>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {error ? (
          <div className="m-4 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm">
            <div className="font-medium text-destructive">
              {t('Could not load cars', {
                defaultValue: 'Could not load cars',
              })}
            </div>
            <p className="mt-1 text-muted-foreground">{error.message}</p>
          </div>
        ) : (
          <>
            <CarsRecordTable
              cars={cars}
              loading={loading}
              fetchingMore={fetchingMore}
              hasMore={hasMore}
              onFetchMore={fetchMoreCars}
              sortField={filters.sortField}
              sortDirection={filters.sortDirection}
              onSort={setSort}
              onOpenCar={(carId) => setActiveCarId(carId)}
              onEditCar={openEditCar}
              onMergeSelected={(selectedCars) => {
                setMergeCars(selectedCars);
                setMergeDialogOpen(true);
              }}
              onTagsUpdated={handleTagsUpdated}
            />
          </>
        )}
      </div>

      {detailCarId ? (
        <CarDetailSheet
          carId={detailCarId}
          notifyOnMissing={!!directRouteCarId}
          onClose={handleCloseDetail}
        />
      ) : null}

      <CarFormSheet
        open={carFormOpen || !!editingCar}
        onOpenChange={(open) => {
          if (!open) {
            closeCarForm();
          }
        }}
        car={editingCar}
        categories={carCategories}
      />

      <MergeCarsDialog
        open={mergeDialogOpen}
        onOpenChange={(open) => {
          setMergeDialogOpen(open);
          if (!open) {
            setMergeCars([]);
          }
        }}
        cars={mergeCars}
        categories={carCategories}
      />
    </CarLayout>
  );
};
