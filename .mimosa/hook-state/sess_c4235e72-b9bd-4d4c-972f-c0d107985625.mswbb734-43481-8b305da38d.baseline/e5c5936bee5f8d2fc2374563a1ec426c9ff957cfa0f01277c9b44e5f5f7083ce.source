const escapeCell = (value: unknown): string => {
  const text = value == null ? '' : String(value);
  const safe = /^[=+\-@]/.test(text) ? `\t${text}` : text;

  return `"${safe.replace(/"/g, '""')}"`;
};

export const toCsv = (headers: string[], rows: unknown[][]): string =>
  [headers, ...rows].map((row) => row.map(escapeCell).join(',')).join('\r\n');

const BOM = '\ufeff';

export const downloadCsv = (fileName: string, csv: string) => {
  const blob = new Blob([`${BOM}${csv}`], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
};
