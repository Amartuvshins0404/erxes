import { ComponentType, useId } from 'react';
import ReactJson, { ReactJsonViewProps } from 'react-json-view';

interface ReactJsonPropsWithId extends ReactJsonViewProps {
  rjvId?: string;
}
const JsonView = ReactJson as unknown as ComponentType<ReactJsonPropsWithId>;

export const OrderRawPayload = ({ payload }: { payload: unknown }) => {
  const rjvId = useId();
  const isDark =
    typeof document !== 'undefined' &&
    document.documentElement.classList.contains('dark');

  return (
    <div className="bg-muted/20 p-4 rounded-2xl">
      <div className="bg-background p-3 rounded-xl min-h-40 max-h-[60vh] overflow-auto">
        <JsonView
          rjvId={rjvId}
          src={(payload as object) ?? {}}
          collapsed={false}
          name={false}
          displayDataTypes={false}
          enableClipboard={false}
          theme={isDark ? 'twilight' : 'rjv-default'}
          style={{ backgroundColor: 'transparent', fontSize: 12 }}
        />
      </div>
    </div>
  );
};
