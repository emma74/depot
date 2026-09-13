export function formatCurrency(value) {
  const n = Number(value ?? 0);
  return n.toLocaleString('en-GH', { style: 'currency', currency: 'GHS' });
}

export function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-GB');
}

export function formatQty(value) {
  return Number(value ?? 0).toLocaleString();
}
