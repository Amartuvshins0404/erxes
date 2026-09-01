export const formatDate = (value?: Date | string | null) =>
  value ? new Date(value).toLocaleDateString('mn-MN') : '';

export const formatLongDate = (value?: Date | string | null) =>
  value
    ? new Date(value).toLocaleDateString('mn-MN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

export const formatMoney = (value?: number | null) =>
  value === null || value === undefined
    ? null
    : `${value.toLocaleString('mn-MN')}₮`;

export const formatYearRange = (start?: number | null, end?: number | null) =>
  [start, end].some(Boolean) ? `${start ?? '…'} – ${end ?? 'одоог хүртэл'}` : '';
