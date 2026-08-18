export function formatCompactNumber(number: number) {
  const formatter = new Intl.NumberFormat('en-US', {
    notation: 'compact',
    compactDisplay: 'short',
  });

  return formatter.format(number);
}

export function formatCurrencyNumber(currency: string) {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  const parts = formatter.formatToParts();
  const currencySymbol = parts.find((part) => part.type === 'currency')?.value;

  return currencySymbol;
}
