import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const getCustomers = async (req: Request, res: Response) => {
  try {
    console.log('[BACKEND] Fetching all customers');
    const customers = await prisma.customer.findMany({
      orderBy: { created_at: 'desc' },
    });
    res.json(customers);
  } catch (error) {
    console.error('[BACKEND ERROR] Fetch customers failed:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
};

export const createCustomer = async (req: Request, res: Response) => {
  try {
    console.log('[BACKEND] POST /api/customers - Request received:', req.body);
    const { full_name, phone, email, company, position, status, notes } = req.body;

    // Validation
    if (!full_name || !phone) {
      console.warn('[BACKEND] Validation failed: name and phone are required');
      return res.status(400).json({ error: 'Full name and phone are required' });
    }

    // Check uniqueness
    const existing = await prisma.customer.findUnique({
      where: { phone },
    });

    if (existing) {
      console.warn('[BACKEND] Validation failed: duplicate phone number', phone);
      return res.status(400).json({ error: 'Phone number must be unique' });
    }

    console.log('[BACKEND] Validation passed, saving to database...');
    const customer = await prisma.customer.create({
      data: {
        full_name,
        phone,
        email: email || null,
        company: company || null,
        position: position || null,
        status: status || 'new',
        notes: notes || null,
      },
    });

    console.log('[BACKEND] Customer saved successfully:', customer.id);
    res.status(201).json(customer);
  } catch (error) {
    console.error('[BACKEND ERROR] Create customer failed:', error);
    res.status(500).json({ error: 'Failed to save customer' });
  }
};

export const updateCustomer = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    console.log(`[BACKEND] PUT /api/customers/${id} - Request received:`, req.body);
    const { full_name, phone, email, company, position, status, notes } = req.body;

    if (!full_name || !phone) {
      return res.status(400).json({ error: 'Full name and phone are required' });
    }

    // Check uniqueness excluding current
    const existing = await prisma.customer.findFirst({
      where: { 
        phone,
        id: { not: parseInt(id) }
      },
    });

    if (existing) {
       return res.status(400).json({ error: 'Phone number already in use' });
    }

    const customer = await prisma.customer.update({
      where: { id: parseInt(id) },
      data: {
        full_name,
        phone,
        email: email || null,
        company: company || null,
        position: position || null,
        status: status || 'new',
        notes: notes || null,
      },
    });

    console.log('[BACKEND] Customer updated successfully:', id);
    res.json(customer);
  } catch (error) {
    console.error('[BACKEND ERROR] Update customer failed:', error);
    res.status(500).json({ error: 'Failed to update customer' });
  }
};

export const deleteCustomer = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    console.log(`[BACKEND] DELETE /api/customers/${id}`);
    await prisma.customer.delete({
      where: { id: parseInt(id) },
    });
    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('[BACKEND ERROR] Delete customer failed:', error);
    res.status(500).json({ error: 'Failed to delete customer' });
  }
};

export const getStats = async (req: Request, res: Response) => {
  try {
    const total = await prisma.customer.count();
    const newCount = await prisma.customer.count({ where: { status: 'new' } });
    const contactedCount = await prisma.customer.count({ where: { status: 'contacted' } });
    const convertedCount = await prisma.customer.count({ where: { status: 'converted' } });

    res.json({
      total,
      new: newCount,
      contacted: contactedCount,
      converted: convertedCount,
    });
  } catch (error) {
    console.error('[BACKEND ERROR] Fetch stats failed:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
};
