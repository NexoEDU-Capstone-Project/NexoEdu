require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Crear una instancia de la aplicación Express
const app = express();
app.use(cors());
app.use(express.json());

// Importar y usar las rutas de autenticación
const authRouter = require('./routes/auth');
app.use('/api/auth', authRouter);

// Iniciar el servidor en el puerto especificado en las variables de entorno o en el puerto 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Backend corriendo en puerto ${PORT}`));