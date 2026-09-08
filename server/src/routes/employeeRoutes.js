import express from 'express';
import prisma from '../prismaClient.js'; 

const router = express.Router();

// Admin creates employee
router.post('/', async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      phone,
      ghCard,
      license,
      email,
      address,
      salary,
      position,
      isAdmin,
      date,
      userId // must exist and come from admin
    } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "userId is required to link employee to a user" });
    }

    const employee = await prisma.employee.create({
      data: {
        firstName,
        lastName,
        phone,
        ghCard,
        license,
        email,
        address,
        salary,
        position,
        isAdmin,
        date: date ? new Date(date) : new Date(),
        user: {
          connect: { id: userId } // link to existing user
        }
      }
    });

    res.json(employee);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//get employee by id
router.get('/:id', async (req, res) => {
  try {
    const employee = await prisma.employee.findFirst({
      where: { id: Number(req.params.id), isActive: true }
    });

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    if (req.user.role !== 'admin' && employee.userId !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    res.json(employee);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//get all employees
router.get('/', async (req, res) => {
  try {
    const where = {
      isActive: true,
      ...(req.user.role === 'admin' ? {} : { userId: req.user.id }),
    };
    const employees = await prisma.employee.findMany({ where });
    res.json(employees);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//update employee
router.put('/:id', async (req, res) => {
  try {
    const employee = await prisma.employee.update({
      where: { id: Number(req.params.id) },
      data: req.body
    });
    res.json(employee);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//delete employee
router.delete('/:id', async (req, res) => {
  try {
    const employee = await prisma.employee.update({
      where: { id: Number(req.params.id) },
      data: {
        isActive: false,
        deletedAt: new Date()
      }
    });
    res.json({ message: 'Employee deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router