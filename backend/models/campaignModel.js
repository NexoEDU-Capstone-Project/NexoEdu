import pool from '../db.js';

export async function crear({ title, type, description, sponsor, start_date, end_date, url_multimedia, created_by_credentials_id }) {
    const resultado = await pool.query(
        `INSERT INTO campaigns (title, type, description, sponsor, start_date, end_date, url_multimedia, created_by_credentials_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [title, type, description, sponsor, start_date, end_date, url_multimedia, created_by_credentials_id]
    );
    return resultado.rows[0];
}

export async function crearScope({ campaign_id, scope_type, institution_id, neighborhood_id, localities_id }) {
    const resultado = await pool.query(
        `INSERT INTO campaign_scope (campaign_id, scope_type, institution_id, neighborhood_id, localities_id)
        VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [campaign_id, scope_type, institution_id ?? null, neighborhood_id ?? null, localities_id ?? null]
    );
    return resultado.rows[0];
}

export async function obtenerTodas() {
    const resultado = await pool.query(
        `SELECT c.*, s.scope_type, s.institution_id, s.neighborhood_id, s.localities_id
        FROM campaigns c
        LEFT JOIN campaign_scope s 
        ON s.campaign_id = c.id
        ORDER BY c.start_date DESC`
    );
    return resultado.rows;
}

export async function obtenerPorId(id) {
    const resultado = await pool.query(
        `SELECT c.*, s.scope_type, s.institution_id, s.neighborhood_id, s.localities_id
        FROM campaigns c
        LEFT JOIN campaign_scope s 
        ON s.campaign_id = c.id
        WHERE c.id = $1`,
        [id]
    );
    return resultado.rows[0];
}