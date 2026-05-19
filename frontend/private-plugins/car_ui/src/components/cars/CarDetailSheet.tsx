import { useEffect, useRef, useState } from 'react';
import {
  Badge,
  Button,
  Combobox,
  FocusSheet,
  InfoCard,
  ScrollArea,
  Sheet,
  Sidebar,
  Spinner,
  Tabs,
  TextOverflowTooltip,
  toast,
  useConfirm,
  useQueryState,
} from 'erxes-ui';
import {
  IconActivity,
  IconCalendar,
  IconCarSuv,
  IconEdit,
  IconInfoCircle,
  IconTags,
  IconTrash,
} from '@tabler/icons-react';
import {
  ActivityLogs,
  AddInternalNote,
  Can,
  TagsSelect,
} from 'ui-modules';
import { useTranslation } from 'react-i18next';

import { CarFormSheet } from '~/components/cars/CarFormSheet';
import { CarRelationWidgetSideTabs } from '~/components/cars/CarRelationWidgetSideTabs';
import { CarPropertiesInDetail } from '~/components/properties/CarPropertiesInDetail';
import { useCarCustomFieldEdit } from '~/hooks/useCarCustomFieldEdit';
import {
  useCarCategories,
  useCarDetail,
} from '~/hooks/useCarsData';
import { useCarMutations } from '~/hooks/useCarMutations';
import {
  formatDateTime,
  getCarDisplayName,
  getCarOptionLabel,
} from '~/lib/car';
import { customFieldsDataToPropertiesData } from '~/lib/customFields';
import {
  CAR_BODY_TYPE_OPTIONS,
  CAR_FUEL_TYPE_OPTIONS,
  CAR_GEARBOX_OPTIONS,
  ROOT_CAR_CONTENT_TYPE,
} from '~/lib/constants';

const DETAIL_TABS = [
  {
    value: 'overview',
    label: 'Overview',
    icon: IconInfoCircle,
  },
  {
    value: 'properties',
    label: 'Properties',
    icon: IconTags,
  },
  {
    value: 'activity',
    label: 'Activity',
    icon: IconActivity,
  },
] as const;

const DetailRow = ({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) => {
  return (
    <div className="grid grid-cols-1 gap-1 border-b border-border/60 py-3 last:border-none sm:grid-cols-[140px_minmax(0,1fr)] sm:gap-4">
      <div className="text-xs font-mono uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="min-w-0 text-sm">{value}</div>
    </div>
  );
};

export const CarDetailSheet = ({
  carId,
  notifyOnMissing = false,
  onClose,
}: {
  carId?: string | null;
  notifyOnMissing?: boolean;
  onClose: () => void;
}) => {
  const { t } = useTranslation('car');
  const { confirm } = useConfirm();
  const { car, loading, error, refetch } = useCarDetail(carId || undefined);
  const { carCategories } = useCarCategories();
  const { carsRemove } = useCarMutations();
  const [editOpen, setEditOpen] = useState(false);
  const [tab, setTab] = useQueryState<string>('carTab');
  const missingToastIdRef = useRef<string | null>(null);
  const activeTab = tab || 'overview';
  const updatedAtText = car
    ? t('Updated {{date}}', {
        date: formatDateTime(car.modifiedAt || car.createdAt),
        defaultValue: 'Updated {{date}}',
      })
    : '';

  useEffect(() => {
    if (!carId || loading) {
      return;
    }

    if (!error && car) {
      missingToastIdRef.current = null;
      return;
    }

    if (missingToastIdRef.current === carId) {
      return;
    }

    missingToastIdRef.current = carId;
    if (notifyOnMissing) {
      toast({
        title: t('Car not found', { defaultValue: 'Car not found' }),
        description: t('The requested car record could not be loaded.', {
          defaultValue: 'The requested car record could not be loaded.',
        }),
        variant: 'destructive',
      });
    }
    onClose();
  }, [car, carId, error, loading, notifyOnMissing, onClose, t]);

  const bodyTypeLabel = getCarOptionLabel(
    CAR_BODY_TYPE_OPTIONS,
    car?.bodyType,
    t,
  );
  const fuelTypeLabel = getCarOptionLabel(
    CAR_FUEL_TYPE_OPTIONS,
    car?.fuelType,
    t,
  );
  const gearBoxLabel = getCarOptionLabel(CAR_GEARBOX_OPTIONS, car?.gearBox, t);
  const quickFacts = [
    car?.category?.name,
    car?.bodyType ? bodyTypeLabel : null,
    car?.fuelType ? fuelTypeLabel : null,
    car?.gearBox ? gearBoxLabel : null,
  ].filter(Boolean);

  const handleDelete = async () => {
    if (!car?._id) {
      return;
    }

    await confirm({
      message: t('Delete {{name}}?', {
        name: getCarDisplayName(car, t),
        defaultValue: 'Delete {{name}}?',
      }),
      options: {
        okLabel: t('Delete', { defaultValue: 'Delete' }),
        description: t('This permanently removes the car record.', {
          defaultValue: 'This permanently removes the car record.',
        }),
      },
    });

    await carsRemove({
      variables: {
        carIds: [car._id],
      },
    });

    onClose();
  };

  return (
    <FocusSheet open={!!carId} onOpenChange={(open) => !open && onClose()}>
      <FocusSheet.View
        loading={loading}
      >
        <FocusSheet.Header
          title={
            car ? getCarDisplayName(car, t) : t('Car detail', { defaultValue: 'Car detail' })
          }
          description={t('View and manage car details.', {
            defaultValue: 'View and manage car details.',
          })}
        />

        {car ? (
          <FocusSheet.Content className="flex-auto flex-row overflow-hidden">
            <FocusSheet.SideBar>
              <Sidebar.Content>
                <Sidebar.Group>
                  <Sidebar.GroupContent className="mt-2">
                    <Sidebar.Menu>
                      {DETAIL_TABS.map((item) => (
                        <Sidebar.MenuItem key={item.value}>
                          <Sidebar.MenuButton
                            isActive={activeTab === item.value}
                            onClick={() => setTab(item.value)}
                          >
                            <item.icon />
                            {t(item.label, { defaultValue: item.label })}
                          </Sidebar.MenuButton>
                        </Sidebar.MenuItem>
                      ))}
                    </Sidebar.Menu>
                  </Sidebar.GroupContent>
                </Sidebar.Group>
              </Sidebar.Content>
            </FocusSheet.SideBar>

            <div className="flex min-w-0 flex-1 flex-col">
              <Tabs
                value={activeTab}
                onValueChange={setTab}
                className="flex min-h-0 flex-1 flex-col"
              >
                <Tabs.Content
                  value="overview"
                  className="min-h-0 flex-1 data-[state=active]:flex"
                >
                  <ScrollArea className="flex-1">
                    <div className="grid gap-4 p-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)]">
                      <InfoCard
                        title={t('Car Profile', {
                          defaultValue: 'Car Profile',
                        })}
                      >
                        <InfoCard.Content>
                          <div className="mb-2 flex flex-wrap gap-2">
                            <Badge variant="secondary">
                              <IconCarSuv className="size-4" />
                              {getCarDisplayName(car, t)}
                            </Badge>
                            {quickFacts.map((fact) => (
                              <Badge key={fact} variant="secondary">
                                {fact}
                              </Badge>
                            ))}
                          </div>
                          <DetailRow
                            label={t('Plate number', {
                              defaultValue: 'Plate number',
                            })}
                            value={car.plateNumber || '—'}
                          />
                          <DetailRow
                            label={t('VIN', { defaultValue: 'VIN' })}
                            value={car.vinNumber || '—'}
                          />
                          <DetailRow
                            label={t('Category', { defaultValue: 'Category' })}
                            value={car.category?.name || '—'}
                          />
                          <DetailRow
                            label={t('Owner', { defaultValue: 'Owner' })}
                            value={
                              car.owner?.details?.fullName ||
                              car.owner?.email ||
                              '—'
                            }
                          />
                          <DetailRow
                            label={t('Body type', {
                              defaultValue: 'Body type',
                            })}
                            value={bodyTypeLabel}
                          />
                          <DetailRow
                            label={t('Fuel type', {
                              defaultValue: 'Fuel type',
                            })}
                            value={fuelTypeLabel}
                          />
                          <DetailRow
                            label={t('Gearbox', { defaultValue: 'Gearbox' })}
                            value={gearBoxLabel}
                          />
                          <DetailRow
                            label={t('Vintage year', {
                              defaultValue: 'Vintage year',
                            })}
                            value={car.vintageYear || '—'}
                          />
                          <DetailRow
                            label={t('Import year', {
                              defaultValue: 'Import year',
                            })}
                            value={car.importYear || '—'}
                          />
                          <DetailRow
                            label={t('Color', { defaultValue: 'Color' })}
                            value={
                              car.colorCode ? (
                                <div className="flex items-center gap-2">
                                  <span
                                    className="size-4 rounded-full border"
                                    style={{ backgroundColor: car.colorCode }}
                                  />
                                  <span>{car.colorCode}</span>
                                </div>
                              ) : (
                                '—'
                              )
                            }
                          />
                          <DetailRow
                            label={t('Description', {
                              defaultValue: 'Description',
                            })}
                            value={
                              car.description ? (
                                <p className="whitespace-pre-wrap text-sm">
                                  {car.description}
                                </p>
                              ) : (
                                '—'
                              )
                            }
                          />
                        </InfoCard.Content>
                      </InfoCard>

                      <div className="space-y-4">
                        <InfoCard
                          title={t('Metadata', { defaultValue: 'Metadata' })}
                        >
                          <InfoCard.Content>
                            <DetailRow
                              label={t('Created', { defaultValue: 'Created' })}
                              value={formatDateTime(car.createdAt)}
                            />
                            <DetailRow
                              label={t('Modified', {
                                defaultValue: 'Modified',
                              })}
                              value={formatDateTime(car.modifiedAt)}
                            />
                            <DetailRow
                              label={t('Merged IDs', {
                                defaultValue: 'Merged IDs',
                              })}
                              value={
                                car.mergedIds?.length ? (
                                  <div className="flex flex-wrap gap-2">
                                    {car.mergedIds.map((mergedId) => (
                                      <Badge key={mergedId} variant="secondary">
                                        {mergedId}
                                      </Badge>
                                    ))}
                                  </div>
                                ) : (
                                  '—'
                                )
                              }
                            />
                            <DetailRow
                              label={t('Tags', { defaultValue: 'Tags' })}
                              value={
                                <TagsSelect.Provider
                                  mode="multiple"
                                  type={ROOT_CAR_CONTENT_TYPE}
                                  targetIds={[car._id]}
                                  value={car.tagIds || []}
                                  options={() => ({
                                    refetchQueries: 'active',
                                    awaitRefetchQueries: true,
                                    onCompleted: () => {
                                      void refetch();
                                    },
                                  })}
                                >
                                  <div className="flex flex-wrap items-center gap-2">
                                    {car.getTags?.length ? (
                                      car.getTags.map((tag) => (
                                        <Badge
                                          key={tag._id}
                                          variant="secondary"
                                        >
                                          {tag.name || tag._id}
                                        </Badge>
                                      ))
                                    ) : (
                                      <span className="text-muted-foreground">
                                        {t('No tags', {
                                          defaultValue: 'No tags',
                                        })}
                                      </span>
                                    )}
                                    <Can action="manageCars">
                                      <TagsSelect.Trigger
                                        variant="secondary"
                                        size="sm"
                                        placeholder={t('Edit tags', {
                                          defaultValue: 'Edit tags',
                                        })}
                                      />
                                    </Can>
                                  </div>
                                  <Combobox.Content className="w-80">
                                    <TagsSelect.Content />
                                  </Combobox.Content>
                                </TagsSelect.Provider>
                              }
                            />
                          </InfoCard.Content>
                        </InfoCard>

                        {car.attachment?.url ? (
                          <InfoCard
                            title={t('Featured Image', {
                              defaultValue: 'Featured Image',
                            })}
                          >
                            <InfoCard.Content>
                              <img
                                src={car.attachment.url}
                                alt={getCarDisplayName(car, t)}
                                className="aspect-[4/3] w-full rounded-lg object-cover"
                              />
                            </InfoCard.Content>
                          </InfoCard>
                        ) : null}
                      </div>
                    </div>
                  </ScrollArea>
                </Tabs.Content>

                <Tabs.Content
                  value="properties"
                  className="min-h-0 flex-1 data-[state=active]:flex"
                >
                  <ScrollArea className="flex-1">
                    <div className="p-4">
                      <CarPropertiesInDetail
                        title={t('Car Properties', {
                          defaultValue: 'Car Properties',
                        })}
                        fieldContentType={ROOT_CAR_CONTENT_TYPE}
                        propertiesData={customFieldsDataToPropertiesData(
                          car.customFieldsData,
                        )}
                        mutateHook={useCarCustomFieldEdit}
                        id={car._id}
                      />
                    </div>
                  </ScrollArea>
                </Tabs.Content>

                <Tabs.Content
                  value="activity"
                  className="min-h-0 flex-1 data-[state=active]:flex"
                >
                  <ScrollArea className="flex-1">
                    <div className="mx-auto flex max-w-5xl flex-col gap-4 p-4">
                      <AddInternalNote
                        contentType={ROOT_CAR_CONTENT_TYPE}
                        contentTypeId={car._id}
                      />
                      <ActivityLogs
                        targetId={car._id}
                        emptyMessage={t(
                          'No activity has been recorded for this car yet.',
                          {
                            defaultValue:
                              'No activity has been recorded for this car yet.',
                          },
                        )}
                      />
                    </div>
                  </ScrollArea>
                </Tabs.Content>
              </Tabs>

              <Sheet.Footer className="flex-none flex-wrap justify-end gap-2 border-t">
                <div className="flex min-w-0 basis-full items-center gap-2 text-sm text-muted-foreground">
                  <IconCalendar className="size-4 shrink-0" />
                  <TextOverflowTooltip value={updatedAtText} />
                </div>
                <Can action="manageCars">
                  <Button
                    variant="secondary"
                    className="shrink-0"
                    onClick={() => setEditOpen(true)}
                  >
                    <IconEdit />
                    {t('Edit', { defaultValue: 'Edit' })}
                  </Button>
                </Can>
                <Can action="manageCars">
                  <Button
                    variant="destructive"
                    className="shrink-0"
                    onClick={handleDelete}
                  >
                    <IconTrash />
                    {t('Delete', { defaultValue: 'Delete' })}
                  </Button>
                </Can>
                <Sheet.Close asChild>
                  <Button variant="secondary" className="shrink-0">
                    {t('Close', { defaultValue: 'Close' })}
                  </Button>
                </Sheet.Close>
              </Sheet.Footer>
            </div>
            <CarRelationWidgetSideTabs
              carId={car._id}
              companies={car.companies || []}
              customers={car.customers || []}
              onRelationsChange={() => refetch()}
            />
          </FocusSheet.Content>
        ) : loading ? (
          <div className="flex flex-1 items-center justify-center">
            <Spinner />
          </div>
        ) : null}
      </FocusSheet.View>

      <CarFormSheet
        open={editOpen}
        onOpenChange={setEditOpen}
        car={car}
        categories={carCategories}
      />
    </FocusSheet>
  );
};
