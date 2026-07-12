// Endpoint para el login de usuarios

import express from 'express';
import pool from '../app/db.js';

const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    // Validar que se proporcionen el nombre de usuario y la contraseña
    if (!username || !password) {
        return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
    }

    // Consultar la base de datos para verificar las credenciales del usuario
    try {
        const resultado = await pool.query(
            'SELECT * FROM view_credential_info WHERE username = $1',
            [username]
        );

        // Si no se encuentra el usuario o la contraseña es incorrecta, devolver un error
        if (resultado.rows.length === 0) {
            return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
        }

        const usuario = resultado.rows[0];

        // Si la contraseña no coincide, devolver un error
        if (usuario.password !== password) {
            return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
        }

        // Si las credenciales son correctas, devolver la información del usuario
        res.json({
            username: usuario.username,
            rol: usuario.rol,
        });
    
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al procesar el login' });
    }
});

// exportar el router para que pueda ser utilizado en index.js
export default router;