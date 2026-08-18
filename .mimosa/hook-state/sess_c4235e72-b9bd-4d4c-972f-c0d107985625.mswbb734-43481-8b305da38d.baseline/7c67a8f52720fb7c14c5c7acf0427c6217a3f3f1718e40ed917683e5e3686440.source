import {
  AgencyRejectionReasons,
  IDashboardItem,
  IRejectionReasons,
} from '../types/dashboard';

import {
  IconFileUnknown,
  IconLicense,
  IconCopy,
  IconAlertTriangle,
} from '@tabler/icons-react';

export const DASHBOARD_TABS: IDashboardItem[] = [
  {
    title: 'Listings',
    description: 'Active listings',
  },
  {
    title: 'Opportunities',
    description: 'opportunities',
  },
  {
    title: 'Inventory',
    description: 'Assigned units',
  },
] as const;

export const REJECTION_INSTRUCTIONS: string[] = [
  'You can edit your profile information',
  'You can resubmit after making changes',
  'The review will be conducted by an admin',
] as const;

export const PENDING_INSTRUCTIONS: string[] = [
  'Your profile will not be visible to the public',
  'Your information cannot be modified during this period',
  'Verification typically takes 1–2 business days',
  'You will receive a notification once the process is complete',
] as const;

export const REJECTION_REASONS: IRejectionReasons[] = [
  {
    key: 'INCOMPLETE_DOCUMENTS',
    value: AgencyRejectionReasons.INCOMPLETE_DOCUMENTS,
    title: 'Incomplete Documents',
    detail: 'The submitted documents are missing or incomplete',
    icon: IconFileUnknown,
  },
  {
    key: 'INVALID_LICENSE',
    value: AgencyRejectionReasons.INVALID_LICENSE,
    title: 'Invalid License',
    detail: 'The provided license is expired, fake, or unrecognized',
    icon: IconLicense,
  },
  {
    key: 'DUPLICATE_ACCOUNT',
    value: AgencyRejectionReasons.DUPLICATE_ACCOUNT,
    title: 'Duplicate Account',
    detail: 'An account with the same information already exists',
    icon: IconCopy,
  },
  {
    key: 'SUSPICIOUS_ACTIVITY',
    value: AgencyRejectionReasons.SUSPICIOUS_ACTIVITY,
    title: 'Suspicious Activity',
    detail: 'The account shows signs of fraudulent or suspicious behavior',
    icon: IconAlertTriangle,
  },
];
