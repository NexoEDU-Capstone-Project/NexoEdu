// Llamadas a la API para la gestión de instituciones (CRUD).
import http from '../modules/http.js';

export function listar() {
    return http.get('institutions');
}

export function obtener(id) {
    return http.get(`institutions/${id}`);
}

export function crear(data) {
    return http.post('institutions', data);
}

export function actualizar(id, data) {
    return http.put(`institutions/${id}`, data);
}

export function eliminar(id) {
    return http.delete(`institutions/${id}`);
}
