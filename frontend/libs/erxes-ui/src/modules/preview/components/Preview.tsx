import { ImperativePanelHandle } from 'react-resizable-panels';
import { PreviewContext, usePreviewContext } from '../context/PreviewContext';
import React from 'react';
import {
  Button,
  Resizable,
  ScrollArea,
  Separator,
  ToggleGroup,
} from 'erxes-ui/components';
import {
  IconDeviceImacFilled,
  IconDeviceMobileFilled,
  IconDeviceIpadFilled,
  IconWindowMaximize,
} from '@tabler/icons-react';
import { Link } from 'react-router-dom';

const ITEM_CLASS =
  'h-7 gap-1.5 rounded-full px-3 data-[state=on]:bg-card data-[state=on]:text-foreground data-[state=on]:shadow-xs';

const PreviewProvider = ({ children }: { children: React.ReactNode }) => {
  const resizablePanelRef = React.useRef<ImperativePanelHandle>(null);

  return (
    <PreviewContext.Provider value={{ resizablePanelRef }}>
      {children}
    </PreviewContext.Provider>
  );
};

export const PreviewToolbar = ({ path }: { path?: string }) => {
  const { resizablePanelRef } = usePreviewContext();
  return (
    <ScrollArea>
      <ToggleGroup
        type="single"
        defaultValue="100"
        className="w-fit gap-0.5 rounded-full bg-muted p-0.5 text-muted-foreground"
        onValueChange={(value) => {
          if (resizablePanelRef?.current) {
            resizablePanelRef.current.resize(parseInt(value));
          }
        }}
      >
        <ToggleGroup.Item value="100" className={ITEM_CLASS} title="Desktop">
          <IconDeviceImacFilled className="size-3.5" />
          <span>Desktop</span>
        </ToggleGroup.Item>
        <ToggleGroup.Item value="60" className={ITEM_CLASS} title="Tablet">
          <IconDeviceIpadFilled className="size-3.5" />
          <span>Tablet</span>
        </ToggleGroup.Item>
        <ToggleGroup.Item value="30" className={ITEM_CLASS} title="Mobile">
          <IconDeviceMobileFilled className="size-3.5" />
          <span>Mobile</span>
        </ToggleGroup.Item>

        {path && (
          <>
            <Separator.Inline />
            <Button
              variant="ghost"
              className="rounded-full"
              asChild
              title="Open in New Tab"
            >
              <Link to={path} target="_blank">
                <span>Open in New Tab</span>
                <IconWindowMaximize className="size-3.5" />
              </Link>
            </Button>
          </>
        )}
      </ToggleGroup>
    </ScrollArea>
  );
};

export const View = React.forwardRef<
  React.ElementRef<typeof Resizable.PanelGroup>,
  {
    iframeSrc: string;
  } & Omit<React.ComponentProps<typeof Resizable.PanelGroup>, 'direction'>
>(({ iframeSrc, ...props }, ref) => {
  const { resizablePanelRef } = usePreviewContext();
  return (
    <Resizable.PanelGroup
      className="relative z-10 flex-auto"
      direction="horizontal"
      {...props}
      ref={ref}
    >
      <Resizable.Panel
        ref={resizablePanelRef}
        defaultSize={100}
        minSize={30}
        className="h-full"
      >
        <iframe
          src={iframeSrc}
          width="100%"
          title="Preview"
          className="h-full rounded-2xl bg-card shadow-card"
        />
      </Resizable.Panel>
      <Resizable.Handle className="relative hidden w-3 bg-transparent p-0 after:absolute after:right-0 after:top-1/2 after:h-8 after:w-[6px] after:-translate-y-1/2 after:-translate-x-px after:rounded-full after:bg-border after:transition-all hover:after:h-10 md:block" />
      <Resizable.Panel defaultSize={0} minSize={0} />
    </Resizable.PanelGroup>
  );
});

export const Preview = Object.assign(PreviewProvider, {
  Toolbar: PreviewToolbar,
  View: View,
});
