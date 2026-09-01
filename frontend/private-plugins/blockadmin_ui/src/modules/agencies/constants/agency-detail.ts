export const AGENCY_DETAIL_TABS = {
  GENERAL: 'general',
  ACTIVITY: 'activity',
  OPERATION_AREA: 'operation-area',
  CONTACT: 'contact',
  DOCUMENTS: 'documents',
  SOCIAL_LINKS: 'social-links',
  AGENTS: 'agents',
  INTEGRATIONS: 'integrations',
} as const;

export type AgencyDetailTab =
  (typeof AGENCY_DETAIL_TABS)[keyof typeof AGENCY_DETAIL_TABS];

export const AGENCY_OVERVIEW_TABS: { value: AgencyDetailTab; label: string }[] =
  [
    { value: AGENCY_DETAIL_TABS.GENERAL, label: 'General' },
    { value: AGENCY_DETAIL_TABS.ACTIVITY, label: 'Field of activity' },
    { value: AGENCY_DETAIL_TABS.OPERATION_AREA, label: 'Operation area' },
    { value: AGENCY_DETAIL_TABS.CONTACT, label: 'Contact' },
    { value: AGENCY_DETAIL_TABS.DOCUMENTS, label: 'Documents' },
    { value: AGENCY_DETAIL_TABS.SOCIAL_LINKS, label: 'Social links' },
  ];

export const AGENCY_SETTINGS_TABS: { value: AgencyDetailTab; label: string }[] =
  [
    { value: AGENCY_DETAIL_TABS.AGENTS, label: 'Agents' },
    { value: AGENCY_DETAIL_TABS.INTEGRATIONS, label: 'Integrations' },
  ];
