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
    console.log('[BACKEND] POST /api/customers - Request received:', JSON.stringify(req.body));
    let { full_name, phone, email, company, position, status, notes } = req.body;

    // Validation - Only full_name is strictly required now
    if (!full_name) {
      console.warn('[BACKEND] Validation failed: full_name is required');
      return res.status(400).json({ error: 'Full name is required' });
    }

    // Normalize empty strings to null for optional fields
    const normalizedPhone = (phone && phone.trim() !== '') ? phone.trim() : null;
    const normalizedEmail = (email && email.trim() !== '') ? email.trim() : null;

    // Check uniqueness ONLY if phone is provided
    if (normalizedPhone) {
      const existing = await prisma.customer.findUnique({
        where: { phone: normalizedPhone },
      });

      if (existing) {
        console.warn('[BACKEND] Validation failed: duplicate phone number', normalizedPhone);
        return res.status(400).json({ error: 'Phone number already exists in system' });
      }
    }

    console.log('[BACKEND] Validation passed, saving to database...');
    const customer = await prisma.customer.create({
      data: {
        full_name: full_name.trim(),
        phone: normalizedPhone,
        email: normalizedEmail,
        company: company || null,
        position: position || null,
        status: status || 'new',
        notes: notes || null,
      },
    });

    console.log('[BACKEND] Customer saved successfully! ID:', customer.id);
    res.status(201).json(customer);
  } catch (error) {
    console.error('[BACKEND ERROR] Create customer failed:', error);
    res.status(500).json({ error: 'Internal Server Error while saving customer' });
  }
};

export const updateCustomer = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    console.log(`[BACKEND] PUT /api/customers/${id} - Request received:`, JSON.stringify(req.body));
    let { full_name, phone, email, company, position, status, notes } = req.body;

    if (!full_name) {
      return res.status(400).json({ error: 'Full name is required' });
    }

    const normalizedPhone = (phone && phone.trim() !== '') ? phone.trim() : null;
    const normalizedEmail = (email && email.trim() !== '') ? email.trim() : null;

    // Check uniqueness excluding current record
    if (normalizedPhone) {
      const existing = await prisma.customer.findFirst({
        where: { 
          phone: normalizedPhone,
          id: { not: parseInt(id) }
        },
      });

      if (existing) {
         return res.status(400).json({ error: 'Phone number already in use by another customer' });
      }
    }

    const customer = await prisma.customer.update({
      where: { id: parseInt(id) },
      data: {
        full_name: full_name.trim(),
        phone: normalizedPhone,
        email: normalizedEmail,
        company: company || null,
        position: position || null,
        status: status || 'new',
        notes: notes || null,
      },
    });

    console.log('[BACKEND] Customer updated successfully! ID:', id);
    res.json(customer);
  } catch (error) {
    console.error('[BACKEND ERROR] Update customer failed:', error);
    res.status(500).json({ error: 'Internal Server Error while updating customer' });
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
