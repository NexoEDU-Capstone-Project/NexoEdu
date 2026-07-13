// Importe de librerías necesarias para la conexión a la base de datos
import 'dotenv/config';
import pg from 'pg';
const { Pool } = pg;

// Objeto que contiene la configuración de la conexión a la base de datos PostgreSQL, utilizando variables de entorno para mayor seguridad y flexibilidad.
const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
});

// Exportación del objeto
export default pool;