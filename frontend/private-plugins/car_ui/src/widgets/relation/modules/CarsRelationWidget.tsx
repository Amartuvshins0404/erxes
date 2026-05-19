import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useInView } from 'react-intersection-observer';
import { Badge, Button, Empty, ScrollArea, Separator, Spinner } from 'erxes-ui';
import { IconCarSuv, IconLinkPlus, IconTrash } from '@tabler/icons-react';
import { useManageRelations, useRelations } from 'ui-modules';
import { useTranslation } from 'react-i18next';

import { SelectCarsDialog } from '~/components/select/SelectCarsDialog';
import { useCarsMain } from '~/hooks/useCarsData';
import { getCarDisplayName } from '~/lib/car';
import { ROOT_CAR_CONTENT_TYPE } from '~/lib/constants';

export const CarsRelationWidget = ({
  contentId,
  contentType,
}: {
  contentId: string;
  contentType: string;
}) => {
  const { t } = useTranslation('car');
  const [selectorOpen, setSelectorOpen] = useState(false);
  const { ownEntities, loading: loadingRelations } = useRelations({
    variables: {
      contentId,
      contentType,
      relatedContentType: ROOT_CAR_CONTENT_TYPE,
    },
  });
  const { manageRelations, loading: saving } = useManageRelations();

  const relatedCarIds = useMemo(
    () => Array.from(new Set(ownEntities.map((entity) => entity.contentId))),
    [ownEntities],
  );

  const {
    cars,
    loading: loadingCars,
    fetchingMore,
    hasMore,
    fetchMoreCars,
  } = useCarsMain(
    {
      ids: relatedCarIds,
      page: 1,
      perPage: 20,
      sortField: 'plateNumber',
      sortDirection: 1,
    },
    {
      skip: relatedCarIds.length === 0,
    },
  );

  const { ref: bottomRef } = useInView({
    onChange: (inView) => {
      if (inView) {
        fetchMoreCars?.();
      }
    },
  });

  const handleSaveRelations = (nextIds: string[]) => {
    manageRelations({
      contentId,
      contentType,
      relatedContentType: ROOT_CAR_CONTENT_TYPE,
      relatedContentIds: nextIds,
    });
  };

  if (loadingRelations || loadingCars) {
    return <Spinner containerClassName="py-20" />;
  }

  return (
    <>
      <div className="flex flex-none items-center justify-between gap-2 bg-background px-4 py-3">
        <div>
          <div className="font-medium text-primary">
            {t('Cars', { defaultValue: 'Cars' })}
          </div>
          <div className="text-xs text-muted-foreground">
            {t('Linked vehicle records for this timeline.', {
              defaultValue: 'Linked vehicle records for this timeline.',
            })}
          </div>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setSelectorOpen(true)}
        >
          <IconLinkPlus className="size-4" />
          {t('Attach cars', { defaultValue: 'Attach cars' })}
        </Button>
      </div>
      <Separator />

      {cars.length === 0 ? (
        <div className="flex flex-auto items-center justify-center p-6">
          <Empty>
            <Empty.Header>
              <Empty.Media variant="icon">
                <IconCarSuv />
              </Empty.Media>
              <Empty.Title>
                {t('No cars linked yet', {
                  defaultValue: 'No cars linked yet',
                })}
              </Empty.Title>
              <Empty.Description>
                {t(
                  'Attach one or more car records to keep this context connected.',
                  {
                    defaultValue:
                      'Attach one or more car records to keep this context connected.',
                  },
                )}
              </Empty.Description>
            </Empty.Header>
          </Empty>
        </div>
      ) : (
        <ScrollArea className="flex-auto">
          <div className="flex flex-col gap-3 p-4">
            {cars.map((car) => (
              <div
                key={car._id}
                className="rounded-lg border bg-background p-3 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Button
                      variant="link"
                      className="h-auto px-0 font-medium text-primary"
                      asChild
                    >
                      <Link to={`/car/${car._id}`}>
                        {getCarDisplayName(car, t)}
                      </Link>
                    </Button>
                    <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <Badge variant="secondary">
                        {car.category?.name ||
                          t('No category', { defaultValue: 'No category' })}
                      </Badge>
                      <span>
                        {t('VIN: {{vin}}', {
                          vin: car.vinNumber || '—',
                          defaultValue: 'VIN: {{vin}}',
                        })}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={saving}
                    onClick={() =>
                      handleSaveRelations(
                        relatedCarIds.filter(
                          (relatedId) => relatedId !== car._id,
                        ),
                      )
                    }
                  >
                    <IconTrash className="size-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
            {hasMore ? (
              <div
                ref={bottomRef}
                className="flex h-10 items-center gap-2 text-sm text-muted-foreground"
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
      )}

      <SelectCarsDialog
        open={selectorOpen}
        onOpenChange={setSelectorOpen}
        selectedIds={relatedCarIds}
        onSubmit={handleSaveRelations}
      />
    </>
  );
};
