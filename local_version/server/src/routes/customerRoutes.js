import express from 'express';
import prisma from '../prismaClient.js'; 

const router = express.Router();

//
// CREATE CUSTOMER
//
router.post('/', async (req, res) => {
  try {
    const {
      businessName,
      contactPerson,
      phone,
      ghCard,
      location,
      date,
      userId
    } = req.body;

    const customer = await prisma.customer.create({
      data: {
        businessName,
        contactPerson,
        phone,
        ghCard,
        location,
        date: date ? new Date(date) : new Date(),
        userId
      }
    });

    res.status(201).json(customer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//
// GET ALL CUSTOMERS
//
router.get('/', async (req, res) => {
  try {
    const customers = await prisma.customer.findMany({
      include: {
        orders: true,
        user: true
      }
    });

    res.json(customers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//
// GET SINGLE CUSTOMER
//
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const customer = await prisma.customer.findUnique({
      where: { id: Number(id) },
      include: {
        orders: {
          include: {
            items: true,
            payments: true
          }
        },
        user: true
      }
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json(customer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//
// UPDATE CUSTOMER
//
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const updatedCustomer = await prisma.customer.update({
      where: { id: Number(id) },
      data: req.body
    });

    res.json(updatedCustomer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//
// DELETE CUSTOMER
//
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.customer.delete({
      where: { id: Number(id) }
    });

    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//
// GET CUSTOMER ORDERS
//
router.get('/orders/:id/summary', async (req, res) => {
  try {
    const userId = Number(req.params.id);
    const { startDate, endDate } = req.query;

    // Build date filter if provided
    const dateFilter = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    //Fetch orders in the range (or all if no range)
    const orders = await prisma.salesOrder.findMany({
      where: {
        userId,
        ...(startDate || endDate ? { orderDate: dateFilter } : {}),
      },
      include: {
        items: {
          include: {
            returns: true
          }
        },
        payments: true
      }
    });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;