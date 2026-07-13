import * as AuthModel from '../models/authModel.js';

export async function login(req, res) {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
    }

    try {
        const usuario = await AuthModel.buscarPorUsername(username);

        if (!usuario || usuario.password !== password) {
            return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
        }

        res.json({ username: usuario.username, rol: usuario.rol });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al procesar el login' });
    }
}