import {
  IconBookmark,
  IconFileText,
  IconFileCheck,
  IconCircleX,
  IconAlertTriangle,
} from '@tabler/icons-react';

export const BlockContractStatusIcons: Record<string, any> = {
  reserved: IconBookmark,
  draft: IconFileText,
  signed: IconFileCheck,
  cancelled: IconCircleX,
  lost: IconAlertTriangle,
};

export const TERMINAL_CONTRACT_STATUS_TYPES = [
  'lost',
  'cancelled',
];

export const CONTRACT_STAGE_COLORS: Record<
  string,
  { en: string; mn: string; color: string }
> = {
  reserved: {
    en: 'Reserved',
    mn: 'Захиалсан',
    color: '#F59E0B',
  },
  draft: {
    en: 'Draft',
    mn: 'Ноорог',
    color: '#9CA3AF',
  },
  signed: {
    en: 'Signed',
    mn: 'Гэрээтэй',
    color: '#10B981',
  },
  cancelled: {
    en: 'Cancelled',
    mn: 'Цуцлагдсан',
    color: '#6B7280',
  },
  lost: {
    en: 'Lost',
    mn: 'Алдсан',
    color: '#EF4444',
  },
};

export const LOCKED_UNIT_COLOR = '#1E3A8A';
