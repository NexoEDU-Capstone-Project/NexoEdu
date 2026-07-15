import express from 'express';
import { login, refresh, logout } from '../controllers/authController.js';

// Crea un enrutador de Express para manejar las rutas de autenticación
const router = express.Router();
// Define la ruta POST para el inicio de sesión, que llama a la función login del controlador
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', logout);
export default router;