// Importaciones de dependencias y configuración del entorno
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger.js';
import requestLogger from './middleware/requestLogger.js';
import pool from './db.js'


// Importaciones de rutas y controladores
import authRoutes from './routes/authRoutes.js';
import institutionRoutes from './routes/institutionRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import campaignRoutes from './routes/campaignRoutes.js';
import catalogRoutes from './routes/catalogRoutes.js';

// Verifica la conexión a la base de datos al arrancar.
pool.query('SELECT NOW()')
.then(() => console.log('\x1b[32m✅ Conexión a la base de datos establecida\x1b[0m'))
.catch((err) => console.error('\x1b[31m❌ Error al conectar con la base de datos:\x1b[0m', err.message))

// Crea una instancia de la aplicación Express
const app = express();  
// Configura CORS para permitir solicitudes desde el frontend, incluyendo credenciales (cookies)
// Orígenes permitidos: el frontend en producción (FRONTEND_URL) y el de
// desarrollo local. credentials:true es imprescindible para la cookie de sesión.
const origenesPermitidos = [process.env.FRONTEND_URL, 'http://localhost:5173'].filter(Boolean);
app.use(cors({ origin: origenesPermitidos, credentials: true }));
app.use(express.json());
app.use(cookieParser())
// Log de cada petición en la consola del backend (método, ruta, estado, tiempo).
app.use(requestLogger);

// Configuración de Swagger para la documentación de la API
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Ruta de prueba para verificar que el servidor funciona
app.get('/api/test', (req, res) => {
    res.json({ message: 'Servidor funcionando correctamente!' });
});

// Rutas de autenticación y manejo de sesiones
app.use('/api/auth', authRoutes);

// Rutas de instituciones, protegidas por autenticación y autorización
app.use('/api/institutions', institutionRoutes);

// Rutas de administración, protegidas por autenticación y autorización
app.use('/api/admins', adminRoutes);

// Rutas de estudiantes/egresados, protegidas por autenticación, rol e institución
app.use('/api/students', studentRoutes);

// Rutas de campañas de actualización, protegidas por autenticación, rol e institución
app.use('/api/campaigns', campaignRoutes);

// Catálogos de solo lectura (géneros, grados, estados, tipos de documento, localidades, barrios)
app.use('/api/catalogs', catalogRoutes);

// Manejo de errores
app.use((err, req, res, next) => {
    console.error('Error en el servidor:', err);
    res.status(500).json({ error: 'Error interno del servidor', message: err.message });
});

// Inicia el servidor y muestra un banner de bienvenida con la marca y los
// enlaces útiles (API y documentación Swagger).
const PORT = process.env.PORT;
const server = app.listen(PORT, () => {
    const C = { navy: '\x1b[36m', green: '\x1b[32m', yellow: '\x1b[33m', gris: '\x1b[90m', bold: '\x1b[1m', reset: '\x1b[0m' };
    const base = `http://localhost:${PORT}`;
    const db = process.env.USE_LOCAL_DB === 'true' ? `local (${process.env.DB_NAME})` : 'Supabase';
    const linea = `${C.navy}${C.bold}  ══════════════════════════════════════════════════════════${C.reset}`;
    console.log(`
${linea}
   ${C.green}${C.bold}NexoEdu${C.reset} ${C.gris}—${C.reset} Seguimiento de estudiantes y egresados
   ${C.gris}Un proyecto hecho por coders de Riwi en alianza con la${C.reset}
   ${C.gris}Alcaldía de Barranquilla${C.reset}
${linea}
   ${C.yellow}API:${C.reset}      ${base}
   ${C.yellow}Swagger:${C.reset}  ${base}/api-docs
   ${C.yellow}Base de datos:${C.reset} ${db}
${linea}
`);
});

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