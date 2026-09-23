import express from 'express';
import prisma from '../prismaClient.js';
import { HttpError, sendError } from '../utils/errors.js';
import { listSupplierBalances } from '../utils/supplierBalance.js';

const router = express.Router();

function parseSupplierName(body) {
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (!name) throw new HttpError(400, 'name is required');
  return name;
}

// Every supplier with its current running balance — feeds the Suppliers page and the
// purchase order form's supplier picker (which just ignores the balance fields).
router.get('/', async (req, res) => {
  try {
    const suppliers = await listSupplierBalances(prisma);
    res.json(suppliers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==============================
//  ADD SUPPLIER
// ==============================
router.post('/', async (req, res) => {
  try {
    const name = parseSupplierName(req.body);

    const existing = await prisma.supplier.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
    });
    if (existing) throw new HttpError(409, `A supplier named "${existing.name}" already exists`);

    const supplier = await prisma.supplier.create({ data: { name } });
    res.status(201).json(supplier);
  } catch (err) {
    sendError(res, err);
  }
});

// ==============================
//  RENAME SUPPLIER
// ==============================
router.put('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) throw new HttpError(400, 'Invalid supplier id');
    const name = parseSupplierName(req.body);

    const existing = await prisma.supplier.findUnique({ where: { id } });
    if (!existing) throw new HttpError(404, 'Supplier not found');

    const duplicate = await prisma.supplier.findFirst({
      where: { id: { not: id }, name: { equals: name, mode: 'insensitive' } },
    });
    if (duplicate) throw new HttpError(409, `A supplier named "${duplicate.name}" already exists`);

    const supplier = await prisma.supplier.update({ where: { id }, data: { name } });
    res.json(supplier);
  } catch (err) {
    sendError(res, err);
  }
});

export default router;
