import { Button, Dialog } from 'erxes-ui';
import { IconAlertCircle, IconCircleCheck } from '@tabler/icons-react';
import { MarkAttendanceBulkResult } from '../hooks/useBookingMutations';

interface BulkAttendanceResultDialogProps {
  result: MarkAttendanceBulkResult | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
}

export function BulkAttendanceResultDialog({
  result,
  open,
  onOpenChange,
  onClose,
}: BulkAttendanceResultDialogProps) {
  if (!open || !result) return null;

  if (result.success) {
    const count = result.count;
    const description =
      count === 1
        ? '1 захиалга ирсэн гэж тэмдэглэгдлээ.'
        : `${count} захиалга ирсэн гэж тэмдэглэгдлээ.`;

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <Dialog.Content className="max-w-md">
          <Dialog.Header>
            <div className="flex items-center gap-3 text-green-600 dark:text-green-500">
              <IconCircleCheck className="h-10 w-10 shrink-0" />
              <div>
                <Dialog.Title className="text-green-700 dark:text-green-400">
                  Амжилттай
                </Dialog.Title>
                <Dialog.Description>{description}</Dialog.Description>
              </div>
            </div>
          </Dialog.Header>
          <div className="rounded-lg border bg-muted/30 p-4 text-sm">
            <p className="font-medium">
              {count === 1
                ? 'Нэг захиалга ирсэн гэж тэмдэглэгдлээ.'
                : `Нийт ${count} захиалга ирсэн гэж тэмдэглэгдлээ.`}
            </p>
          </div>
          <Dialog.Footer>
            <Button type="button" onClick={onClose} className="w-full">
              Хаах
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Dialog.Content className="max-w-md">
        <Dialog.Header>
          <div className="flex items-center gap-3 text-destructive">
            <IconAlertCircle className="h-10 w-10 shrink-0" />
            <div>
              <Dialog.Title>Алдаа гарлаа</Dialog.Title>
              <Dialog.Description>
                Ирцийг тэмдэглэхэд асуудал гарсан.
              </Dialog.Description>
            </div>
          </div>
        </Dialog.Header>
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {result.error}
        </div>
        <Dialog.Footer>
          <Button type="button" onClick={onClose} className="w-full">
            Хаах
          </Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  );
}
