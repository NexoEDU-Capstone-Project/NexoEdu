// Config centralizada del frontend. En desarrollo, Vite expone las
// variables de entorno con prefijo VITE_ a través de import.meta.env.
// Si no se define VITE_API_URL (ej. no existe un .env todavía),
// asumimos el backend corriendo localmente en el puerto por defecto.
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Ruta del dashboard según el rol del usuario logueado. Centralizado aquí
// porque tanto Login.js (redirección tras iniciar sesión) como router.js
// (redirección al visitar /login ya autenticado) necesitan este mapeo,
// y debe mantenerse en un solo lugar para no desincronizarse.
export const DASHBOARD_POR_ROL = {
    superadmin: '/dashboard-superadmin',
    administrador: '/dashboard-escuela',
    estudiante: '/mis-campanias'
};
