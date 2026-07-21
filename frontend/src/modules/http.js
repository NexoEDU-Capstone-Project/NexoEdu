import { API_URL } from './config.js';

// Error personalizado para que las vistas puedan distinguir "el backend
// respondió con un error controlado" (ej. 401, 403, 409, con su mensaje)
// de un error de red/inesperado.
export class ApiError extends Error {
    constructor(message, status) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
    }
}

const http = {
    // _retry (interno): evita bucles al reintentar tras renovar el token.
    async request(method, endpoint, body = null, _retry = false) {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json'
            },
            // CRÍTICO: sin esto, la cookie httpOnly "accessToken" que pone
            // el backend en /auth/login nunca se reenvía en las peticiones
            // siguientes, y todo endpoint protegido devolvería 401.
            credentials: 'include'
        };

        if (body) {
            options.body = JSON.stringify(body);
        }

        let response;
        try {
            response = await fetch(`${API_URL}/${endpoint}`, options);
        } catch (networkError) {
            if (import.meta.env.DEV) {
                console.log(`%c✗ RED%c ${method} /${endpoint}`, 'color:#dc2626;font-weight:bold', 'color:#64748b', networkError);
            }
            throw new ApiError('No se pudo conectar con el servidor. Verifica tu conexión.', 0);
        }

        // Sesión expirada: intenta renovar el accessToken con el refreshToken
        // UNA sola vez y reintenta la petición original. Se excluyen los
        // endpoints de auth para no entrar en bucle. Import dinámico de Auth
        // para evitar la dependencia circular con auth.js.
        if (response.status === 401 && !_retry && !endpoint.startsWith('auth/')) {
            const { default: Auth } = await import('./auth.js');
            const renovado = await Auth.tryRefresh();
            if (renovado) {
                return this.request(method, endpoint, body, true);
            }
        }

        // Respuestas sin cuerpo (ej. 204 No Content, o DELETE exitoso sin body)
        const contentType = response.headers.get('content-type') || '';
        const data = contentType.includes('application/json') ? await response.json() : null;

        // Log de la petición en la consola del navegador (solo en desarrollo):
        // permite ver de un vistazo si el CRUD salió bien y qué respuesta llegó.
        if (import.meta.env.DEV) {
            const ok = response.ok;
            console.log(
                `%c${ok ? '✓' : '✗'} ${response.status}%c ${method} /${endpoint}`,
                `color:${ok ? '#16a34a' : '#dc2626'};font-weight:bold`,
                'color:#64748b',
                data ?? ''
            );
        }

        if (!response.ok) {
            const mensaje = data?.error || data?.message || `Error ${response.status}`;
            throw new ApiError(mensaje, response.status);
        }

        return data;
    },

    get(endpoint) {
        return this.request('GET', endpoint);
    },
    post(endpoint, data) {
        return this.request('POST', endpoint, data);
    },
    // put recibe el endpoint YA armado con su id incluido, ej:
    // http.put(`students/${id}/personal`, body)
    // Esto es más explícito que reconstruir la URL dentro del helper.
    put(endpoint, data) {
        return this.request('PUT', endpoint, data);
    },
    delete(endpoint) {
        return this.request('DELETE', endpoint);
    }
};

export default http;
