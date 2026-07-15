import jwt from 'jsonwebtoken'

export default function authToken(req, res, next){
    const token= req.cookies?.accessToken //Extrae la cookie creada al iniciar sesión satisfactoriamente

    if(!token){
        return res.status(401).json({message: "Usuario sin token"})
    }

    try {
        const data= jwt.verify(token, process.env.JWT_SECRET) //Verifica el token actual y lo compara con la secret key
        req.user= data
        next() //Envía a la ruta o middleware procedente
    }
    catch (error){
        console.error('JWT inválido ->', error.message)
        return res.status(401).json({ error: 'Token inválido' })
    }
}