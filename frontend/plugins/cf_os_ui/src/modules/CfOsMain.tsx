import { useCfOsConnect } from './useCfOsConnect';

export function CfOsMain() {
  const { src, error } = useCfOsConnect();

  if (error) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-sm text-neutral-500">
        {error}
      </div>
    );
  }

  if (!src) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-sm text-neutral-500">
        Connecting to Command…
      </div>
    );
  }

  return (
    <iframe
      className="h-full min-h-0 w-full border-0"
      title="Command (CF OS)"
      src={src}
      referrerPolicy="strict-origin-when-cross-origin"
      allow="clipboard-write"
    />
  );
}
