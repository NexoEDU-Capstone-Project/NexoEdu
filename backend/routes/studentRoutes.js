import express from 'express'
import * as StudentController from '../controllers/studentController.js'
import authToken from '../middleware/authMiddleware.js'
import requireRole from '../middleware/requireRole.js'

const router= express.Router()

router.get('/', authToken, requireRole('administrador'), StudentController.listar)
router.get('/:id', authToken, requireRole('administrador'), StudentController.obtenerUno)
router.post('/', authToken, requireRole('administrador'), StudentController.crear)
router.put('/:id', authToken, requireRole('administrador'), StudentController.actualizar)
router.delete('/:id', authToken, requireRole('administrador'), StudentController.eliminar)

export default router