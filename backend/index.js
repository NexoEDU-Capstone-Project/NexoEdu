// Importa las dependencias necesarias para la aplicación
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import cookieParser from 'cookie-parser'
import authToken from './middleware/authMiddleware.js'
import protectedRoute from './routes/protectedRoutes.js';
import requireRole from './middleware/requireRole.js';

// Crea una instancia de la aplicación Express
const app = express();
// Configura CORS para permitir solicitudes desde el frontend, incluyendo credenciales (cookies)
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(cookieParser())

// Ruta de prueba para verificar que el servidor funciona
app.get('/api/test', (req, res) => {
    res.json({ message: 'Servidor funcionando correctamente!' });
});

// Rutas de autenticación y manejo de sesiones
app.use('/api/auth', authRoutes);

/*
Futuros endpoints
app.get('/dashboard-general', authToken, requireRole('SUPERADMIN'), protectedRoute('dashboard-general'))
app.get('/gestion-eventos', authToken, requireRole('SUPERADMIN'), protectedRoute('gestion-eventos'))
app.get('/gestion-escuelas', authToken, requireRole('SUPERADMIN'), protectedRoute('gestion-escuelas'))

app.get('/dashboard-escuela', authToken, requireRole('ADMIN'), protectedRoute('dashboard-escuela'))
app.get('/gestion-estudiantes', authToken, requireRole('ADMIN'), protectedRoute('gestion-estudiantes'))
app.get('/eventos-propios', authToken, requireRole('ADMIN'), protectedRoute('eventos-propios'))

app.get('/ver-eventos', authToken, requireRole('ESTUDIANTE'), protectedRoute('ver-eventos'))
*/

// Manejo de errores
app.use((err, req, res, next) => {
    console.error('Error en el servidor:', err);
    res.status(500).json({ error: 'Error interno del servidor', message: err.message });
});

// Inicia el servidor en el puerto especificado en las variables de entorno y muestra un mensaje en la consola
const PORT = process.env.PORT;
const server = app.listen(PORT, () => console.log(`Backend corriendo en puerto ${PORT}`));

// Manejo de cierre del servidor
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    server.close(() => process.exit(1));
});

// Manejo de promesas no manejadas
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    server.close(() => process.exit(1));
});