// Opciones de la cookie httpOnly que transporta el accessToken.
//
// En producción, el frontend (Vercel) y el backend (Render) viven en dominios
// distintos, así que la cookie es "cross-site": para que el navegador la envíe
// hay que usar sameSite:'none' + secure:true (requiere HTTPS, que ambos hosts
// proveen). En desarrollo (localhost) usamos 'lax', que funciona igual y no
// exige HTTPS.
const isProd = process.env.NODE_ENV === 'production';

export const cookieOptions = {
    httpOnly: true,
    secure: isProd,                       // solo por HTTPS en producción
    sameSite: isProd ? 'none' : 'lax',    // 'none' permite la cookie entre dominios
    maxAge: 60 * 60 * 1000                // 1 hora (igual que el accessToken)
};
