export const UNIT_LEASE_STATUS = {
  vacant: {
    mn: 'Чөлөөтэй',
    en: 'Vacant',
    color: 'var(--border)',
  },
  reserved: {
    mn: 'Урьдчилсан захиалга',
    en: 'Reserved',
    color: 'var(--warning)',
  },
  leased: {
    mn: 'Түрээслэгдсэн',
    en: 'Leased/Occupied',
    color: 'var(--success)',
  },
  leaseExpireSoon: {
    mn: 'Дуусах гэж буй',
    en: 'Lease expire soon',
    color: 'oklch(0.7049 0.1867 47.6)',
  },
  leaseRenewal: {
    mn: 'Сунгагдаж буй',
    en: 'Lease renewal',
    color: 'var(--ring)',
  },
  underFitout: {
    mn: 'Дотоод тохижилт',
    en: 'Under Fitout',
    color: 'oklch(0.6559 0.2118 354.31)',
  },
  cancelled: {
    mn: 'Цуцлагдсан',
    en: 'Cancelled',
    color: 'var(--muted-foreground)',
  },
  internalUse: {
    mn: 'Дотоод хэрэглээ',
    en: 'Internal use',
    color: 'oklch(0.7038 0.123 182.5)',
  },
  onHold: {
    mn: 'Түгжсэн',
    en: 'On hold',
    color: 'var(--info)',
  },
};
