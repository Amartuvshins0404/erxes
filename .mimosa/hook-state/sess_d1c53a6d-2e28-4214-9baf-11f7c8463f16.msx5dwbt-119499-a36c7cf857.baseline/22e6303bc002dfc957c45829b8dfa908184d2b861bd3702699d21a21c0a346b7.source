import { Button, Dialog, Input } from 'erxes-ui';
import { ChangeEvent, useEffect, useRef, useState } from 'react';
import { decodeQrFromImage } from '~/modules/booking/utils/decodeQrApi';

const DECODE_THROTTLE_MS = 400;
const QRCODE_RAPTOR_URL = 'https://qrcoderaptor.com/';

interface ScanBookingQrDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScanSuccess: (customerId: string) => void;
}

export function ScanBookingQrDialog({
  open,
  onOpenChange,
  onScanSuccess,
}: ScanBookingQrDialogProps) {
  const [mode, setMode] = useState<'camera' | 'file' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileLoading, setFileLoading] = useState(false);
  const [memberCode, setMemberCode] = useState('');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastDecodeTimeRef = useRef<number>(0);
  const decodeInProgressRef = useRef<boolean>(false);

  useEffect(() => {
    if (!open) {
      stopScanning();
      setMode(null);
      setError(null);
      setMemberCode('');
      return;
    }
    setError(null);
    return () => {
      stopScanning();
    };
  }, [open]);

  useEffect(() => {
    if (mode !== 'camera' || !open) {
      return;
    }

    async function startCameraScan() {
      const video = videoRef.current;
      if (!video) {
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });

        streamRef.current = stream;
        video.srcObject = stream;
        video.setAttribute('playsinline', 'true');
        await video.play();

        if (!canvasRef.current) {
          canvasRef.current = document.createElement('canvas');
        }

        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        if (!context) {
          throw new Error('Failed to get canvas context');
        }

        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;

        function scanFrame() {
          if (!video || !context) {
            return;
          }

          try {
            if (video.readyState === video.HAVE_ENOUGH_DATA) {
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
              context.drawImage(video, 0, 0, canvas.width, canvas.height);

              const now = Date.now();
              if (
                !decodeInProgressRef.current &&
                now - lastDecodeTimeRef.current >= DECODE_THROTTLE_MS
              ) {
                lastDecodeTimeRef.current = now;
                decodeInProgressRef.current = true;

                canvas.toBlob(
                  (blob) => {
                    if (!blob || mode !== 'camera' || !open) {
                      decodeInProgressRef.current = false;
                      if (mode === 'camera' && open) {
                        animationFrameRef.current =
                          requestAnimationFrame(scanFrame);
                      }
                      return;
                    }

                    decodeQrFromImage(blob)
                      .then((result) => {
                        if ('value' in result) {
                          stopScanning();
                          onScanSuccess(result.value);
                          onOpenChange(false);
                          return;
                        }
                      })
                      .catch(() => {
                        // Ignore per-frame errors, continue scanning
                      })
                      .finally(() => {
                        decodeInProgressRef.current = false;
                        if (mode === 'camera' && open) {
                          animationFrameRef.current =
                            requestAnimationFrame(scanFrame);
                        }
                      });
                  },
                  'image/jpeg',
                  0.9,
                );
              } else {
                if (mode === 'camera' && open) {
                  animationFrameRef.current = requestAnimationFrame(scanFrame);
                }
              }
            } else {
              if (mode === 'camera' && open) {
                animationFrameRef.current = requestAnimationFrame(scanFrame);
              }
            }
          } catch {
            if (mode === 'camera' && open) {
              animationFrameRef.current = requestAnimationFrame(scanFrame);
            }
          }
        }

        animationFrameRef.current = requestAnimationFrame(scanFrame);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'Камер асааж чадсангүй';
        if (
          err instanceof Error &&
          (err.name === 'NotAllowedError' ||
            err.name === 'PermissionDeniedError')
        ) {
          setError('Камерын зөвшөөрөл олгогдоогүй. Дахин оролдоно уу.');
        } else if (
          err instanceof Error &&
          (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError')
        ) {
          setError('Камер олдсонгүй. Камер холбоод дахин оролдоно уу.');
        } else {
          setError(message);
        }
        setMode(null);
      }
    }

    startCameraScan();

    return () => {
      stopScanning();
    };
  }, [mode, open, onScanSuccess, onOpenChange]);

  function stopScanning() {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }

  function handleCameraScan() {
    setError(null);
    setMode('camera');
  }

  async function handleFileScan(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setError(null);
    setFileLoading(true);

    try {
      const result = await decodeQrFromImage(file);

      if ('value' in result) {
        onScanSuccess(result.value);
        onOpenChange(false);
      } else {
        setError(result.error || 'Зурган дээр QR код олдсонгүй');
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Файлаас QR код уншиж чадсангүй';
      setError(message);
    } finally {
      setFileLoading(false);
      event.target.value = '';
    }
  }

  function handleClose() {
    stopScanning();
    setMode(null);
    setError(null);
    setMemberCode('');
    onOpenChange(false);
  }

  function handleCheckInWithCode() {
    const id = memberCode.trim();
    if (!id) {
      setError('Гишүүний код оруулна уу');
      return;
    }
    setError(null);
    onScanSuccess(id);
    setMemberCode('');
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Dialog.Content className="max-w-md">
        <Dialog.Header>
          <Dialog.Title>Гишүүн ирц бүртгэх</Dialog.Title>
          <Dialog.Description>
            Гишүүний QR кодыг апп-аас уншуулна уу, эсвэл QR-ын зургийг оруулна
            уу.
          </Dialog.Description>
        </Dialog.Header>

        <div className="flex flex-col gap-4 py-4">
          {!mode && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Button
                  type="button"
                  onClick={handleCameraScan}
                  className="w-full"
                >
                  Камероор уншуулах
                </Button>
                <label className="w-full cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileScan}
                    className="hidden"
                    disabled={fileLoading}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full pointer-events-none"
                    disabled={fileLoading}
                  >
                    {fileLoading
                      ? 'Тайлан декод хийж байна...'
                      : 'Зургаа оруулах'}
                  </Button>
                </label>
              </div>

              <div className="border-t pt-4 flex flex-col gap-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Гишүүний код (QR-аас)
                </p>
                <p className="text-xs text-muted-foreground">
                  Хэрэв та QR кодыг өөр газар (жишээ нь{' '}
                  <a
                    href={QRCODE_RAPTOR_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline hover:no-underline"
                  >
                    QRCodeRaptor
                  </a>
                  ) тайлсан бол энд тэр кодыг оруулна уу.
                </p>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Гишүүний кодыг оруулна уу"
                    value={memberCode}
                    onChange={(e) => setMemberCode(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleCheckInWithCode();
                      }
                    }}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    onClick={handleCheckInWithCode}
                    disabled={!memberCode.trim()}
                  >
                    Кодоор ирц бүртгэх
                  </Button>
                </div>
              </div>
            </div>
          )}

          {mode === 'camera' && (
            <div className="flex flex-col gap-2">
              <div className="w-full min-h-[300px] relative rounded-lg overflow-hidden bg-black flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-contain"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  stopScanning();
                  setMode(null);
                  setError(null);
                }}
                className="w-full"
              >
                Уншуулахыг цуцлах
              </Button>
            </div>
          )}

          {error && (
            <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
        </div>

        <Dialog.Footer>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            className="w-full"
          >
            Хаах
          </Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  );
}
