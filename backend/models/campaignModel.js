import pool from '../db.js';

export async function crearConScope({ title, type, description, sponsor, start_date, end_date, url_multimedia, created_by_credentials_id, scope_type, institution_id, neighborhood_id, localities_id }) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const campaignResult = await client.query(
            `INSERT INTO campaigns (title, type, description, sponsor, start_date, end_date, url_multimedia, created_by_credentials_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            [title, type, description, sponsor, start_date, end_date, url_multimedia, created_by_credentials_id]
        );
        const campaign = campaignResult.rows[0];

        const scopeResult = await client.query(
            `INSERT INTO campaign_scope (campaign_id, scope_type, institution_id, neighborhood_id, localities_id)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [campaign.id, scope_type, institution_id ?? null, neighborhood_id ?? null, localities_id ?? null]
        );

        await client.query('COMMIT');
        return { ...campaign, scope: scopeResult.rows[0] };
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
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

export async function crearCriteria({ campaign_id, gender_id, min_age, max_age, grade_id, status_id }) {
    const resultado = await pool.query(
        `INSERT INTO campaign_criteria (campaign_id, gender_id, min_age, max_age, grade_id, status_id)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [campaign_id, gender_id ?? null, min_age ?? null, max_age ?? null, grade_id ?? null, status_id ?? null]
    );
    return resultado.rows[0];
}

export async function obtenerCriteria(campaign_id) {
    const resultado = await pool.query(
        'SELECT * FROM campaign_criteria WHERE campaign_id = $1',
        [campaign_id]
    );
    return resultado.rows[0];
}

export async function obtenerElegibles(people_id) {
    const resultado = await pool.query(
        `SELECT c.*, sc.scope_type,
        EXISTS (
            SELECT 1 FROM campaign_enrollments ce
            JOIN student_profiles sp2 ON sp2.id = ce.student_profile_id
            WHERE ce.campaign_id = c.id AND sp2.people_id = p.id
        ) AS ya_inscrito
        FROM people p
        JOIN student_profiles sp ON sp.people_id = p.id
        LEFT JOIN neighborhoods n ON n.id = p.neighborhood_id
        JOIN campaigns c ON c.start_date <= CURRENT_DATE
        AND (c.end_date IS NULL OR c.end_date >= CURRENT_DATE)
        JOIN campaign_scope sc ON sc.campaign_id = c.id
        AND (
        (sc.scope_type = 'INSTITUTION' AND sc.institution_id = sp.institution_id) OR
        (sc.scope_type = 'NEIGHBORHOOD' AND sc.neighborhood_id = p.neighborhood_id) OR
        (sc.scope_type = 'LOCALITY' AND sc.localities_id = n.locality_id)
        )
        LEFT JOIN campaign_criteria cc ON cc.campaign_id = c.id
        WHERE p.id = $1
        AND (cc.gender_id IS NULL OR cc.gender_id = p.gender_id)
        AND (cc.min_age IS NULL OR EXTRACT(YEAR FROM AGE(CURRENT_DATE, p.birth_date)) >= cc.min_age)
        AND (cc.max_age IS NULL OR EXTRACT(YEAR FROM AGE(CURRENT_DATE, p.birth_date)) <= cc.max_age)
        AND (cc.grade_id IS NULL OR cc.grade_id = sp.grade_id)
        AND (cc.status_id IS NULL OR cc.status_id = sp.status_id)
        ORDER BY c.end_date ASC NULLS LAST`,
        [people_id]
    );
    return resultado.rows;
}

export async function crearEnrollment({ campaign_id, student_profile_id }) {
    const resultado = await pool.query(
        `INSERT INTO campaign_enrollments (campaign_id, student_profile_id, enrolled_at)
         VALUES ($1, $2, NOW()) RETURNING *`,
        [campaign_id, student_profile_id]
    );
    return resultado.rows[0];
}