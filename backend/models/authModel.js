import pool from '../db.js';

export async function buscarPorUsername(username) {
    const resultado = await pool.query(
        `SELECT c.id,
        c.username, 
        c.password, 
        ur.name AS rol, 
        i.id AS institution_id
        FROM credentials c
        JOIN user_roles ur 
        ON ur.id = c.role_id
        LEFT JOIN institutions i 
        ON i.credential_id = c.id
        WHERE c.username = $1`,
        [username]
    );
    return resultado.rows[0];
}