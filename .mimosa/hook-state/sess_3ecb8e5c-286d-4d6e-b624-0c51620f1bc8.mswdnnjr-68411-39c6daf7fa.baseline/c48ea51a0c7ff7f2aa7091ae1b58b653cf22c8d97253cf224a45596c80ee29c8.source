import { Button, Dialog, Spinner, Checkbox, Badge } from 'erxes-ui';
import { readImage } from 'erxes-ui';
import { getLocalizedString } from '~/modules/activity-type/utils/localization';
import { OneFitBooking } from '../types/booking';
import { useState } from 'react';

interface SelectCustomerBookingDialogProps {
  bookings: OneFitBooking[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectBooking: (booking: OneFitBooking) => void;
  onConfirmSelection?: (bookingIds: string[]) => void | Promise<void>;
  onMarkAll?: (bookingIds: string[]) => void | Promise<void>;
  markAllLoading?: boolean;
}

export function SelectCustomerBookingDialog({
  bookings,
  open,
  onOpenChange,
  onSelectBooking,
  onConfirmSelection,
  onMarkAll,
  markAllLoading = false,
}: SelectCustomerBookingDialogProps) {
  const [selectedBookingIds, setSelectedBookingIds] = useState<string[]>([]);

  if (!open) {
    return null;
  }

  async function handleMarkAll() {
    if (!onMarkAll || bookings.length === 0) return;
    const ids = bookings.map((b) => b._id);
    await onMarkAll(ids);
    onOpenChange(false);
  }

  function handleSelect(booking: OneFitBooking) {
    setSelectedBookingIds((current) =>
      current.includes(booking._id)
        ? current.filter((id) => id !== booking._id)
        : [...current, booking._id],
    );
  }

  async function handleConfirmSelection() {
    if (selectedBookingIds.length === 0) {
      return;
    }

    if (onConfirmSelection) {
      await onConfirmSelection(selectedBookingIds);
      return;
    }

    const booking = bookings.find((b) => b._id === selectedBookingIds[0]);
    if (!booking) {
      return;
    }

    onSelectBooking(booking);
    onOpenChange(false);
  }

  const providerName = (b: OneFitBooking) =>
    b.provider ? getLocalizedString(b.provider.businessName, 'en') : '-';
  const activityName = (b: OneFitBooking) =>
    b.activityType ? getLocalizedString(b.activityType.name, 'en') : '-';
  const activityImage = (b: OneFitBooking) => b.activityType?.image;
  const isToday = (date: string) => {
    const target = new Date(date);
    const now = new Date();
    return (
      target.getFullYear() === now.getFullYear() &&
      target.getMonth() === now.getMonth() &&
      target.getDate() === now.getDate()
    );
  };
  const customer = bookings[0]?.user;
  const customerName =
    customer &&
    ([customer.firstName, customer.lastName].filter(Boolean).join(' ').trim() ||
      customer.primaryEmail ||
      customer.primaryPhone);
  const dateLabel = (b: OneFitBooking) =>
    new Date(b.bookingDate).toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  const timeLabel = (b: OneFitBooking) => `${b.startTime} - ${b.endTime}`;
  const count = bookings.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Dialog.Content className="max-w-md max-h-[90vh] sm:max-h-[85vh] flex flex-col overflow-hidden">
        <div className="flex flex-col min-h-0 flex-1 gap-4">
          <Dialog.Header className="flex-shrink-0">
            <Dialog.Title>Энэ гишүүнд олон захиалга байна</Dialog.Title>
            <Dialog.Description>
              {onMarkAll
                ? 'Бүгдийг нэг дор ирсэн гэж тэмдэглэх эсвэл нэг захиалгыг сонгоно уу.'
                : 'Нэг захиалгыг сонгож, ирцийг баталгаажуулна уу.'}
            </Dialog.Description>
          </Dialog.Header>

          <div className="flex flex-col gap-3 py-4 flex-1 min-h-0 overflow-y-auto">
            {customerName && (
              <div className="rounded-lg border bg-muted/40 px-3 py-2">
                <p className="text-xs font-medium text-muted-foreground">
                  Гишүүн
                </p>
                <p className="text-sm font-semibold">{customerName}</p>
                {(customer?.primaryEmail || customer?.primaryPhone) && (
                  <p className="text-xs text-muted-foreground">
                    {customer.primaryEmail || customer.primaryPhone}
                  </p>
                )}
              </div>
            )}
            {onMarkAll && (
              <Button
                type="button"
                onClick={handleMarkAll}
                disabled={markAllLoading}
                className="w-full"
              >
                <Spinner show={markAllLoading} />
                {count === 1
                  ? 'Ирсэн гэж тэмдэглэх'
                  : `Бүгдийг ${count} ирсэн гэж тэмдэглэх`}
              </Button>
            )}

            <p className="text-sm text-muted-foreground pt-1">
              Нэг захиалгыг чекбоксоор сонгож, дараа нь баталгаажуулна уу.
            </p>
            {bookings.map((booking) => (
              <button
                key={booking._id}
                type="button"
                onClick={() => handleSelect(booking)}
                disabled={markAllLoading}
                className={`flex items-start gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted/50 focus:outline-none disabled:opacity-50 ${
                  selectedBookingIds.includes(booking._id)
                    ? 'border-primary bg-primary/5'
                    : 'border-border'
                }`}
              >
                <Checkbox
                  checked={selectedBookingIds.includes(booking._id)}
                  onCheckedChange={() => handleSelect(booking)}
                  className="mt-1"
                />
                {activityImage(booking) ? (
                  <img
                    src={readImage(activityImage(booking), 80)}
                    alt={activityName(booking)}
                    className="h-12 w-12 rounded-md object-cover"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-md bg-muted flex items-center justify-center text-xs text-muted-foreground">
                    {providerName(booking).charAt(0)}
                  </div>
                )}
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-semibold">
                    {activityName(booking)}
                  </span>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground">
                      {providerName(booking)} · {dateLabel(booking)} ·{' '}
                      {timeLabel(booking)}
                    </span>
                    <Badge
                      variant={
                        isToday(booking.bookingDate) ? 'success' : 'secondary'
                      }
                      className="text-[10px] px-1.5 py-0"
                    >
                      {isToday(booking.bookingDate) ? 'Өнөөдөр' : 'Өнөөдөр биш'}
                    </Badge>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <Dialog.Footer className="flex-shrink-0">
            <Button
              type="button"
              onClick={handleConfirmSelection}
              className="w-full"
              disabled={selectedBookingIds.length === 0 || markAllLoading}
            >
              Сонголтыг баталгаажуулах
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full"
              disabled={markAllLoading}
            >
              Цуцлах
            </Button>
          </Dialog.Footer>
        </div>
      </Dialog.Content>
    </Dialog>
  );
}
