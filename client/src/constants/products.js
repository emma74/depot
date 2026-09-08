// Suggested product catalog for sales/purchase order line items and Product Totals.
// The `product` field on a line item is a free-text string (see server/prisma/schema.prisma),
// so this list only powers suggestions in <ProductInput> — typing anything not on the
// list is still accepted.
export const PRODUCTS = [
  '30cl',
  '20cl',
  'Can Mineral',
  'Pet(0.30 x 12)',
  'Pet (1.5 x 6)',
  'Pet(1 x 6)',
  'Pet(0.45 x 12)',
  'Pet (0.5 x 12)',
  'Pet zero (0.35 x 12)',
  'Pet zero(1.5 x 6)',
  'Club(tonic\\soda x 12)',
  'Vibe Eneregy',
];
