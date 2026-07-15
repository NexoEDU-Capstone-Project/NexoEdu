export default function protectedRoute(route) {
    return (req, res) => {
        if (!req.user) {
            return res.status(401).json({ message: "Acceso denegado" })
        }
        res.json({ok: true, route, user: req.user})
    }
}