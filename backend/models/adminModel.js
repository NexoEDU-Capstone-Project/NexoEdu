import pool from '../db.js';

export async function existeUsername(username) {
    const resultado = await pool.query(
        'SELECT id FROM credentials WHERE username = $1',
        [username]
    );
    return resultado.rows.length > 0;
}

export async function existeInstitucion(id) {
    const resultado = await pool.query('SELECT id FROM institutions WHERE id = $1', [id]);
    return resultado.rows.length > 0;
}

export async function crearCredencial({ username, password, role_id }) {
    const resultado = await pool.query(
        `INSERT INTO credentials (username, password, role_id)
        VALUES ($1, $2, $3) RETURNING *`,
        [username, password, role_id]
    );
    return resultado.rows[0];
}

export async function asignarAInstitucion(credential_id, institution_id) {
    const resultado = await pool.query(
        `UPDATE institutions SET credential_id = $1 WHERE id = $2 RETURNING id, institution_name, credential_id`,
        [credential_id, institution_id]
    );
    return resultado.rows[0];
}

export async function eliminar(id, role_id) {
    const resultado = await pool.query(
        `DELETE FROM credentials WHERE id = $1 AND role_id = $2 RETURNING *`,
        [id, role_id]
    );
    return resultado.rows[0];
}