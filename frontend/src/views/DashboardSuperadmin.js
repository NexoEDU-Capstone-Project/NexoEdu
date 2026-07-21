import { renderLayout } from './Layout.js';
import * as InstitutionService from '../services/institutionService.js';
import * as CampaignService from '../services/campaignService.js';
import { ApiError } from '../modules/http.js';
import { icon } from '../components/icons.js';
import { statCard, estadoCampania, vacio, progressBar, skeletonCards, skeletonTabla } from '../components/ui.js';

// Dashboard del superadmin (Distrito): resumen del distrito, progreso de
// actualización por campaña en curso, e instituciones registradas.
const DashboardSuperadmin = {
    async render() {
        const contenido = document.createElement('div');
        contenido.innerHTML = `
            <section class="relative mb-8 overflow-hidden rounded-2xl bg-navy-600 p-8 text-white sm:p-10">
                <span class="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-green-500/25 blur-2xl"></span>
                <span class="pointer-events-none absolute bottom-0 right-24 h-40 w-40 rounded-full bg-yellow-400/10 blur-2xl"></span>
                <div class="relative">
                    <span class="mb-4 flex h-1.5 w-20 overflow-hidden rounded-full" aria-hidden="true">
                        <span class="flex-1 bg-red-500"></span><span class="flex-1 bg-yellow-400"></span><span class="flex-1 bg-green-500"></span>
                    </span>
                    <h1 class="font-display text-3xl font-bold">Panel Distrital</h1>
                    <p class="mt-2 max-w-xl text-navy-100">Supervisa las instituciones educativas del distrito y lanza campañas de actualización a toda la comunidad.</p>
                </div>
            </section>

            <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h2 class="font-display text-xl font-bold text-navy-600">Resumen del distrito</h2>
                    <p class="text-sm text-ink-soft">Visión general de la red educativa de Barranquilla.</p>
                </div>
                <button id="btn-refrescar" class="btn btn-outline">${icon('refresh', 'w-4 h-4')} Actualizar</button>
            </div>

            <div id="stats" class="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3"></div>

            <div id="progreso-wrap" class="mb-8 hidden">
                <h2 class="mb-4 flex items-center gap-2 font-display text-lg font-semibold text-navy-600">
                    ${icon('trendUp', 'w-5 h-5 text-green-500')} Progreso de actualización del distrito
                </h2>
                <div id="progreso" class="grid grid-cols-1 gap-4 sm:grid-cols-2"></div>
            </div>

            <div class="mb-4 flex items-center justify-between">
                <h2 class="flex items-center gap-2 font-display text-lg font-semibold text-navy-600">
                    ${icon('school', 'w-5 h-5 text-green-500')} Instituciones registradas
                </h2>
                <a data-link href="/gestion-instituciones" class="text-sm font-semibold text-green-600 hover:text-green-700">Gestionar</a>
            </div>
            <div id="tabla" class="card p-0 overflow-hidden"></div>
        `;

        this._cargar(contenido);
        contenido.querySelector('#btn-refrescar').addEventListener('click', () => this._cargar(contenido));

        return renderLayout(contenido);
    },

    async _cargar(contenido) {
        const stats = contenido.querySelector('#stats');
        const tabla = contenido.querySelector('#tabla');
        stats.innerHTML = skeletonCards(3);
        tabla.innerHTML = skeletonTabla(6);

        try {
            const [instituciones, campanias] = await Promise.all([
                InstitutionService.listar(),
                CampaignService.listar().catch(() => [])
            ]);

            const activas = campanias.filter((c) => estadoCampania(c.start_date, c.end_date).texto === 'En curso').length;
            const conDirector = instituciones.filter((i) => i.director && i.director.trim()).length;

            stats.innerHTML = [
                statCard({ label: 'Instituciones', valor: instituciones.length, iconName: 'school',
                    nota: `${icon('checkCircle', 'w-4 h-4')} ${conDirector} con director asignado` }),
                statCard({ label: 'Campañas activas', valor: String(activas).padStart(2, '0'), iconName: 'megaphone',
                    nota: `${icon('clock', 'w-4 h-4')} ${campanias.length} en total`, notaColor: 'text-yellow-600' }),
                statCard({ label: 'Campañas totales', valor: campanias.length, iconName: 'chart',
                    nota: `${icon('trendUp', 'w-4 h-4')} histórico del distrito` })
            ].join('');

            if (instituciones.length === 0) {
                tabla.innerHTML = `<div class="p-6">${vacio('Aún no hay instituciones registradas.', 'school')}</div>`;
            } else {
                tabla.innerHTML = this._tabla(instituciones.slice(0, 8));
            }

            this._cargarProgreso(contenido, campanias);
        } catch (error) {
            const mensaje = error instanceof ApiError ? error.message : 'Error al cargar el dashboard';
            stats.innerHTML = '';
            tabla.innerHTML = `<div class="p-6 text-red-500">${mensaje}</div>`;
        }
    },

    // Progreso de actualización global (métricas del distrito) por campaña en curso.
    async _cargarProgreso(contenido, campanias) {
        const wrap = contenido.querySelector('#progreso-wrap');
        const cont = contenido.querySelector('#progreso');
        const activas = campanias
            .filter((c) => estadoCampania(c.start_date, c.end_date).texto === 'En curso')
            .slice(0, 4);

        if (activas.length === 0) return;

        wrap.classList.remove('hidden');
        cont.innerHTML = Array(activas.length).fill('<div class="card h-24 animate-pulse bg-navy-50/50"></div>').join('');

        const metricas = await Promise.all(
            activas.map((c) => CampaignService.metricas(c.id).catch(() => null))
        );

        cont.innerHTML = activas.map((c, i) => {
            const m = metricas[i];
            // Métricas globales (superadmin): forma { totales: { total_elegibles, ... } }.
            const elegibles = m ? (m.totales?.total_elegibles ?? m.total_elegibles ?? 0) : 0;
            const actualizados = m ? (m.totales?.total_actualizados ?? m.total_actualizados ?? 0) : 0;
            return progressBar({ titulo: c.title, actualizados, elegibles });
        }).join('');
    },

    _tabla(instituciones) {
        const filas = instituciones.map((i) => `
            <tr class="border-t border-navy-50 hover:bg-navy-50/40 transition-colors">
                <td class="px-5 py-3.5">
                    <div class="flex items-center gap-3">
                        <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-navy-50 text-navy-500">${icon('school', 'w-5 h-5')}</span>
                        <p class="font-medium text-navy-600">${i.institution_name}</p>
                    </div>
                </td>
                <td class="px-5 py-3.5 text-sm text-ink-soft">${i.director ?? '—'}</td>
                <td class="px-5 py-3.5 text-sm text-ink-soft">${i.dane_code ?? '—'}</td>
            </tr>`).join('');

        return `
            <table class="w-full text-left">
                <thead>
                    <tr class="text-xs uppercase tracking-wide text-ink-muted">
                        <th class="px-5 py-3 font-semibold">Institución</th>
                        <th class="px-5 py-3 font-semibold">Director</th>
                        <th class="px-5 py-3 font-semibold">Código DANE</th>
                    </tr>
                </thead>
                <tbody>${filas}</tbody>
            </table>`;
    }
};

export default DashboardSuperadmin;
