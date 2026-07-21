// Llamadas a la API para la gestión de administradores institucionales
// (crear, listar, asignar institución, eliminar). Solo el superadmin las usa.
import http from '../modules/http.js';

export function listar() {
    return http.get('admins');
}

export function crear(data) {
    return http.post('admins', data);
}

export function asignarInstitucion(id, institution_id) {
    return http.put(`admins/${id}/assign`, { institution_id });
}

export function eliminar(id) {
    return http.delete(`admins/${id}`);
}
