import { getCommandUrl } from './utils';

export function CfOsMain() {
  return (
    <iframe
      className="h-full min-h-0 w-full border-0"
      title="Command (CF OS)"
      src={getCommandUrl()}
      referrerPolicy="strict-origin-when-cross-origin"
    />
  );
}
