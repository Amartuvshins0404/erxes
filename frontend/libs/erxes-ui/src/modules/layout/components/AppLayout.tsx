import * as React from 'react';

import {
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarLeftExpand,
  IconMenu2,
} from '@tabler/icons-react';
import { useAtom } from 'jotai';

import { Button } from 'erxes-ui/components/button';
import { Sidebar } from 'erxes-ui/components/sidebar';
import { atomWithStorage } from 'jotai/utils';
import { Link, useLocation } from 'react-router-dom';
import { cn } from 'erxes-ui/lib/utils';
import { PagePanel } from './Page';

const APP_LAYOUT_DEFAULT_WIDTH = 240;
const APP_LAYOUT_MIN_WIDTH = 180;
const APP_LAYOUT_MAX_WIDTH = 480;
const APP_LAYOUT_KEYBOARD_STEP = 16;

const createOpenAtom = (id: string) =>
  atomWithStorage<boolean>(`app-layout:${id}:open`, true, undefined, {
    getOnInit: true,
  });

const createWidthAtom = (id: string) =>
  atomWithStorage<number | null>(`app-layout:${id}:width`, null, undefined, {
    getOnInit: true,
  });

type TAppLayoutAtoms = {
  open: ReturnType<typeof createOpenAtom>;
  width: ReturnType<typeof createWidthAtom>;
};

const appLayoutAtoms = new Map<string, TAppLayoutAtoms>();

const getAppLayoutAtoms = (id: string) => {
  const existing = appLayoutAtoms.get(id);

  if (existing) {
    return existing;
  }

  const atoms: TAppLayoutAtoms = {
    open: createOpenAtom(id),
    width: createWidthAtom(id),
  };

  appLayoutAtoms.set(id, atoms);

  return atoms;
};

const clampWidth = (value: number) =>
  Math.round(
    Math.min(APP_LAYOUT_MAX_WIDTH, Math.max(APP_LAYOUT_MIN_WIDTH, value)),
  );

const AppLayoutResizeHandle = ({
  panelRef,
  width,
  onResize,
  onReset,
  onResizingChange,
}: {
  panelRef: React.RefObject<HTMLElement | null>;
  width: number;
  onResize: (width: number) => void;
  onReset: () => void;
  onResizingChange: (resizing: boolean) => void;
}) => {
  const drag = React.useRef<{ startX: number; startWidth: number } | null>(
    null,
  );

  const stopDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current) {
      return;
    }

    drag.current = null;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    onResizingChange(false);
  };

  return (
    <div
      role="separator"
      tabIndex={0}
      aria-label="Resize sidebar"
      aria-orientation="vertical"
      aria-valuemin={APP_LAYOUT_MIN_WIDTH}
      aria-valuemax={APP_LAYOUT_MAX_WIDTH}
      aria-valuenow={width}
      title="Resize sidebar"
      className="group/resize absolute inset-y-0 right-0 z-30 flex w-2 cursor-col-resize touch-none items-center justify-center outline-none"
      onDoubleClick={onReset}
      onKeyDown={(event) => {
        const panel = panelRef.current;

        if (
          !panel ||
          (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight')
        ) {
          return;
        }

        event.preventDefault();
        onResize(
          clampWidth(
            panel.offsetWidth +
              (event.key === 'ArrowRight'
                ? APP_LAYOUT_KEYBOARD_STEP
                : -APP_LAYOUT_KEYBOARD_STEP),
          ),
        );
      }}
      onPointerCancel={stopDrag}
      onPointerDown={(event) => {
        const panel = panelRef.current;

        if (event.button !== 0 || !panel) {
          return;
        }

        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        drag.current = { startX: event.clientX, startWidth: panel.offsetWidth };
        onResizingChange(true);
      }}
      onPointerMove={(event) => {
        if (!drag.current) {
          return;
        }

        const { startX, startWidth } = drag.current;

        onResize(clampWidth(startWidth + event.clientX - startX));
      }}
      onPointerUp={stopDrag}
    >
      <span className="h-10 w-1 rounded-full bg-transparent transition-colors group-hover/resize:bg-border-strong group-focus-visible/resize:bg-primary group-active/resize:bg-primary" />
    </div>
  );
};

const AppLayoutFloatingButton = ({
  label,
  icon,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}) => (
  <Button
    aria-expanded={false}
    aria-label={label}
    className="absolute top-1.5 left-1.5 z-30 size-7 shrink-0 text-muted-foreground hover:text-foreground"
    size="icon"
    title={label}
    type="button"
    variant="ghost"
    onClick={onClick}
  >
    {icon}
  </Button>
);

const AppLayoutFooter = ({ children }: { children?: React.ReactNode }) =>
  children ? (
    <div className="shrink-0 p-2">
      <Sidebar.Menu>{children}</Sidebar.Menu>
    </div>
  ) : null;

export const AppLayoutFooterLink = ({
  path,
  name,
  icon: Icon,
}: {
  path: string;
  name: string;
  icon?: React.ElementType;
}) => {
  const { pathname } = useLocation();
  const fullPath = `/${path.replace(/^\/+/, '')}`;
  const isActive = pathname === fullPath || pathname.startsWith(`${fullPath}/`);

  return (
    <Sidebar.MenuItem>
      <Sidebar.MenuButton asChild isActive={isActive}>
        <Link to={fullPath}>
          {Icon && <Icon />}
          <span className="min-w-0 flex-1 truncate">{name}</span>
        </Link>
      </Sidebar.MenuButton>
    </Sidebar.MenuItem>
  );
};

const APP_LAYOUT_PAGE_ENTER: Keyframe[] = [
  { opacity: 0.4, transform: 'translateY(2px)' },
  { opacity: 1, transform: 'translateY(0)' },
];

const getPageKey = (pathname: string) =>
  pathname.split('/').filter(Boolean).slice(0, 2).join('/');

const AppLayoutPage = ({
  children,
  overlay,
}: {
  children: React.ReactNode;
  overlay?: React.ReactNode;
}) => {
  const { pathname } = useLocation();
  const pageRef = React.useRef<HTMLDivElement>(null);
  const pageKey = getPageKey(pathname);
  const previousKey = React.useRef(pageKey);

  React.useLayoutEffect(() => {
    const page = pageRef.current;

    if (previousKey.current === pageKey) {
      return;
    }

    previousKey.current = pageKey;

    if (
      !page?.animate ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }

    const animation = page.animate(APP_LAYOUT_PAGE_ENTER, {
      duration: 160,
      easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
    });

    return () => animation.cancel();
  }, [pageKey]);

  return (
    <PagePanel ref={pageRef}>
      {overlay}
      {children}
    </PagePanel>
  );
};

type TAppLayoutBodyProps = {
  atoms: TAppLayoutAtoms;
  children: React.ReactNode;
  sidebar: React.ReactNode;
  footer?: React.ReactNode;
  title?: React.ReactNode;
};

const AppLayoutDesktop = ({
  atoms,
  children,
  footer,
  sidebar,
  title,
}: TAppLayoutBodyProps) => {
  const [open, setOpen] = useAtom(atoms.open);
  const [width, setWidth] = useAtom(atoms.width);
  const [resizing, setResizing] = React.useState(false);
  const asideRef = React.useRef<HTMLElement>(null);
  const currentWidth = width ?? APP_LAYOUT_DEFAULT_WIDTH;

  return (
    <div
      data-app-layout=""
      className={cn(
        'relative flex min-h-0 min-w-0 flex-1 bg-sidebar pr-2 pb-2 text-sidebar-foreground',
        !open && 'pl-2 [--navigation-panel-toggle-space:2rem]',
        resizing && 'cursor-col-resize select-none',
      )}
    >
      <aside
        ref={asideRef}
        aria-hidden={!open}
        className={cn(
          'relative flex shrink-0 flex-col overflow-hidden',
          !resizing &&
            'transition-[width] duration-300 ease-out motion-reduce:transition-none',
        )}
        style={{ width: open ? currentWidth : 0 }}
      >
        <div
          className="flex h-full flex-col pr-1"
          style={{ minWidth: currentWidth }}
        >
          <div className="flex h-10 shrink-0 items-center gap-1 pr-1 pl-2">
            <div className="min-w-0 flex-1 truncate px-2 text-sm font-semibold tracking-tight">
              {title}
            </div>
            <Button
              aria-expanded
              aria-label="Collapse sidebar"
              className="size-7 shrink-0 text-muted-foreground hover:text-foreground"
              size="icon"
              title="Collapse sidebar"
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              <IconLayoutSidebarLeftCollapse />
            </Button>
          </div>
          <div
            data-navigation-context
            className="styled-scroll min-h-0 flex-1 overflow-x-hidden overflow-y-auto pb-1"
          >
            {sidebar}
          </div>
          <AppLayoutFooter>{footer}</AppLayoutFooter>
        </div>
        {open && (
          <AppLayoutResizeHandle
            panelRef={asideRef}
            width={currentWidth}
            onResize={setWidth}
            onReset={() => setWidth(null)}
            onResizingChange={setResizing}
          />
        )}
      </aside>
      <AppLayoutPage
        overlay={
          !open && (
            <AppLayoutFloatingButton
              label="Expand sidebar"
              icon={<IconLayoutSidebarLeftExpand />}
              onClick={() => setOpen(true)}
            />
          )
        }
      >
        {children}
      </AppLayoutPage>
    </div>
  );
};

const AppLayoutMobile = ({
  children,
  footer,
  sidebar,
  title,
}: Omit<TAppLayoutBodyProps, 'atoms'>) => {
  const { toggleSidebar } = Sidebar.useSidebar();

  return (
    <div
      data-app-layout=""
      className="relative flex min-h-0 min-w-0 flex-1 flex-col bg-sidebar px-2 pb-2 [--navigation-panel-toggle-space:2rem]"
    >
      <Sidebar collapsible="offcanvas">
        {title && (
          <Sidebar.Header className="px-4 text-sm font-semibold tracking-tight">
            {title}
          </Sidebar.Header>
        )}
        <div
          data-navigation-context
          className="styled-scroll min-h-0 flex-1 overflow-y-auto pb-1"
        >
          {sidebar}
        </div>
        <AppLayoutFooter>{footer}</AppLayoutFooter>
      </Sidebar>
      <AppLayoutPage
        overlay={
          <AppLayoutFloatingButton
            label="Open sidebar"
            icon={<IconMenu2 />}
            onClick={toggleSidebar}
          />
        }
      >
        {children}
      </AppLayoutPage>
    </div>
  );
};

const AppLayoutBody = (props: TAppLayoutBodyProps) => {
  const { isMobile } = Sidebar.useSidebar();

  return isMobile ? (
    <AppLayoutMobile {...props} />
  ) : (
    <AppLayoutDesktop {...props} />
  );
};

export const AppLayout = ({
  id,
  sidebar,
  footer,
  title,
  children,
}: {
  id: string;
  sidebar: React.ReactNode;
  footer?: React.ReactNode;
  title?: React.ReactNode;
  children: React.ReactNode;
}) => (
  <Sidebar.Provider className="min-h-0 flex-1" sidebarKeyboardShortcut={false}>
    <AppLayoutBody
      atoms={getAppLayoutAtoms(id)}
      sidebar={sidebar}
      footer={footer}
      title={title}
    >
      {children}
    </AppLayoutBody>
  </Sidebar.Provider>
);
