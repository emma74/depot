export function formatCurrency(value) {
  const n = Number(value ?? 0);
  return n.toLocaleString('en-GH', { style: 'currency', currency: 'GHS' });
}

export function formatDate(value) {
  if (!value) return '—';
  // Dates are stored as UTC midnight for a plain calendar day (no meaningful
  // time-of-day component), so format in UTC too — otherwise a viewer behind
  // UTC sees the previous day.
  return new Date(value).toLocaleDateString('en-GB', { timeZone: 'UTC' });
}

export function formatQty(value) {
  return Number(value ?? 0).toLocaleString();
}
