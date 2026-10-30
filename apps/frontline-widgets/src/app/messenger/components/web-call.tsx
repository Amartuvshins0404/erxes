import { useAtomValue } from 'jotai';
import { Spinner } from 'erxes-ui';
import { webAppCredentialsUrlAtom } from '../states';

export const WebCall = () => {
  const webAppUrl = useAtomValue(webAppCredentialsUrlAtom);

  if (!webAppUrl) {
    return <Spinner containerClassName="py-32" />;
  }

  return (
    <iframe
      title="web-call"
      src={webAppUrl}
      sandbox="allow-scripts allow-same-origin"
      className="size-full border-0"
    />
  );
};
