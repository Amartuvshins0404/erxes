import { startCase } from 'lodash';

export const ORDER_GAP = 1000;

export const DEFAULT_STATUS_TYPES = {
  LEAD: 'lead',
  QUALIFIED: 'qualified',
  SITE_VISIT: 'site_visit',
  NEGOTIATION: 'negotiation',
  CLOSED_WON: 'closed_won',
  CLOSED_LOST: 'closed_lost',
};

export const DEFAULT_STATUSES = {
  [DEFAULT_STATUS_TYPES.LEAD]: {
    NEW: { name: 'New', color: '#FF6B6B', type: DEFAULT_STATUS_TYPES.LEAD },
    CONTACTED: {
      name: 'Contacted',
      color: '#4ECDC4',
      type: DEFAULT_STATUS_TYPES.LEAD,
    },
  },
  [DEFAULT_STATUS_TYPES.QUALIFIED]: {
    QUALIFIED: {
      name: 'Qualified',
      color: '#45B7D1',
      type: DEFAULT_STATUS_TYPES.QUALIFIED,
    },
  },
  [DEFAULT_STATUS_TYPES.SITE_VISIT]: {
    SITE_VISIT: {
      name: 'Site Visit',
      color: '#96CEB4',
      type: DEFAULT_STATUS_TYPES.SITE_VISIT,
    },
  },
  [DEFAULT_STATUS_TYPES.NEGOTIATION]: {
    NEGOTIATION: {
      name: 'Negotiation',
      color: '#DDA0DD',
      type: DEFAULT_STATUS_TYPES.NEGOTIATION,
    },
  },
  [DEFAULT_STATUS_TYPES.CLOSED_WON]: {
    COMPLETED: {
      name: 'Completed',
      color: '#4ECDC4',
      type: DEFAULT_STATUS_TYPES.CLOSED_WON,
    },
  },
  [DEFAULT_STATUS_TYPES.CLOSED_LOST]: {
    LOST: {
      name: 'Lost',
      color: '#45B7D1',
      type: DEFAULT_STATUS_TYPES.CLOSED_LOST,
    },
  },
};

export const DEFAULT_STATUS_TYPE_VALUES = {
  [DEFAULT_STATUS_TYPES.LEAD]: {
    color: '#FF6B6B',
    type: DEFAULT_STATUS_TYPES.LEAD,
    name: startCase(DEFAULT_STATUS_TYPES.LEAD),
  },
  [DEFAULT_STATUS_TYPES.QUALIFIED]: {
    color: '#4ECDC4',
    type: DEFAULT_STATUS_TYPES.QUALIFIED,
    name: startCase(DEFAULT_STATUS_TYPES.QUALIFIED),
  },
  [DEFAULT_STATUS_TYPES.SITE_VISIT]: {
    color: '#45B7D1',
    type: DEFAULT_STATUS_TYPES.SITE_VISIT,
    name: startCase(DEFAULT_STATUS_TYPES.SITE_VISIT),
  },
  [DEFAULT_STATUS_TYPES.NEGOTIATION]: {
    color: '#96CEB4',
    type: DEFAULT_STATUS_TYPES.NEGOTIATION,
    name: startCase(DEFAULT_STATUS_TYPES.NEGOTIATION),
  },
  [DEFAULT_STATUS_TYPES.CLOSED_WON]: {
    color: '#FFEAA7',
    type: DEFAULT_STATUS_TYPES.CLOSED_WON,
    name: startCase(DEFAULT_STATUS_TYPES.CLOSED_WON),
  },
  [DEFAULT_STATUS_TYPES.CLOSED_LOST]: {
    color: '#DDA0DD',
    type: DEFAULT_STATUS_TYPES.CLOSED_LOST,
    name: startCase(DEFAULT_STATUS_TYPES.CLOSED_LOST),
  },
};

export const OPPTY_STATUSES: Record<string, string> = {
  NEW_LEAD_UNASSIGNED: 'new_lead_unassigned',
  ASSIGNED_IN_CONTACT: 'assigned_in_contact',
  QUALIFIED_LEAD: 'qualified_lead',
  UNIT_SHORTLIST_CREATED: 'unit_shortlist_created',
  PROPERTY_VIEWING: 'property_viewing',
  UNIT_SELECTED: 'unit_selected',
  NEGOTIATION: 'negotiation',
  CONTRACT_DRAFTING_SIGNING: 'contract_drafting_signing',
  CLOSED_SUCCESSFUL: 'closed_successful',
  CLOSED_UNSUCCESSFUL: 'closed_unsuccessful',
  CANCELLED: 'cancelled',
} as const;

export const OPPTY_CUSTOMER_SOURCES = {
  WEBSITE: 'website',
  PHONE: 'phone',
  EMAIL: 'email',
  SOCIAL_MEDIA: 'social_media',
  FORM: 'form',
  SALES_MANAGER: 'sales_manager',
  OTHER: 'other',
} as const;

export const OPPTY_FIELDS = {
  priority: 'PRIORITY',
  assignedUserId: 'ASSIGNED_USER',
  blocks: 'BLOCK',
  status: 'STATUS',
  labelIds: 'LABEL',
  tagIds: 'TAG',
  projectId: 'PROJECT',
  unitTypes: 'UNIT_TYPE',
  units: 'UNITS',
  unit: 'UNIT',
  startDate: 'START_DATE',
  targetDate: 'TARGET_DATE',
};
