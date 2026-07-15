import * as AuthModel from '../models/authModel.js'
import jwt from 'jsonwebtoken'

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

        // Si la autenticación es correcta, devolver el nombre de usuario y el rol junto al jwt
        const payload= { username: usuario.username, role: usuario.rol } 
        const accessToken= jwt.sign(
            payload, 
            process.env.JWT_SECRET, //Claves almacenadas en variables de entorno (.env)
            { expiresIn: process.env.JWT_EXPIRES_IN })
            
        const refreshToken= jwt.sign( //Maneja mas de una sesión sin pedir loguearse nuevamente
            payload, 
            process.env.JWT_REFRESH_SECRET, 
            { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN })

        res
        .cookie("accessToken", accessToken, {
            httpOnly: true, //Acceso exclusivo desde el backend, y el sameSite para delimitarlo al dominio
            secure: process.env.NODE_ENV=== "production", //Limita el acceso a solo https
            sameSite: "strict",
            maxAge: 60 * 60 * 1000
        })
        .json({ accessToken, refreshToken });
    } catch (error) {
        // Manejar cualquier error que ocurra durante el proceso de login
        console.error(error);
        res.status(500).json({ error: 'Error al procesar el login' });
    }
    return res
}
export function refresh(req, res){
    const {refreshToken}= req.body
    if(!refreshToken){ 
        return res.status(401).json({error: 'Usuario sin token'})
    }
    try {
        const data= jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET)
        const newToken= jwt.sign(
            {username: data.username, role: data.role},
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN }
        )
        res
            .cookie('accessToken', newToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 60 * 60 * 1000
            })
            .json({ accessToken: newToken })
    }
    catch (error){
        console.error('Refresh token inválido ->', error.message)
        return res.status(401).json({ error: 'Refresh token inválido' })
    }
    
}