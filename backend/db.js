import 'dotenv/config';
import pg from 'pg';
const { Pool } = pg;
/*
  Para correr pruebas que requieran la base de datos se debe dejar lo siguiente en el .env:
  - USE_LOCAL_DB=true
  - Llenar las variables de configuración de postgres local (DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD)
  De esta forma se usa una base de datos local y no se modifican los datos reales de la base en la nube.
  Si se quiere usar la base de datos en la nube se deja todo como está (USE_LOCAL_DB=false) y se llena SUPABASE_DB_URL
  con la URL de supabase.
*/
const pool = process.env.USE_LOCAL_DB === 'true'
  ? new Pool({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
    })
  : new Pool({
      connectionString: process.env.SUPABASE_DB_URL,
      ssl: { rejectUnauthorized: false }
    });

export default pool;