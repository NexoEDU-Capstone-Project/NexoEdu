import pool from '../db.js';

export async function obtenerPorInstitucion(institution_id, { search = '', limit = 10, offset = 0 } = {}) {
    const resultado = await pool.query(
        `SELECT sp.*, p.first_name, p.last_name, p.email, p.document_number,
        g.grade, s.status,
        COUNT(*) OVER() AS total_count
        FROM student_profiles sp
        JOIN people p ON p.id = sp.people_id
        JOIN grades g ON g.id = sp.grade_id
        JOIN statuses s ON s.id = sp.status_id
        WHERE sp.institution_id = $1
        AND ($2 = '' OR p.first_name ILIKE '%' || $2 || '%'
        OR p.last_name ILIKE '%' || $2 || '%'
        OR p.document_number ILIKE '%' || $2 || '%')
        ORDER BY p.last_name, p.first_name
        LIMIT $3 OFFSET $4`,
        [institution_id, search, limit, offset]
    );
    const total = resultado.rows[0]?.total_count ? Number(resultado.rows[0].total_count) : 0;
    const estudiantes = resultado.rows.map(({ total_count, ...resto }) => resto);
    return { estudiantes, total };
}

export async function obtenerTodas({ search = '', limit = 10, offset = 0 } = {}) {
    const resultado = await pool.query(
        `SELECT sp.*, p.first_name, p.last_name, p.email, p.document_number,
        g.grade, s.status,
        COUNT(*) OVER() AS total_count
        FROM student_profiles sp
        JOIN people p ON p.id = sp.people_id
        JOIN grades g ON g.id = sp.grade_id
        JOIN statuses s ON s.id = sp.status_id
        WHERE ($1 = '' OR p.first_name ILIKE '%' || $1 || '%'
        OR p.last_name ILIKE '%' || $1 || '%'
        OR p.document_number ILIKE '%' || $1 || '%')
        ORDER BY p.last_name, p.first_name
        LIMIT $2 OFFSET $3`,
        [search, limit, offset]
    );
    const total = resultado.rows[0]?.total_count ? Number(resultado.rows[0].total_count) : 0;
    const estudiantes = resultado.rows.map(({ total_count, ...resto }) => resto);
    return { estudiantes, total };
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
