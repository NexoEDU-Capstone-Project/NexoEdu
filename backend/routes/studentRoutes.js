import express from 'express';
import * as StudentController from '../controllers/studentController.js';
import authToken from '../middleware/authMiddleware.js';
import requireRole from '../middleware/requireRole.js';

const router= express.Router();

router.get('/', authToken, requireRole('superadmin', 'administrador'), StudentController.listar);
router.get('/:id', authToken, requireRole('superadmin', 'administrador'), StudentController.obtenerUno);
router.post('/', authToken, requireRole('superadmin', 'administrador'), StudentController.crear);
router.put('/:id', authToken, requireRole('superadmin', 'administrador'), StudentController.actualizar);
router.delete('/:id', authToken, requireRole('superadmin', 'administrador'), StudentController.eliminar);
router.get('/:id/eligible-campaigns', authToken, requireRole('superadmin', 'administrador'), StudentController.campanasElegibles);
export default router;