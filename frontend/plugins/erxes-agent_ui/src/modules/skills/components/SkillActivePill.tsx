import { IconBook2, IconX } from '@tabler/icons-react';

// Pill shown above the composer once a /slash skill is activated for the next
// turn. Dismissible — clearing it just hides the reminder (activation is already
// recorded server-side and is idempotent).
export const SkillActivePill = ({
  name,
  onClear,
}: {
  name: string;
  onClear: () => void;
}) => (
  <div className="max-w-3xl mx-auto w-full px-3 pb-1.5">
    <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/8 px-2.5 py-1 text-xs text-primary">
      <IconBook2 className="size-3.5" />
      <span className="font-mono">/{name}</span>
      <span className="text-primary/70">active for next message</span>
      <button
        type="button"
        onClick={onClear}
        className="ml-0.5 rounded-full p-0.5 hover:bg-primary/15"
        aria-label="Clear active skill"
      >
        <IconX className="size-3" />
      </button>
    </div>
  </div>
);
