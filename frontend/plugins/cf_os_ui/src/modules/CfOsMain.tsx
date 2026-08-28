import { useAtomValue } from 'jotai';
import { currentUserState } from 'ui-modules';
import { useCfOsConnect } from './useCfOsConnect';

export function CfOsMain() {
  const userId = useAtomValue(currentUserState)?._id;
  const { src, error } = useCfOsConnect(userId);

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
      key={userId}
      className="h-full min-h-0 w-full border-0"
      title="Command (CF OS)"
      src={src}
      referrerPolicy="strict-origin-when-cross-origin"
      allow="clipboard-write"
    />
  );
}
