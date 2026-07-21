// Llamadas a la API de estudiantes/egresados: CRUD, datos propios del
// estudiante, perfil académico y gestión de credenciales de acceso.
import http from '../modules/http.js';

export function listar(filtros = {}) {
    const params = new URLSearchParams(filtros).toString();
    return http.get(`students${params ? `?${params}` : ''}`);
}

export function obtener(id) {
    return http.get(`students/${id}`);
}

export function obtenerMisDatos() {
    return http.get('students/me');
}

export function crear(data) {
    return http.post('students', data);
}

export function actualizarDatosPersonales(id, data) {
    return http.put(`students/${id}/personal`, data);
}

export function actualizarPerfilAcademico(id, data) {
    return http.put(`students/${id}/academico`, data);
}

export function eliminar(id) {
    return http.delete(`students/${id}`);
}

// Credenciales de acceso del estudiante (la contraseña nunca se devuelve).
export function obtenerCredenciales(id) {
    return http.get(`students/${id}/credentials`);
}

export function gestionarCredenciales(id, data) {
    return http.put(`students/${id}/credentials`, data);
}
