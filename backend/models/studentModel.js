import pool from '../db.js';

// Resuelve la institución asignada al admin logueado
export async function obtenerInstitucionPorUsername(username) {
    const resultado = await pool.query(
        `SELECT i.id, i.institution_name
        FROM institutions i
        JOIN credentials c ON c.id = i.credential_id
        WHERE c.username = $1`,
        [username]
    );
    return resultado.rows[0];
}

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

export async function obtenerPorId(id, institution_id) {
    const resultado = await pool.query(
        `SELECT sp.*, p.first_name, p.last_name, p.email
        FROM student_profiles sp
        JOIN people p ON p.id = sp.people_id
        WHERE sp.id = $1 AND sp.institution_id = $2`,
        [id, institution_id] //Solo arroja al estudiante si la id de su institucion coincide con la del admin
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

// people_id e institution_id no se tocan ya que el admin no debería
// cambiar esos datos, simplemente eliminar al estudiante si cambia de colegio
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

export async function eliminar(id, institution_id) {
    const resultado = await pool.query(
        `DELETE FROM student_profiles
        WHERE id = $1 AND institution_id = $2
        RETURNING *`,
        [id, institution_id]
    );
    return resultado.rows[0];
}