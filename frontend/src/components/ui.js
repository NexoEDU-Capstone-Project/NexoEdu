// Helpers de UI compartidos entre vistas, para mantener consistencia visual
// y evitar repetir markup. Todos devuelven strings HTML o valores simples.
import { icon } from './icons.js';

// Formatea una fecha ISO a "12 oct 2023". Devuelve '—' si no hay fecha.
export function formatearFecha(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}

// Iniciales a partir de nombre y apellido (o de un string).
export function iniciales(nombre = '', apellido = '') {
    const a = (nombre || '').trim().charAt(0);
    const b = (apellido || '').trim().charAt(0);
    return (a + b).toUpperCase() || '?';
}

// Colores rotatorios (marca) para avatares, según un id/índice.
const AVATAR_COLORES = ['bg-navy-600', 'bg-green-500', 'bg-yellow-500 text-navy-700'];
export function avatar(texto, id = 0, extra = 'h-9 w-9 text-xs') {
    const color = AVATAR_COLORES[Math.abs(Number(id) || 0) % AVATAR_COLORES.length];
    return `<span class="inline-flex ${extra} shrink-0 items-center justify-center rounded-full font-bold text-white ${color}">${texto}</span>`;
}

// Estado de una campaña según fechas -> { texto, badge }.
export function estadoCampania(startISO, endISO) {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const inicio = startISO ? new Date(startISO) : null;
    const fin = endISO ? new Date(endISO) : null;

    if (inicio && inicio > hoy) return { texto: 'Programada', badge: 'badge-yellow' };
    if (fin && fin < hoy) return { texto: 'Finalizada', badge: 'badge-navy' };
    return { texto: 'En curso', badge: 'badge-green' };
}

// Tarjeta de estadística (número grande + etiqueta + ícono tenue + nota).
export function statCard({ label, valor, iconName, nota = '', notaColor = 'text-green-600' }) {
    return `
        <div class="card relative overflow-hidden">
            <span class="absolute right-4 top-4 text-navy-100">${icon(iconName, 'w-12 h-12')}</span>
            <p class="text-sm font-medium text-ink-soft">${label}</p>
            <p class="mt-1 font-display text-4xl font-bold text-navy-600">${valor}</p>
            ${nota ? `<p class="mt-2 flex items-center gap-1 text-sm font-medium ${notaColor}">${nota}</p>` : ''}
        </div>`;
}

// Abrevia el prefijo largo y repetitivo de los nombres de institución:
// "Institución Educativa Distrital X" -> "I.E.D. X".
export function abreviarInstitucion(nombre = '') {
    return (nombre || '').replace(/^\s*instituci[oó]n\s+educativa\s+distrital\s+/i, 'I.E.D. ');
}

// Tarjeta de campaña enriquecida: imagen (url_multimedia con fallback),
// badge de estado, patrocinador, tipo, descripción y fechas.
// opciones:
//   - acciones: HTML de botones para el pie de la card.
//   - extra: HTML adicional dentro de la card (ej. contenedor de métricas).
//   - dataId: valor para data-id en la raíz (para toggles/handlers).
export function campaignCard(c, { acciones = '', extra = '', dataId = '' } = {}) {
    const est = estadoCampania(c.start_date, c.end_date);
    const fallback = `<div class="flex h-full w-full items-center justify-center bg-navy-600 text-white/30">${icon('megaphone', 'w-10 h-10')}</div>`;
    const media = c.url_multimedia
        ? `<img src="${c.url_multimedia}" alt="${c.title}" class="h-full w-full object-cover"
                onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
           <div style="display:none" class="h-full w-full items-center justify-center bg-navy-600 text-white/30">${icon('megaphone', 'w-10 h-10')}</div>`
        : fallback;

    // Chip de origen: distingue campañas distritales (superadmin/Alcaldía) de
    // las institucionales. Solo aparece si el backend envía creador_rol.
    const creadorChip = c.creador_rol
        ? (c.creador_rol === 'superadmin'
            ? `<span class="badge badge-yellow">${icon('school', 'w-3.5 h-3.5')} Distrital · Alcaldía</span>`
            : `<span class="badge badge-green min-w-0 max-w-56" title="${c.creador_institucion || 'Institucional'}">${icon('gradCap', 'w-3.5 h-3.5 shrink-0')} <span class="truncate">${abreviarInstitucion(c.creador_institucion) || 'Institucional'}</span></span>`)
        : '';

    return `
        <div class="card flex flex-col overflow-hidden p-0 transition-shadow hover:shadow-(--shadow-pop)" ${dataId !== '' ? `data-id="${dataId}"` : ''}>
            <div class="relative h-32 overflow-hidden bg-navy-600">
                ${media}
                <span class="badge ${est.badge} absolute right-3 top-3 shadow-sm">${est.texto}</span>
                ${c.sponsor ? `<span class="absolute bottom-3 left-3 rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-semibold text-navy-700 shadow-sm">${c.sponsor}</span>` : ''}
            </div>
            <div class="flex flex-1 flex-col p-5">
                <h3 class="font-display text-lg font-semibold leading-snug text-navy-600 line-clamp-1">${c.title}</h3>
                ${(c.type || creadorChip) ? `<div class="mt-2 flex flex-wrap items-center gap-1.5">
                    ${c.type ? `<span class="badge badge-navy">${icon('book', 'w-3.5 h-3.5')} ${c.type}</span>` : ''}
                    ${creadorChip}
                </div>` : ''}
                <p class="mt-2 text-sm text-ink-soft line-clamp-2">${c.description ?? 'Campaña de actualización de datos.'}</p>
                <p class="mt-3 flex items-center gap-1.5 text-xs text-ink-muted">${icon('calendar', 'w-4 h-4')} ${formatearFecha(c.start_date)} — ${c.end_date ? formatearFecha(c.end_date) : 'sin fecha límite'}</p>
                ${acciones ? `<div class="mt-4 flex items-center gap-2 border-t border-navy-50 pt-3">${acciones}</div>` : ''}
                ${extra}
            </div>
        </div>`;
}

// Semáforo de actualización de datos según la última fecha de actualización.
// Verde = al día (≤ 90 días), amarillo = por vencer (91–180), rojo = sin
// actualizar o desactualizado (> 180 días o nunca). Umbrales ajustables.
export function semaforoActualizacion(iso) {
    if (!iso) {
        return { clase: 'badge-red', dot: 'bg-red-500', label: 'Sin actualizar', fecha: 'Nunca', dias: null };
    }
    const dias = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
    if (dias <= 90) return { clase: 'badge-green', dot: 'bg-green-500', label: 'Al día', fecha: formatearFecha(iso), dias };
    if (dias <= 180) return { clase: 'badge-yellow', dot: 'bg-yellow-400', label: 'Por vencer', fecha: formatearFecha(iso), dias };
    return { clase: 'badge-red', dot: 'bg-red-500', label: 'Desactualizado', fecha: formatearFecha(iso), dias };
}

// Pastilla visual del semáforo (punto de color + fecha).
export function semaforoPill(iso) {
    const s = semaforoActualizacion(iso);
    return `<span class="badge ${s.clase}" title="${s.label}"><span class="h-2 w-2 rounded-full ${s.dot}"></span> ${s.fecha}</span>`;
}

// Barra de progreso de actualización (actualizados / elegibles).
// Devuelve HTML con etiqueta, barra y conteos. Verde si va alto, amarillo si medio.
export function progressBar({ titulo = '', actualizados = 0, elegibles = 0 }) {
    const total = Number(elegibles) || 0;
    const hechos = Number(actualizados) || 0;
    const pct = total > 0 ? Math.round((hechos / total) * 100) : 0;
    const color = pct >= 66 ? 'bg-green-500' : pct >= 33 ? 'bg-yellow-400' : 'bg-navy-300';

    return `
        <div class="card p-5">
            <div class="mb-2 flex items-center justify-between gap-2">
                <p class="truncate font-medium text-navy-600">${titulo}</p>
                <span class="shrink-0 font-display text-lg font-bold text-navy-600">${pct}%</span>
            </div>
            <div class="h-2.5 w-full overflow-hidden rounded-full bg-navy-50">
                <div class="h-full rounded-full ${color}" style="width:${pct}%"></div>
            </div>
            <div class="mt-2 flex items-center gap-4 text-xs text-ink-muted">
                <span class="flex items-center gap-1"><span class="h-2 w-2 rounded-full bg-green-500"></span> ${hechos} actualizados</span>
                <span class="flex items-center gap-1"><span class="h-2 w-2 rounded-full bg-navy-200"></span> ${Math.max(total - hechos, 0)} pendientes</span>
                <span class="ml-auto">${total} elegibles</span>
            </div>
        </div>`;
}

// Paginación cliente-side reutilizable. Devuelve el HTML de la barra (con
// botones que llevan data-page) y los índices de corte para el slice.
// La vista: calcula -> corta items -> pinta -> cablea los [data-page].
export function paginacion({ total, page = 1, perPage = 12, label = 'registros' }) {
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    const p = Math.min(Math.max(1, page), totalPages);
    const desde = total === 0 ? 0 : (p - 1) * perPage + 1;
    const hasta = Math.min(p * perPage, total);
    const sliceStart = (p - 1) * perPage;
    const sliceEnd = p * perPage;

    if (totalPages <= 1) {
        return { html: '', totalPages, page: p, sliceStart: 0, sliceEnd: perPage };
    }

    const start = Math.max(1, Math.min(p - 2, totalPages - 4));
    const end = Math.min(totalPages, start + 4);
    const paginas = [];
    for (let i = start; i <= end; i++) paginas.push(i);

    const btn = (pg, contenido, activo = false, disabled = false) =>
        `<button data-page="${pg}" ${disabled ? 'disabled' : ''} class="flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-sm font-medium transition-colors ${activo ? 'bg-navy-600 text-white' : 'text-navy-600 hover:bg-navy-50'} disabled:pointer-events-none disabled:opacity-40">${contenido}</button>`;

    const html = `
        <div class="mt-5 flex flex-col items-center justify-between gap-3 rounded-xl border border-navy-100 bg-white px-4 py-3 sm:flex-row">
            <p class="text-sm text-ink-muted">Mostrando ${desde}–${hasta} de ${total} ${label}</p>
            <div class="flex items-center gap-1">
                ${btn(p - 1, icon('chevronRight', 'w-4 h-4 rotate-180'), false, p === 1)}
                ${paginas.map((pg) => btn(pg, pg, pg === p)).join('')}
                ${btn(p + 1, icon('chevronRight', 'w-4 h-4'), false, p === totalPages)}
            </div>
        </div>`;
    return { html, totalPages, page: p, sliceStart, sliceEnd };
}

// ── Skeletons (placeholders de carga) ──────────────────────────────
// Cajas grises "pulsando" con la forma del contenido, para mostrar mientras
// llega la respuesta de la API en vez de dejar la pantalla en blanco.

// N tarjetas grises (para grids de stats/cards). `alto` es una clase de altura.
export function skeletonCards(n = 3, alto = 'h-28') {
    return Array(n).fill(`<div class="card ${alto} animate-pulse bg-navy-50/50"></div>`).join('');
}

// Una "tabla" gris (card con filas simuladas: avatar + dos líneas).
export function skeletonTabla(filas = 5) {
    const fila = `
        <div class="flex items-center gap-3 border-t border-navy-50 px-5 py-4 first:border-t-0">
            <div class="h-9 w-9 shrink-0 animate-pulse rounded-full bg-navy-100"></div>
            <div class="flex-1 space-y-2">
                <div class="h-3 w-1/3 animate-pulse rounded bg-navy-100"></div>
                <div class="h-3 w-1/2 animate-pulse rounded bg-navy-50"></div>
            </div>
        </div>`;
    return `<div class="card p-0 overflow-hidden">${Array(filas).fill(fila).join('')}</div>`;
}

// Un bloque gris genérico (para un perfil, un hero, etc.).
export function skeletonBloque(alto = 'h-40') {
    return `<div class="card ${alto} animate-pulse bg-navy-50/50"></div>`;
}

// Encabezado de página: título Fredoka + subtítulo + acciones opcionales.
export function encabezado({ titulo, subtitulo = '', acciones = '' }) {
    return `
        <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
                <h1 class="font-display text-2xl font-bold text-navy-600 sm:text-3xl">${titulo}</h1>
                ${subtitulo ? `<p class="mt-1 text-ink-soft">${subtitulo}</p>` : ''}
            </div>
            ${acciones ? `<div class="flex flex-wrap items-center gap-2">${acciones}</div>` : ''}
        </div>`;
}

// Envoltura de modal consistente: overlay oscuro + card centrada.
// `cuerpoHtml` es el contenido interno (título, formulario, etc.).
// `maxW` controla el ancho (clase Tailwind, ej. 'max-w-lg').
export function modalOverlay(cuerpoHtml, maxW = 'max-w-md') {
    return `
        <div class="modal-overlay fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-navy-900/50 p-4 backdrop-blur-sm sm:items-center">
            <div class="modal-panel my-8 w-full ${maxW} rounded-2xl bg-white p-6 shadow-(--shadow-pop)" role="dialog" aria-modal="true" tabindex="-1">
                ${cuerpoHtml}
            </div>
        </div>`;
}

// Encabezado de modal con título Fredoka.
export function modalHeader(titulo, subtitulo = '') {
    return `
        <div class="mb-5">
            <h2 class="font-display text-xl font-bold text-navy-600">${titulo}</h2>
            ${subtitulo ? `<p class="mt-1 text-sm text-ink-soft">${subtitulo}</p>` : ''}
        </div>`;
}

// Estado vacío reutilizable.
export function vacio(mensaje, iconName = 'book') {
    return `
        <div class="flex flex-col items-center justify-center rounded-2xl border border-dashed border-navy-200 bg-white/60 px-6 py-14 text-center">
            <span class="mb-3 text-navy-200">${icon(iconName, 'w-10 h-10')}</span>
            <p class="text-ink-soft">${mensaje}</p>
        </div>`;
}
