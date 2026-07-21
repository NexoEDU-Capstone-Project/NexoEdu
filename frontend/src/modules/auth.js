import * as AuthService from '../services/authService.js';
import http, { ApiError } from './http.js';

// Nota sobre el modelo de sesión:
// - El accessToken real que autentica cada petición viaja en una cookie
//   httpOnly ("accessToken"), puesta por el backend en /auth/login. El
//   navegador la reenvía solo (gracias a credentials: 'include' en http.js);
//   JS nunca la lee ni la toca directamente.
// - El refreshToken SÍ hay que guardarlo nosotros (el backend lo devuelve
//   en el body, no como cookie), para poder pedir un accessToken nuevo
//   cuando el actual expire, sin forzar un login manual.
// - "user" (username, rol, institution_id) se guarda para uso inmediato de
//   la UI (mostrar nombre, decidir qué menú renderizar) sin tener que
//   decodificar el JWT en el cliente.

const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_KEY = 'user';

const listeners = [];

const Auth = {
    getUser() {
        const raw = localStorage.getItem(USER_KEY);
        return raw ? JSON.parse(raw) : null;
    },

    isAuthenticated() {
        return this.getUser() !== null;
    },

    hasRole(...roles) {
        const user = this.getUser();
        return user ? roles.includes(user.rol) : false;
    },

    async login(username, password) {
        const data = await AuthService.login(username, password);
        localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        this._notify();
        return data.user;
    },

    async logout() {
        try {
            await AuthService.logout();
        } catch (error) {
            // Si el backend no responde, igual limpiamos la sesión local:
            // el usuario quiere salir, no tiene sentido dejarlo atrapado.
            console.error('Error al cerrar sesión en el servidor:', error);
        }
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        this._notify();
    },

    // Intenta renovar el accessToken usando el refreshToken guardado.
    // Devuelve true si lo logró, false si el refresh también falló
    // (en cuyo caso hay que forzar login de nuevo).
    async tryRefresh() {
        const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
        if (!refreshToken) return false;

        try {
            await AuthService.refresh(refreshToken);
            return true;
        } catch (error) {
            localStorage.removeItem(REFRESH_TOKEN_KEY);
            localStorage.removeItem(USER_KEY);
            this._notify();
            return false;
        }
    },

    onChange(callback) {
        listeners.push(callback);
    },

    _notify() {
        listeners.forEach((cb) => cb());
    }
};

export default Auth;
export { ApiError };
