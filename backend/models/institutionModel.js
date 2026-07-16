import pool from '../db.js';

export async function obtenerTodas() {
    const resultado = await pool.query('SELECT * FROM institutions ORDER BY institution_name');
    return resultado.rows;
}

export async function obtenerPorId(id) {
    const resultado = await pool.query('SELECT * FROM institutions WHERE id = $1', [id]);
    return resultado.rows[0];
}

export async function crear({ institution_name, director, address, neighborhood_id, dane_code }) {
    const resultado = await pool.query(
        `INSERT INTO institutions (institution_name, director, address, neighborhood_id, dane_code)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [institution_name, director, address, neighborhood_id, dane_code]
    );
    return resultado.rows[0];
}

export async function actualizar(id, { institution_name, director, address, neighborhood_id, dane_code }) {
    const resultado = await pool.query(
        `UPDATE institutions
        SET institution_name = $1, director = $2, address = $3, neighborhood_id = $4, dane_code = $5
        WHERE id = $6 RETURNING *`,
        [institution_name, director, address, neighborhood_id, dane_code, id]
    );
    return resultado.rows[0];
}

export async function eliminar(id) {
    const resultado = await pool.query('DELETE FROM institutions WHERE id = $1 RETURNING *', [id]);
    return resultado.rows[0];
}