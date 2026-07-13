import pool from '../db.js';

export async function buscarPorUsername(username) {
    const resultado = await pool.query(
        'SELECT * FROM view_credential_info WHERE username = $1',
        [username]
    );
    return resultado.rows[0];
}