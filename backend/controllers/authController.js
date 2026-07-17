import * as AuthModel from '../models/authModel.js';
import jwt from 'jsonwebtoken';
import { cookieOptions } from '../config/cookieOptions.js';

// Controlador para manejar el login de usuarios
export async function login(req, res) {
    const { username, password } = req.body; // Extraer el nombre de usuario y la contraseña del cuerpo de la solicitud

    if (!username || !password) { // Validar que se proporcionen tanto el nombre de usuario como la contraseña
        return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
    }

    try {  // Intentar buscar al usuario en la base de datos y verificar la contraseña
        const usuario = await AuthModel.buscarPorUsername(username); // Buscar al usuario por nombre de usuario

        if (!usuario || usuario.password !== password) { // Si el usuario no existe o la contraseña no coincide, devolver un error de autenticación
            return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
        }

        // authController.js, en login()
        const payload = {
            id: usuario.id,
            username: usuario.username,
            rol: usuario.rol,
            institution_id: usuario.institution_id
        };

        const accessToken = jwt.sign( // Generar un token de acceso JWT con el payload, la clave secreta y el tiempo de expiración
            payload,
            process.env.JWT_SECRET, //Claves almacenadas en variables de entorno (.env)
            { expiresIn: process.env.JWT_EXPIRES_IN })

        const refreshToken = jwt.sign( //Maneja mas de una sesión sin pedir loguearse nuevamente
            payload,
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN })

        return res
            .cookie("accessToken", accessToken, cookieOptions)
            .json({
                message: "Login exitoso",
                accessToken,
                refreshToken,
                user: {
                    username: usuario.username,
                    rol: usuario.rol
                }
            })
    } catch (error) {
        // Manejar cualquier error que ocurra durante el proceso de login
        console.error(error);
        return res.status(500).json({ error: 'Error al procesar el login' });
    }

}

// Controlador para manejar la renovación del token de acceso usando el refresh token
export function refresh(req, res) {
    const { refreshToken } = req.body
    if (!refreshToken) {
        return res.status(401).json({ error: 'Usuario sin token' })
    }
    try {
        const data = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET)
        const newToken = jwt.sign(
            { username: data.username, rol: data.rol },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        )
        return res
            .cookie('accessToken', newToken, cookieOptions)
            .json({ accessToken: newToken })
    }
    catch (error) {
        console.error('Refresh token inválido ->', error.message)
        return res.status(401).json({ error: 'Refresh token inválido' })
    }

}
// Controlador para manejar el cierre de sesión de usuarios
export function logout(req, res) {
    res
        .clearCookie('accessToken', cookieOptions)
        .json({ message: 'Sesión cerrada correctamente.' });
}