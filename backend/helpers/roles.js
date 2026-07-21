import pool from '../db.js';

export async function obtenerRolId(nombreRol) {
    const resultado = await pool.query(
        'SELECT id FROM user_roles WHERE name = $1',
        [nombreRol]
    );
    return resultado.rows[0]?.id;
}

// Devuelve el id de la credencial (tabla credentials) de un usuario logueado
// a partir de su username. Se usa, por ejemplo, para registrar quién creó
// una campaña (campaigns.created_by_credentials_id).
export async function obtenerCredentialIdPorUsername(username) {
    const resultado = await pool.query(
        'SELECT id FROM credentials WHERE username = $1',
        [username]
    );
    return resultado.rows[0]?.id ?? null;
}