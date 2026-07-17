import pool from '../db.js';

export async function obtenerPorInstitucion(institution_id) {
    const resultado = await pool.query(
        `SELECT sp.*, p.first_name, p.last_name, p.email,
        g.grade, s.status
        FROM student_profiles sp
        JOIN people p ON p.id = sp.people_id
        JOIN grades g ON g.id = sp.grade_id
        JOIN statuses s ON s.id = sp.status_id
        WHERE sp.institution_id = $1
        ORDER BY p.last_name, p.first_name`,
        [institution_id]
    );
    return resultado.rows;
}

export async function obtenerTodas() {
    const resultado = await pool.query(
        `SELECT sp.*, p.first_name, p.last_name, p.email,
        g.grade, s.status
        FROM student_profiles sp
        JOIN people p ON p.id = sp.people_id
        JOIN grades g ON g.id = sp.grade_id
        JOIN statuses s ON s.id = sp.status_id
        ORDER BY p.last_name, p.first_name`
    );
    return resultado.rows;
}

export async function obtenerPorId(id, institution_id) {
    const resultado = await pool.query(
        `SELECT sp.*, p.first_name, p.last_name, p.email
        FROM student_profiles sp
        JOIN people p ON p.id = sp.people_id
        WHERE sp.id = $1 AND sp.institution_id = $2`,
        [id, institution_id]
    );
    return resultado.rows[0];
}

export async function obtenerPorIdTodas(id) {
    const resultado = await pool.query(
        `SELECT sp.*, p.first_name, p.last_name, p.email
        FROM student_profiles sp
        JOIN people p ON p.id = sp.people_id
        WHERE sp.id = $1`,
        [id]
    );
    return resultado.rows[0];
}

export async function crear({ people_id, institution_id, status_id, grade_id, start_date, end_date }) {
    const resultado = await pool.query(
        `INSERT INTO student_profiles (people_id, institution_id, status_id, grade_id, start_date, end_date)
        VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [people_id, institution_id, status_id, grade_id, start_date, end_date ?? null]
    );
    return resultado.rows[0];
}

export async function actualizar(id, institution_id, { status_id, grade_id, start_date, end_date }) {
    const resultado = await pool.query(
        `UPDATE student_profiles
        SET status_id = $1, grade_id = $2, start_date = $3, end_date = $4
        WHERE id = $5 AND institution_id = $6
        RETURNING *`,
        [status_id, grade_id, start_date, end_date ?? null, id, institution_id]
    );
    return resultado.rows[0];
}

export async function actualizarTodas(id, { status_id, grade_id, start_date, end_date }) {
    const resultado = await pool.query(
        `UPDATE student_profiles
        SET status_id = $1, grade_id = $2, start_date = $3, end_date = $4
        WHERE id = $5
        RETURNING *`,
        [status_id, grade_id, start_date, end_date ?? null, id]
    );
    return resultado.rows[0];
}

export async function eliminar(id, institution_id) {
    const resultado = await pool.query(
        `DELETE FROM student_profiles
        WHERE id = $1 AND institution_id = $2
        RETURNING *`,
        [id, institution_id]
    );
    return resultado.rows[0];
}

export async function eliminarTodas(id) {
    const resultado = await pool.query(
        `DELETE FROM student_profiles
        WHERE id = $1
        RETURNING *`,
        [id]
    );
    return resultado.rows[0];
}
