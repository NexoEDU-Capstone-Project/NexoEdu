import express from 'express';
import * as CampaignController from '../controllers/campaignController.js';
import authToken from '../middleware/authMiddleware.js';
import requireRole from '../middleware/requireRole.js';

const router = express.Router();

router.get('/', authToken, CampaignController.listar);
router.get('/:id', authToken, CampaignController.obtenerUna);
router.post('/', authToken, requireRole('superadmin', 'administrador'), CampaignController.crear);

export default router;