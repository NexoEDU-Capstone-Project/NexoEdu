export default function requireRole(...allowedRoles){
    return (req, res, next) => {
        const user= req.user
        const userRole= user?.rol
        if(!user){ 
            return res.status(401).json({error: 'Usuario no autenticado'})
        }

        if(!allowedRoles.includes(userRole)){
            return res.status(403).json({error: 'Usuario no autorizado'})
        }
        next()
    }
}