import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import cookieParser from 'cookie-parser'
import authToken from './middleware/authMiddleware.js'
import protectedRoute from './routes/protectedRoutes.js';

// Crea una instancia de la aplicación Express
const app = express();
// Configura CORS y el middleware para parsear JSON en las solicitudes entrantes
app.use(cors());
app.use(express.json());
app.use(cookieParser())

// Define la ruta base para las rutas de autenticación, que se manejarán en authRoutes
app.use('/auth', authRoutes);
app.get('/logout', (req, res) => {
    res
        .clearCookie('accessToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        })
        .json({ message: 'Sesión cerrada correctamente.' })
})

//Superadmin
// app.get('/dashboard-general', authToken, protectedRoute('dashboard-general'))
// app.get('/gestion-eventos', authToken, protectedRoute('gestion-eventos'))
// app.get('/gestion-escuelas', authToken, protectedRoute('gestion-escuelas'))

//Admin
// app.get('/dashboard-escuela', authToken, protectedRoute('dashboard-escuela'))
// app.get('/gestion-estudiantes', authToken, protectedRoute('gestion-estudiantes'))
// app.get('/eventos-propios', authToken, protectedRoute('eventos-propios'))

//Usuario
// app.get('/ver-eventos', authToken, protectedRoute('ver-eventos'))

// Inicia el servidor en el puerto especificado en las variables de entorno y muestra un mensaje en la consola
const PORT = process.env.PORT;
app.listen(PORT, () => console.log(`Backend corriendo en puerto ${PORT}`));