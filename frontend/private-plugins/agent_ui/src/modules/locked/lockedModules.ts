import {
  IconBolt,
  IconBrain,
  IconMessage,
  IconPalette,
  IconSitemap,
} from '@tabler/icons-react';
import type { ElementType } from 'react';

export interface LockedModule {
  name: string;
  description: string;
  path: string;
  icon: ElementType;
}

// FOMO placeholders — these are not real modules yet. They show up in the
// Company Brain sidebar and, when opened, render a blurred mock behind a
// "buy a plan to unlock" card (see LockedModulePage).
export const LOCKED_MODULES: LockedModule[] = [
  {
    name: 'Postiz Agent',
    description:
      'Plan, generate and schedule posts automatically to 30+ social media networks.',
    path: 'postiz',
    icon: IconMessage,
  },
  {
    name: 'Hermes Agent',
    description:
      'Self-improving AI that learns workflows and auto-creates skills over time.',
    path: 'hermes',
    icon: IconBolt,
  },
  {
    name: 'OpenDesign Studio',
    description:
      'Local-first AI design workspace with 150+ brand-grade design systems.',
    path: 'opendesign',
    icon: IconPalette,
  },
  {
    name: 'Supermemory Engine',
    description:
      'Persistent memory and context layer for any AI assistant or agent.',
    path: 'supermemory',
    icon: IconBrain,
  },
  {
    name: 'Paperclip Orchestrator',
    description:
      'Multi-agent company orchestrator with org charts, budgets, and governance.',
    path: 'paperclip',
    icon: IconSitemap,
  },
];
