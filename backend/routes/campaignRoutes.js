import express from 'express';
import * as CampaignController from '../controllers/campaignController.js';
import authToken from '../middleware/authMiddleware.js';
import requireRole from '../middleware/requireRole.js';

const router = express.Router();

router.get('/', authToken, CampaignController.listar);
router.get('/mine', authToken, requireRole('estudiante'), CampaignController.misCampanas);
router.get('/:id', authToken, CampaignController.obtenerUna);
router.post('/', authToken, requireRole('superadmin', 'administrador'), CampaignController.crear);
router.post('/:id/criteria', authToken, requireRole('superadmin', 'administrador'), CampaignController.crearCriteria);
router.get('/:id/criteria', authToken, CampaignController.obtenerCriteria);
router.post('/:id/enroll', authToken, requireRole('estudiante'), CampaignController.inscribirse);

export default router;