import express from 'express';
import * as InstitutionController from '../controllers/institutionController.js';
import authToken from '../middleware/authMiddleware.js';
import requireRole from '../middleware/requireRole.js';

const router = express.Router();

router.get('/', authToken, InstitutionController.listar);
router.get('/:id', authToken, InstitutionController.obtenerUna);
router.post('/', authToken, requireRole('superadmin'), InstitutionController.crear);
router.put('/:id', authToken, requireRole('superadmin'), InstitutionController.actualizar);
router.delete('/:id', authToken, requireRole('superadmin'), InstitutionController.eliminar);

export default router;