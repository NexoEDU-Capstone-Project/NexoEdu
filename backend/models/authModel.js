import pool from '../db.js';
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SECRET_KEY  // La clave secreta
)
// Función para buscar un usuario por su username en la base de datos
export async function buscarPorUsername(username) {
    // Realiza la consulta a la base de datos para obtener la información del usuario
    const resultado = await pool.query(
        'SELECT * FROM view_credential_info WHERE username = $1',
        [username]
    );
    // Devuelve el primer resultado de la consulta, que corresponde al usuario encontrado
    return resultado.rows[0];
}