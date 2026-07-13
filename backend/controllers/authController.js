import * as AuthModel from '../models/authModel.js';

// Controlador para manejar el login de usuarios
export async function login(req, res) {
    // Extraer el nombre de usuario y la contraseña del cuerpo de la solicitud
    const { username, password } = req.body;

    // Validar que se proporcionen tanto el nombre de usuario como la contraseña
    if (!username || !password) {
        return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
    }

    // Intentar buscar al usuario en la base de datos y verificar la contraseña
    try {
        // Buscar al usuario por nombre de usuario
        const usuario = await AuthModel.buscarPorUsername(username);

        // Si el usuario no existe o la contraseña no coincide, devolver un error de autenticación
        if (!usuario || usuario.password !== password) {
            return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
        }

        // Si la autenticación es exitosa, devolver el nombre de usuario y el rol del usuario
        res.json({ username: usuario.username, rol: usuario.rol });
    } catch (error) {
        // Manejar cualquier error que ocurra durante el proceso de login
        console.error(error);
        res.status(500).json({ error: 'Error al procesar el login' });
    }
}