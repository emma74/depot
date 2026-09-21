import { HttpError } from './errors.js';

// Validates the `items` array sent when editing a sales or purchase order. Items that
// carry an `id` are edits to an existing row; items without one are new.
export function parseOrderItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new HttpError(400, 'At least one item is required');
  }

  const seenIds = new Set();

  return items.map((item, index) => {
    const label = `Item ${index + 1}`;
    const product = typeof item?.product === 'string' ? item.product.trim() : '';
    const qty = Number(item?.qty);
    const unitPrice = Number(item?.unitPrice);

    if (!product) throw new HttpError(400, `${label}: product is required`);
    if (!Number.isFinite(qty) || qty <= 0) {
      throw new HttpError(400, `${label}: qty must be a positive number`);
    }
    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
      throw new HttpError(400, `${label}: unitPrice must be zero or more`);
    }

    let id;
    if (item.id !== undefined && item.id !== null) {
      id = Number(item.id);
      if (!Number.isInteger(id) || seenIds.has(id)) {
        throw new HttpError(400, `${label}: invalid or duplicate item id`);
      }
      seenIds.add(id);
    }

    return { id, product, qty, unitPrice };
  });
}

// Splits the submitted items into rows to update (matched by id), rows to create, and
// existing rows that were left out and so should be removed.
export function planItemChanges(existingItems, items) {
  const existingIds = new Set(existingItems.map((item) => item.id));

  for (const item of items) {
    if (item.id !== undefined && !existingIds.has(item.id)) {
      throw new HttpError(400, `Item ${item.id} does not belong to this order`);
    }
  }

  const keptIds = new Set(items.filter((item) => item.id !== undefined).map((item) => item.id));

  return {
    updates: items.filter((item) => item.id !== undefined),
    creates: items.filter((item) => item.id === undefined),
    removals: existingItems.filter((item) => !keptIds.has(item.id)),
  };
}
