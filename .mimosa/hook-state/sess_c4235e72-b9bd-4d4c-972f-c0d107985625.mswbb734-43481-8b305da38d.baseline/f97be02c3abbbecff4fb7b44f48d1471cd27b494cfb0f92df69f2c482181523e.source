import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import { IconCarSuv, IconExternalLink } from '@tabler/icons-react';
import { Badge, Button, Empty, InfoCard, ScrollArea, Spinner } from 'erxes-ui';
import { useTranslation } from 'react-i18next';
import { TNotification } from 'ui-modules';

import { useCarDetail } from '~/hooks/useCarsData';
import {
  formatDateTime,
  getCarDisplayName,
  getCarOptionLabel,
} from '~/lib/car';
import {
  CAR_BODY_TYPE_OPTIONS,
  CAR_FUEL_TYPE_OPTIONS,
  CAR_GEARBOX_OPTIONS,
} from '~/lib/constants';

const DetailRow = ({ label, value }: { label: string; value: ReactNode }) => (
  <div className="grid grid-cols-[120px_minmax(0,1fr)] gap-3 border-b border-border/60 py-3 last:border-none">
    <div className="text-xs font-mono uppercase tracking-wide text-muted-foreground">
      {label}
    </div>
    <div className="min-w-0 text-sm">{value || '—'}</div>
  </div>
);

const NotificationUnavailable = ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => (
  <div className="flex min-h-screen items-center justify-center p-6">
    <Empty>
      <Empty.Header>
        <Empty.Media variant="icon">
          <IconCarSuv />
        </Empty.Media>
        <Empty.Title>{title}</Empty.Title>
        <Empty.Description>{description}</Empty.Description>
      </Empty.Header>
    </Empty>
  </div>
);

const NotificationWidget = ({ contentTypeId }: TNotification) => {
  const { t } = useTranslation('car');
  const { car, loading } = useCarDetail(contentTypeId);

  if (!contentTypeId) {
    return (
      <NotificationUnavailable
        title={t('Car not found', { defaultValue: 'Car not found' })}
        description={t('This notification is not linked to a car record.', {
          defaultValue: 'This notification is not linked to a car record.',
        })}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!car) {
    return (
      <NotificationUnavailable
        title={t('Car not found', { defaultValue: 'Car not found' })}
        description={t('The linked car record could not be loaded.', {
          defaultValue: 'The linked car record could not be loaded.',
        })}
      />
    );
  }

  const bodyTypeLabel = getCarOptionLabel(
    CAR_BODY_TYPE_OPTIONS,
    car.bodyType,
    t,
  );
  const fuelTypeLabel = getCarOptionLabel(
    CAR_FUEL_TYPE_OPTIONS,
    car.fuelType,
    t,
  );
  const gearBoxLabel = getCarOptionLabel(CAR_GEARBOX_OPTIONS, car.gearBox, t);

  return (
    <ScrollArea className="h-full" viewportClassName="[&>div]:min-h-screen">
      <div className="flex min-h-screen flex-col gap-4 p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <Badge variant="secondary">
              <IconCarSuv className="size-4" />
              {t('Cars', { defaultValue: 'Cars' })}
            </Badge>
            <div>
              <h2 className="text-xl font-semibold">
                {getCarDisplayName(car, t)}
              </h2>
              <p className="text-sm text-muted-foreground">
                {t('Updated {{date}}', {
                  date: formatDateTime(car.modifiedAt || car.createdAt),
                  defaultValue: 'Updated {{date}}',
                })}
              </p>
            </div>
          </div>
          <Button asChild variant="secondary" size="sm">
            <Link to={`/car/${car._id}`}>
              <IconExternalLink className="size-4" />
              {t('Open car', { defaultValue: 'Open car' })}
            </Link>
          </Button>
        </div>

        <InfoCard title={t('Car Details', { defaultValue: 'Car Details' })}>
          <InfoCard.Content>
            <DetailRow
              label={t('Plate number', { defaultValue: 'Plate number' })}
              value={car.plateNumber}
            />
            <DetailRow
              label={t('VIN', { defaultValue: 'VIN' })}
              value={car.vinNumber}
            />
            <DetailRow
              label={t('Category', { defaultValue: 'Category' })}
              value={car.category?.name}
            />
            <DetailRow
              label={t('Body type', { defaultValue: 'Body type' })}
              value={car.bodyType ? bodyTypeLabel : '—'}
            />
            <DetailRow
              label={t('Fuel type', { defaultValue: 'Fuel type' })}
              value={car.fuelType ? fuelTypeLabel : '—'}
            />
            <DetailRow
              label={t('Gear box', { defaultValue: 'Gear box' })}
              value={car.gearBox ? gearBoxLabel : '—'}
            />
            <DetailRow
              label={t('Vintage year', { defaultValue: 'Vintage year' })}
              value={car.vintageYear}
            />
            <DetailRow
              label={t('Import year', { defaultValue: 'Import year' })}
              value={car.importYear}
            />
            <DetailRow
              label={t('Description', { defaultValue: 'Description' })}
              value={car.description}
            />
          </InfoCard.Content>
        </InfoCard>
      </div>
    </ScrollArea>
  );
};

export default NotificationWidget;
