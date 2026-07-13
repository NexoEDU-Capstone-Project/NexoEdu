import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';

// Crea una instancia de la aplicación Express
const app = express();
// Configura CORS y el middleware para parsear JSON en las solicitudes entrantes
app.use(cors());
app.use(express.json());

// Define la ruta base para las rutas de autenticación, que se manejarán en authRoutes
app.use('/api/auth', authRoutes);

// Inicia el servidor en el puerto especificado en las variables de entorno y muestra un mensaje en la consola
const PORT = process.env.PORT;
app.listen(PORT, () => console.log(`Backend corriendo en puerto ${PORT}`));