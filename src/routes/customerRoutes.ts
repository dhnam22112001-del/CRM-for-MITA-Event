import { Router } from 'express';
import { 
  getCustomers, 
  createCustomer, 
  updateCustomer, 
  deleteCustomer,
  getStats
} from '../controllers/customerController';

const router = Router();

router.get('/', getCustomers);
router.post('/', createCustomer);
router.get('/stats', getStats);
router.put('/:id', updateCustomer);
router.delete('/:id', deleteCustomer);

export default router;
