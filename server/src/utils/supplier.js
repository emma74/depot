import { HttpError } from './errors.js';

// Resolves a purchase order's supplier from either an existing id (picked from the list)
// or a typed name (found case-insensitively, or created if it's genuinely new) — the same
// find-or-create-by-name pattern used for usernames at registration. Must run inside a
// transaction: a race between two requests creating the "same" new supplier at once is
// caught by the name's unique constraint, not by locking here.
export async function resolveSupplier(tx, { supplierId, supplierName }) {
  if (supplierId !== undefined && supplierId !== null && supplierId !== '') {
    const id = Number(supplierId);
    if (!Number.isInteger(id)) throw new HttpError(400, 'Invalid supplier id');
    const supplier = await tx.supplier.findUnique({ where: { id } });
    if (!supplier) throw new HttpError(404, 'Supplier not found');
    return supplier;
  }

  const name = typeof supplierName === 'string' ? supplierName.trim() : '';
  if (!name) throw new HttpError(400, 'A supplier is required');

  const existing = await tx.supplier.findFirst({
    where: { name: { equals: name, mode: 'insensitive' } },
  });
  if (existing) return existing;

  return tx.supplier.create({ data: { name } });
}
