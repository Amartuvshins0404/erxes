import { IconLock } from '@tabler/icons-react';
import { Button } from 'erxes-ui';
import type { LockedModule } from './lockedModules';

const UPGRADE_URL = 'https://erxes.io/organizations?bundleCode=ai';

// Renders the locked module: a blurred, non-interactive mock of the module
// sitting behind a centered "buy a plan to unlock" card.
export const LockedModulePage = ({ module }: { module: LockedModule }) => {
  const Icon = module.icon;

  return (
    <div className="relative flex h-full min-h-0 flex-1 overflow-hidden">
      {/* Blurred fake module behind the paywall card. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 select-none overflow-hidden opacity-60 blur-md"
      >
        <div className="flex h-full flex-col gap-4 p-6">
          <div className="h-8 w-64 max-w-full rounded-md bg-muted" />
          <div className="h-4 w-96 max-w-full rounded bg-muted/70" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-40 rounded-xl border border-border bg-muted/40"
              />
            ))}
          </div>
        </div>
      </div>

      {/* Paywall card. */}
      <div className="relative z-10 m-auto w-full max-w-md rounded-2xl border border-border bg-background/95 p-8 text-center shadow-xl backdrop-blur">
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
  );
};
