import { IconLock } from '@tabler/icons-react';
import { Breadcrumb, Button, Separator } from 'erxes-ui';
import { Link } from 'react-router-dom';
import { PageHeader } from 'ui-modules';
import { LockedModuleMockBackground } from './LockedModuleMockBackground';
import type { LockedModule } from './lockedModules';

const UPGRADE_URL = 'https://erxes.io/organizations?bundleCode=ai';

// Renders the locked module: a blurred, non-interactive mock of the module
// sitting behind a centered "buy a plan to unlock" card.
export const LockedModulePage = ({ module }: { module: LockedModule }) => {
  const Icon = module.icon;

  return (
    <div className="flex h-full flex-col">
      <PageHeader>
        <PageHeader.Start>
          <Breadcrumb>
            <Breadcrumb.List className="gap-1">
              <Breadcrumb.Item>
                <Button variant="ghost" asChild>
                  <Link to="/agent/assistant">Company Brain</Link>
                </Button>
              </Breadcrumb.Item>
              <Breadcrumb.Separator />
              <Breadcrumb.Item>
                <Breadcrumb.Page>{module.name}</Breadcrumb.Page>
              </Breadcrumb.Item>
            </Breadcrumb.List>
          </Breadcrumb>
          <Separator.Inline />
          <PageHeader.FavoriteToggleButton />
        </PageHeader.Start>
      </PageHeader>

      <div className="relative min-h-0 flex-1 overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 overflow-hidden"
        >
          <div
            className="absolute inset-0 origin-center scale-[1.03]"
            style={{ filter: 'blur(10px)' }}
          >
            <LockedModuleMockBackground module={module} />
          </div>
        </div>

        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-1 bg-background/25 backdrop-blur-lg"
        />

        <div className="relative z-10 flex h-full items-center justify-center p-6">
          <div className="w-full max-w-md rounded-2xl border border-border bg-background p-8 text-center shadow-xl">
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Icon className="size-6" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">{module.name}</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {module.description}
            </p>
            <div className="mt-6 flex items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/30 px-4 py-3 text-sm text-foreground">
              <IconLock className="size-4 shrink-0 text-muted-foreground" />
              <span>
                You need to buy a plan to unlock{' '}
                <span className="font-medium">{module.name}</span>.
              </span>
            </div>
            <Button asChild className="mt-6 w-full">
              <a href={UPGRADE_URL} target="_blank" rel="noreferrer">
                Buy a plan to unlock
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
