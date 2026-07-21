// Llamadas a la API de catálogos de solo lectura (géneros, grados, estados,
// tipos de documento, localidades, barrios) usados para poblar formularios.
import http from '../modules/http.js';

export function generos() {
    return http.get('catalogs/genders');
}

export function grados() {
    return http.get('catalogs/grades');
}

export function estados() {
    return http.get('catalogs/statuses');
}

export function tiposDocumento() {
    return http.get('catalogs/document-types');
}

export function localidades() {
    return http.get('catalogs/localities');
}

export function barrios(localityId = null) {
    const query = localityId ? `?locality_id=${localityId}` : '';
    return http.get(`catalogs/neighborhoods${query}`);
}
