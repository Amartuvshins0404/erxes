import { useEffect, useState } from 'react';
import { useApolloClient, useLazyQuery, useQuery } from '@apollo/client';
import { useSearchParams } from 'react-router-dom';
import { Button, Dialog, ToggleGroup } from 'erxes-ui';
import {
  IconCalendarMonth,
  IconQrcode,
  IconList,
  IconTimeline,
} from '@tabler/icons-react';
import { BookingsList } from '~/modules/booking/components/BookingsList';
import { BookingsCalendar } from '~/modules/booking/components/BookingsCalendar';
import { BookingsLog } from '~/modules/booking/components/BookingsLog';
import { CreateBookingDialog } from '~/modules/booking/components/CreateBookingDialog';
import { BookingFiltersComponent } from '~/modules/booking/components/BookingFilters';
import {
  BookingFilters,
  OneFitBooking,
  BookingStatus,
} from '~/modules/booking/types/booking';
import { OneFitListPageLayout } from '~/components/OneFitListPageLayout';
import { ActivityLanguage } from '~/modules/activity-type/utils/localization';
import { ScanBookingQrDialog } from '~/modules/booking/components/ScanBookingQrDialog';
import { BulkAttendanceResultDialog } from '~/modules/booking/components/BulkAttendanceResultDialog';
import { ConfirmBookingAttendanceDialog } from '~/modules/booking/components/ConfirmBookingAttendanceDialog';
import { SelectCustomerBookingDialog } from '~/modules/booking/components/SelectCustomerBookingDialog';
import { ONE_FIT_BOOKINGS } from '~/modules/booking/graphql/bookingQueries';
import {
  useMarkAttendanceBulk,
  MarkAttendanceBulkResult,
} from '~/modules/booking/hooks/useBookingMutations';
import { toast } from 'erxes-ui';
import { useOneFitMode } from '~/modules/config/hooks/useOneFitMode';
import { ONE_FIT_CUSTOMER } from '~/modules/onefitCustomer/graphql/onefitCustomerQueries';

const BOOKINGS_VIEWS = ['list', 'calendar', 'log'] as const;
type BookingsView = (typeof BOOKINGS_VIEWS)[number];

function parseViewFromSearchParams(
  searchParams: URLSearchParams,
): BookingsView {
  const viewParam = searchParams.get('view');
  if (viewParam === 'list' || viewParam === 'calendar' || viewParam === 'log') {
    return viewParam;
  }
  return 'log';
}

export function BookingsPage() {
  const { isSlaveMode } = useOneFitMode();
  const client = useApolloClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const { markAttendanceBulk, loading: markAllLoading } =
    useMarkAttendanceBulk();

  const [viewSelectorOpen, setViewSelectorOpen] = useState(false);
  const [scannedCustomerId, setScannedCustomerId] = useState<string | null>(
    null,
  );
  const [noBookingDialogOpen, setNoBookingDialogOpen] = useState(false);

  const view = parseViewFromSearchParams(searchParams);
  const setView = (newView: BookingsView) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('view', newView);
      return next;
    });
  };

  useEffect(() => {
    const hasViewParam = searchParams.get('view');
    if (!hasViewParam) {
      setViewSelectorOpen(true);
    }
  }, [searchParams]);
  const [filters, setFilters] = useState<BookingFilters>({});
  const [scanDialogOpen, setScanDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [confirmBooking, setConfirmBooking] = useState<OneFitBooking | null>(
    null,
  );
  const [pickerBookings, setPickerBookings] = useState<OneFitBooking[]>([]);
  const [bulkResult, setBulkResult] = useState<MarkAttendanceBulkResult | null>(
    null,
  );
  const [bulkResultDialogOpen, setBulkResultDialogOpen] = useState(false);
  const [language, setLanguage] = useState<ActivityLanguage>('mn');

  const [fetchBookingsByCustomer, { loading: bookingsLoading }] = useLazyQuery(
    ONE_FIT_BOOKINGS,
    {
      onCompleted(data) {
        const list = data?.oneFitBookings?.list ?? [];
        if (list.length === 0) {
          setConfirmDialogOpen(false);
          toast({
            title: 'Захиалга байхгүй',
            description: 'Энэ гишүүнд захиалга олдсонгүй.',
          });
          setNoBookingDialogOpen(true);
          return;
        }
        setConfirmDialogOpen(false);
        setPickerBookings(list);
        setPickerOpen(true);
      },
    },
  );

  const { data: scannedCustomerData } = useQuery(ONE_FIT_CUSTOMER, {
    skip: !scannedCustomerId,
    variables: { _id: scannedCustomerId || '' },
  });

  function handleScanSuccess(customerId: string) {
    setScanDialogOpen(false);
    setScannedCustomerId(customerId);
    setConfirmBooking(null);
    setConfirmDialogOpen(true);
    fetchBookingsByCustomer({
      variables: {
        userId: customerId,
        status: BookingStatus.CONFIRMED,
        limit: 10,
      },
    });

    client.refetchQueries({
      include: [ONE_FIT_BOOKINGS],
    });
  }

  function handleConfirmDialogClose() {
    setConfirmDialogOpen(false);
    setConfirmBooking(null);
  }

  function handleSelectBooking(booking: OneFitBooking) {
    setPickerOpen(false);
    setPickerBookings([]);
    setConfirmBooking(booking);
    setConfirmDialogOpen(true);
  }

  async function handleMarkAllBookings(bookingIds: string[]) {
    const result = await markAttendanceBulk(bookingIds, { skipToast: true });
    setPickerOpen(false);
    setPickerBookings([]);
    if (result) {
      setBulkResult(result);
      setBulkResultDialogOpen(true);
    }
  }

  function handleBulkResultDialogClose() {
    setBulkResultDialogOpen(false);
    setBulkResult(null);
  }

  function handleInitialViewSelect(nextView: BookingsView) {
    setView(nextView);
    setViewSelectorOpen(false);
  }

  function ViewComponent({
    filters: f,
  }: {
    filters: BookingFilters;
    language: ActivityLanguage;
  }) {
    if (view === 'calendar') {
      return <BookingsCalendar filters={f} />;
    }

    if (view === 'log') {
      return <BookingsLog filters={f} preferredLanguage={language} />;
    }

    return <BookingsList filters={f} preferredLanguage={language} />;
  }

  return (
    <>
      <OneFitListPageLayout
        pageName="Bookings"
        filters={filters}
        onFiltersChange={setFilters}
        filtersComponent={BookingFiltersComponent}
        createDialog={
          <div className="flex items-center gap-2">
            {!isSlaveMode && <CreateBookingDialog />}
            <Button
              type="button"
              variant="outline"
              onClick={() => setScanDialogOpen(true)}
            >
              <IconQrcode className="h-4 w-4 mr-2" />
              Гишүүн ирц бүртгэх
            </Button>
          </div>
        }
        listComponent={({ filters }) => (
          <ViewComponent filters={filters} language={language} />
        )}
        headerActions={
          <div className="flex items-center gap-2">
            <ToggleGroup
              type="single"
              value={view}
              onValueChange={(v) => v && setView(v as BookingsView)}
              variant="outline"
              size="sm"
            >
              <ToggleGroup.Item value="list" aria-label="List view">
                <IconList className="h-4 w-4 mr-1.5" />
                Жагсаалт
              </ToggleGroup.Item>
              <ToggleGroup.Item value="calendar" aria-label="Calendar view">
                <IconCalendarMonth className="h-4 w-4 mr-1.5" />
                Календар
              </ToggleGroup.Item>
              <ToggleGroup.Item value="log" aria-label="Attendance log view">
                <IconTimeline className="h-4 w-4 mr-1.5" />
                Ирцийн лог
              </ToggleGroup.Item>
            </ToggleGroup>

            <ToggleGroup
              type="single"
              value={language}
              onValueChange={(value) => {
                if (value === 'en' || value === 'mn') {
                  setLanguage(value);
                }
              }}
              variant="outline"
              size="sm"
            >
              <ToggleGroup.Item value="en" aria-label="English">
                EN
              </ToggleGroup.Item>
              <ToggleGroup.Item value="mn" aria-label="Mongolian">
                MN
              </ToggleGroup.Item>
            </ToggleGroup>
          </div>
        }
      />

      <ScanBookingQrDialog
        open={scanDialogOpen}
        onOpenChange={setScanDialogOpen}
        onScanSuccess={handleScanSuccess}
      />

      <ConfirmBookingAttendanceDialog
        booking={confirmBooking}
        loading={bookingsLoading}
        error={null}
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        onClose={handleConfirmDialogClose}
      />

      <SelectCustomerBookingDialog
        bookings={pickerBookings}
        open={pickerOpen}
        onOpenChange={(open) => {
          setPickerOpen(open);
          if (!open) {
            setPickerBookings([]);
          }
        }}
        onSelectBooking={handleSelectBooking}
        onConfirmSelection={handleMarkAllBookings}
      />

      <BulkAttendanceResultDialog
        result={bulkResult}
        open={bulkResultDialogOpen}
        onOpenChange={setBulkResultDialogOpen}
        onClose={handleBulkResultDialogClose}
      />

      <Dialog
        open={noBookingDialogOpen}
        onOpenChange={(open) => {
          setNoBookingDialogOpen(open);
          if (!open) {
            setScannedCustomerId(null);
          }
        }}
      >
        <Dialog.Content className="max-w-sm">
          <Dialog.Header>
            <Dialog.Title>Захиалга олдсонгүй</Dialog.Title>
            <Dialog.Description>
              Энэ гишүүний идэвхтэй захиалга олдсонгүй.
            </Dialog.Description>
          </Dialog.Header>
          <div className="py-4 text-sm">
            {scannedCustomerData?.oneFitCustomer && (
              <div className="mb-3">
                <p className="text-xs font-medium text-muted-foreground">
                  Гишүүн
                </p>
                <p className="text-sm font-semibold">
                  {[
                    scannedCustomerData.oneFitCustomer.firstName,
                    scannedCustomerData.oneFitCustomer.lastName,
                  ]
                    .filter(Boolean)
                    .join(' ') ||
                    scannedCustomerData.oneFitCustomer.primaryEmail ||
                    scannedCustomerData.oneFitCustomer.primaryPhone}
                </p>
                {(scannedCustomerData.oneFitCustomer.primaryEmail ||
                  scannedCustomerData.oneFitCustomer.primaryPhone) && (
                  <p className="text-xs text-muted-foreground">
                    {scannedCustomerData.oneFitCustomer.primaryEmail ||
                      scannedCustomerData.oneFitCustomer.primaryPhone}
                  </p>
                )}
              </div>
            )}
            {scannedCustomerId && (
              <p className="mb-2 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">
                  Гишүүний код:
                </span>{' '}
                {scannedCustomerId}
              </p>
            )}
            <p className="text-muted-foreground">
              QR кодыг зөв уншсан эсэхийг шалгана уу эсвэл өөр огнооны
              захиалгуудыг шалгана уу.
            </p>
          </div>
          <Dialog.Footer>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => setNoBookingDialogOpen(false)}
            >
              Хаах
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog>

      <Dialog open={viewSelectorOpen} onOpenChange={setViewSelectorOpen}>
        <Dialog.Content className="max-w-sm">
          <Dialog.Header>
            <Dialog.Title>Харах төрлөө сонгох</Dialog.Title>
            <Dialog.Description>
              Захиалгуудыг хэрхэн харахаа сонгоно уу.
            </Dialog.Description>
          </Dialog.Header>
          <div className="flex flex-col gap-2 py-4">
            <Button
              type="button"
              variant={view === 'log' ? 'default' : 'outline'}
              onClick={() => handleInitialViewSelect('log')}
              className="w-full justify-start"
            >
              <IconTimeline className="mr-2 h-4 w-4" />
              Ирцийн лог
            </Button>
            <Button
              type="button"
              variant={view === 'list' ? 'default' : 'outline'}
              onClick={() => handleInitialViewSelect('list')}
              className="w-full justify-start"
            >
              <IconList className="mr-2 h-4 w-4" />
              Жагсаалт
            </Button>
            <Button
              type="button"
              variant={view === 'calendar' ? 'default' : 'outline'}
              onClick={() => handleInitialViewSelect('calendar')}
              className="w-full justify-start"
            >
              <IconCalendarMonth className="mr-2 h-4 w-4" />
              Календар
            </Button>
          </div>
        </Dialog.Content>
      </Dialog>
    </>
  );
}
