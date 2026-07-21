// Llamadas a la API de campañas: CRUD, métricas, estudiantes que actualizaron,
// y el flujo del estudiante (sus campañas elegibles y actualización de datos).
import http from '../modules/http.js';

export function listar() {
    return http.get('campaigns');
}

export function obtener(id) {
    return http.get(`campaigns/${id}`);
}

export function crear(data) {
    return http.post('campaigns', data);
}

export function actualizar(id, data) {
    return http.put(`campaigns/${id}`, data);
}

export function eliminar(id) {
    return http.delete(`campaigns/${id}`);
}

export function misCampanias() {
    return http.get('campaigns/mine');
}

export function actualizarMisDatosEnCampania(campaignId, data) {
    return http.put(`campaigns/${campaignId}/update-my-data`, data);
}

export function metricas(campaignId) {
    return http.get(`campaigns/${campaignId}/metrics`);
}

// Estudiantes que ya actualizaron sus datos dentro de la campaña.
export function estudiantesActualizados(campaignId) {
    return http.get(`campaigns/${campaignId}/updates`);
}
