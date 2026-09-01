export const PROFILE_TABS = {
  BASIC: 'basic',
  BIOGRAPHY: 'biography',
  ACTIVITY: 'activity',
  INFORMATION: 'information',
  FINANCE: 'finance',
  CONTACT: 'contact',
} as const;

export type ProfileTab = (typeof PROFILE_TABS)[keyof typeof PROFILE_TABS];

export const PROFILE_OVERVIEW_TABS: { value: ProfileTab; label: string }[] = [
  { value: PROFILE_TABS.BASIC, label: 'Үндсэн мэдээлэл' },
  { value: PROFILE_TABS.BIOGRAPHY, label: 'Намтар' },
  { value: PROFILE_TABS.ACTIVITY, label: 'Үйл ажиллагаа' },
];

export const PROFILE_PUBLIC_TABS: { value: ProfileTab; label: string }[] = [
  { value: PROFILE_TABS.INFORMATION, label: 'Мэдээлэл' },
  { value: PROFILE_TABS.FINANCE, label: 'Санхүү' },
  { value: PROFILE_TABS.CONTACT, label: 'Холбоо барих' },
];
