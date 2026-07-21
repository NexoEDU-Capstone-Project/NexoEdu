import 'dotenv/config';
import pg from 'pg';
const { Pool } = pg;

// Permite alternar entre la BD local (para pruebas de desarrollo) y Supabase
// sin tocar código: basta con poner USE_LOCAL_DB=true en el .env.
// - Local: conexión por host/puerto/usuario/clave, sin SSL (Postgres local
//   no usa TLS por defecto).
// - Supabase (u otro proveedor gestionado): connection string completa + SSL.
const usarLocal = process.env.USE_LOCAL_DB === 'true';

const pool = usarLocal
  ? new Pool({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD
    })
  : new Pool({
      connectionString: process.env.SUPABASE_DB_URL,
      ssl: { rejectUnauthorized: false }
    });

export default pool;
