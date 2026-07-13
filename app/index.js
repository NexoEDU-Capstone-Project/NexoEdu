// Importación de librerías necesarias para la configuración del servidor
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRouter from '../api/back_auth.js';

// Crear una instancia de la aplicación Express
const app = express();
app.use(cors());
app.use(express.json());

// Configurar la ruta para el endpoint de autenticación, utilizando el router importado desde back_auth.js
app.use('/api/auth', authRouter);

// Iniciar el servidor en el puerto especificado en las variables de entorno o en el puerto 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Backend corriendo en puerto ${PORT}`));