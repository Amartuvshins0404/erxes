import { Button, Dialog } from 'erxes-ui';

interface QrCodeDialogProps {
  qrData: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose?: () => void;
}

export function QrCodeDialog({
  qrData,
  open,
  onOpenChange,
  onClose,
}: QrCodeDialogProps) {
  function handleClose() {
    onOpenChange(false);
    onClose?.();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Dialog.Content className="max-w-md">
        <Dialog.Header>
          <Dialog.Title>QR Code</Dialog.Title>
          <Dialog.Description>
            Scan this QR code to complete payment
          </Dialog.Description>
        </Dialog.Header>
        <div className="flex justify-center p-6">
          <div className="relative aspect-square w-full max-w-80">
            <div className="border rounded-xl absolute inset-0" />
            <div className="w-full h-full bg-white rounded-3xl absolute inset-0 flex items-center justify-center">
              {qrData ? (
                <img
                  src={qrData}
                  alt="QR code"
                  height={256}
                  width={256}
                  className="rounded-lg"
                />
              ) : (
                <div className="text-muted-foreground">No QR code available</div>
              )}
            </div>
          </div>
        </div>
        <Dialog.Footer>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            className="w-full"
          >
            Close
          </Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  );
}
