import {
  IconBroadcast,
  IconBuilding,
  IconCurrencyDollar,
  IconShoppingCart,
  IconUser,
  IconUsersGroup,
} from '@tabler/icons-react';
import type { BadgeProps } from 'erxes-ui';

interface DocumentTypeConfig {
  icon: React.ElementType;
  labelKey: string;
  variant: BadgeProps['variant'];
}

export const DOCUMENTS_TYPES_SET: Record<string, DocumentTypeConfig> = {
  'core:contact.customer': {
    icon: IconUser,
    labelKey: 'customer',
    variant: 'info',
  },
  'core:contact.company': {
    icon: IconBuilding,
    labelKey: 'company',
    variant: 'default',
  },
  'core:product': {
    icon: IconShoppingCart,
    labelKey: 'product',
    variant: 'warning',
  },
  'core:user': {
    icon: IconUsersGroup,
    labelKey: 'team-member',
    variant: 'secondary',
  },
  'core:broadcast': {
    icon: IconBroadcast,
    labelKey: 'broadcast',
    variant: 'destructive',
  },
  'sales:deal': {
    icon: IconCurrencyDollar,
    labelKey: 'sales',
    variant: 'success',
  },
};

export const DOCUMENT_APPROVAL_CONTENT_TYPE = 'core:documents';
