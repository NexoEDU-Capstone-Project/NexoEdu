// Llamadas a la API de autenticación: login, logout y renovación del token.
import http from '../modules/http.js';

export function login(username, password) {
    return http.post('auth/login', { username, password });
}

export function logout() {
    return http.post('auth/logout');
}

export function refresh(refreshToken) {
    return http.post('auth/refresh', { refreshToken });
}