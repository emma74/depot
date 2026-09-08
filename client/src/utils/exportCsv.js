// Turns tabular data into a CSV file and triggers a browser download.
// columns: [{ key, label, value?: (row) => cell }] — value defaults to row[key]
// summary: optional { label: value } map appended as trailing rows (e.g. report totals)
function toCsvValue(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function buildCsv(columns, rows, summary) {
  const lines = [columns.map((col) => toCsvValue(col.label)).join(',')];

  for (const row of rows || []) {
    lines.push(
      columns
        .map((col) => toCsvValue(col.value ? col.value(row) : row[col.key]))
        .join(',')
    );
  }

  if (summary && Object.keys(summary).length) {
    lines.push('');
    for (const [label, value] of Object.entries(summary)) {
      lines.push([toCsvValue(label), toCsvValue(value)].join(','));
    }
  }

  return lines.join('\r\n');
}

export function downloadCsv(filename, columns, rows, summary) {
  const csv = buildCsv(columns, rows, summary);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
