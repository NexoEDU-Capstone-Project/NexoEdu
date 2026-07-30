// Opciones de la cookie httpOnly que transporta el accessToken.
//
// La cookie es "same-site" en ambos entornos, así que basta sameSite:'lax':
//   - En producción, el frontend (Vercel) llama a la API por una ruta relativa
//     (/api) y Vercel la reenvía al backend en Render mediante un rewrite. El
//     navegador solo ve el dominio de Vercel, por lo que la cookie es
//     first-party. Antes se usaba 'none' porque se llamaba directo a Render
//     (cross-site), pero Safari/iOS bloquea las cookies de terceros y la
//     sesión no se mantenía.
//   - En desarrollo, front y back son localhost (mismo sitio).
// 'lax' es además más seguro que 'none': el navegador no envía la cookie en
// peticiones originadas por otros sitios, lo que mitiga CSRF.
const isProd = process.env.NODE_ENV === 'production';

export const cookieOptions = {
    httpOnly: true,
    secure: isProd,           // solo por HTTPS en producción
    sameSite: 'lax',          // no se envía en peticiones de otros sitios (mitiga CSRF)
    maxAge: 60 * 60 * 1000    // 1 hora (igual que el accessToken)
};
