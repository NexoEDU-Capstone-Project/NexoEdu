import pool from '../db.js';

export async function obtenerRolId(nombreRol) {
    const resultado = await pool.query(
        'SELECT id FROM user_roles WHERE name = $1',
        [nombreRol]
    );
    return resultado.rows[0]?.id;
}