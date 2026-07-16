import express from 'express';
import { crearAdmin, asignarInstitucion, eliminarAdmin } from '../controllers/adminController.js';
import authToken from '../middleware/authMiddleware.js';
import requireRole from '../middleware/requireRole.js';

const router = express.Router();

router.post('/', authToken, requireRole('SUPERADMIN'), crearAdmin);
router.put('/:id/assign', authToken, requireRole('SUPERADMIN'), asignarInstitucion);
router.delete('/:id', authToken, requireRole('SUPERADMIN'), eliminarAdmin);

export default router;