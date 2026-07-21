import { renderLayout } from './Layout.js';
import * as StudentService from '../services/studentService.js';
import * as CampaignService from '../services/campaignService.js';
import * as CatalogService from '../services/catalogService.js';
import * as InstitutionService from '../services/institutionService.js';
import Auth from '../modules/auth.js';
import { ApiError } from '../modules/http.js';
import { icon } from '../components/icons.js';
import { statCard, estadoCampania, formatearFecha, iniciales, avatar, vacio, campaignCard, progressBar, skeletonCards, skeletonTabla } from '../components/ui.js';

// Dashboard del administrador/director: portada de la institución (banner +
// logo + datos), estadísticas, progreso de actualización de sus campañas,
// campañas y tabla de estudiantes.
const DashboardEscuela = {
    async render() {
        const contenido = document.createElement('div');
        contenido.innerHTML = `
            <!-- Hero (banner + logo de la institución) -->
            <div id="hero" class="mb-8"></div>
            <!-- Tarjetas de info de la institución -->
            <div id="institution-info" class="mb-8"></div>

            <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h2 class="font-display text-xl font-bold text-navy-600">Dashboard de gestión escolar</h2>
                    <p class="text-sm text-ink-soft">Resumen operativo de tu institución.</p>
                </div>
                <button id="btn-refrescar" class="btn btn-outline">${icon('refresh', 'w-4 h-4')} Actualizar</button>
            </div>

            <div id="stats" class="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3"></div>

            <div id="progreso-wrap" class="mb-8 hidden">
                <h2 class="mb-4 flex items-center gap-2 font-display text-lg font-semibold text-navy-600">
                    ${icon('trendUp', 'w-5 h-5 text-green-500')} Progreso de actualización
                </h2>
                <div id="progreso" class="grid grid-cols-1 gap-4 sm:grid-cols-2"></div>
            </div>

            <div class="mb-4 flex items-center justify-between">
                <h2 class="flex items-center gap-2 font-display text-lg font-semibold text-navy-600">
                    ${icon('megaphone', 'w-5 h-5 text-green-500')} Campañas
                </h2>
                <a data-link href="/campanias-institucion" class="btn btn-primary">${icon('rocket', 'w-4 h-4')} Ir a campañas</a>
            </div>
            <div id="campanias" class="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"></div>

            <div class="mb-4 flex items-center justify-between">
                <h2 class="flex items-center gap-2 font-display text-lg font-semibold text-navy-600">
                    ${icon('users', 'w-5 h-5 text-green-500')} Estudiantes y egresados
                </h2>
                <a data-link href="/gestion-estudiantes" class="text-sm font-semibold text-green-600 hover:text-green-700">Ver todos</a>
            </div>
            <div id="tabla" class="card p-0 overflow-hidden"></div>
        `;

        this._cargar(contenido);

        contenido.querySelector('#btn-refrescar').addEventListener('click', () => this._cargar(contenido));

        return renderLayout(contenido);
    },

    async _cargar(contenido) {
        const stats = contenido.querySelector('#stats');
        const campaniasEl = contenido.querySelector('#campanias');
        const tabla = contenido.querySelector('#tabla');

        stats.innerHTML = this._skeletonStats();
        campaniasEl.innerHTML = skeletonCards(3, 'h-64');
        tabla.innerHTML = skeletonTabla(6);

        // Hero con banner + logo reales de la institución del director.
        const hero = contenido.querySelector('#hero');
        hero.innerHTML = '<div class="h-44 animate-pulse rounded-2xl bg-navy-50/60 sm:h-52"></div>';
        const institutionId = Auth.getUser()?.institution_id;
        if (institutionId) {
            InstitutionService.obtener(institutionId)
                .then((inst) => this._pintarHero(hero, inst, contenido))
                .catch(() => this._pintarHero(hero, null, contenido));
        } else {
            this._pintarHero(hero, null, contenido);
        }

        try {
            const [estudiantes, campanias, estados] = await Promise.all([
                StudentService.listar(),
                CampaignService.listar().catch(() => []),
                CatalogService.estados().catch(() => [])
            ]);

            const estadoPorId = Object.fromEntries(estados.map((e) => [e.id, e.status]));
            const egresados = estudiantes.filter(
                (e) => (estadoPorId[e.status_id] || '').toUpperCase() === 'EGRESADO'
            ).length;
            const activas = campanias.filter((c) => estadoCampania(c.start_date, c.end_date).texto === 'En curso').length;

            stats.innerHTML = [
                statCard({ label: 'Total estudiantes', valor: estudiantes.length, iconName: 'users',
                    nota: `${icon('trendUp', 'w-4 h-4')} ${estudiantes.length} registrados` }),
                statCard({ label: 'Campañas activas', valor: String(activas).padStart(2, '0'), iconName: 'megaphone',
                    nota: `${icon('clock', 'w-4 h-4')} ${campanias.length} en total`, notaColor: 'text-yellow-600' }),
                statCard({ label: 'Egresados', valor: egresados, iconName: 'gradCap',
                    nota: `${icon('checkCircle', 'w-4 h-4')} del total registrado` })
            ].join('');

            // Campañas (hasta 3)
            if (campanias.length === 0) {
                campaniasEl.innerHTML = vacio('Aún no hay campañas para tu institución.', 'megaphone');
                campaniasEl.className = '';
            } else {
                campaniasEl.className = 'mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3';
                campaniasEl.innerHTML = campanias.slice(0, 3).map((c) => campaignCard(c)).join('');
            }

            // Progreso de actualización (métrica central) de campañas en curso
            this._cargarProgreso(contenido, campanias);

            // Tabla
            if (estudiantes.length === 0) {
                tabla.innerHTML = `<div class="p-6">${vacio('Aún no hay estudiantes registrados en tu institución.', 'users')}</div>`;
            } else {
                tabla.innerHTML = this._tablaEstudiantes(estudiantes.slice(0, 6), estadoPorId);
            }
        } catch (error) {
            const mensaje = error instanceof ApiError ? error.message : 'Error al cargar el dashboard';
            stats.innerHTML = '';
            tabla.innerHTML = `<div class="p-6 text-red-500">${mensaje}</div>`;
        }
    },

    // Hero tipo "portada de institución": banner (con fallback a degradado navy),
    // logo, nombre y tricolor de Barranquilla.
    _pintarHero(hero, inst, contenido) {
        const nombre = inst?.institution_name || 'Panel de tu institución';
        const bannerStyle = inst?.banner_url
            ? `background-image:linear-gradient(180deg, rgba(20,35,52, 0.25), rgba(20,35,52,.75)), url('${inst.banner_url}'); background-size:cover; background-position:center;`
            : '';

        // Pintar solo el banner en el hero
        hero.innerHTML = `
            <section class="relative overflow-hidden rounded-2xl bg-navy-600 text-white" style="${bannerStyle}">
                ${inst?.banner_url ? '' : `
                    <span class="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-green-500/25 blur-2xl"></span>
                    <span class="pointer-events-none absolute bottom-0 right-24 h-40 w-40 rounded-full bg-yellow-400/10 blur-2xl"></span>`}
                <div class="relative flex h-44 flex-col justify-end p-6 sm:h-52 sm:p-8 md:h-96">
                    <span class="mb-4 flex h-1.5 w-40 overflow-hidden rounded-full" aria-hidden="true">
                        <span class="flex-1 bg-red-500"></span><span class="flex-1 bg-yellow-400"></span><span class="flex-1 bg-green-500"></span>
                    </span>
                    <div class="flex items-end gap-4">
                        <div class="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-white shadow-md">
                            ${inst?.logo_url
                                ? `<img src="${inst.logo_url}" alt="${nombre}" class="h-full w-full object-cover" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"><div style="display:none" class="flex h-full w-full items-center justify-center bg-navy-50 text-navy-400">${icon('school', 'w-7 h-7')}</div>`
                                : `<div class="flex h-full w-full items-center justify-center bg-navy-50 text-navy-400">${icon('school', 'w-7 h-7')}</div>`}
                        </div>
                        <div class="min-w-0 pb-1">
                            <h1 class="font-display text-2xl font-bold leading-tight drop-shadow sm:text-3xl">${nombre}</h1>
                            <p class="text-sm text-navy-100">Gestiona a tus estudiantes y monitorea las campañas de actualización.</p>
                        </div>
                    </div>
                </div>
            </section>`;
        
        // Pintar las tarjetas de info en el contenedor separado
        const infoContainer = contenido.querySelector('#institution-info');
        if (infoContainer) {
            if (inst) {
                infoContainer.innerHTML = `
                    <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <div class="card flex items-start gap-3 p-4">
                            <span class="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-navy-50 text-navy-500">${icon('user', 'w-4 h-4')}</span>
                            <div class="min-w-0"><p class="caracter">Director</p><p class="truncate font-medium text-navy-600" title="${inst.director || ''}">${inst.director || 'Sin asignar'}</p></div>
                        </div>
                        <div class="card flex items-start gap-3 p-4">
                            <span class="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-navy-50 text-navy-500">${icon('idCard', 'w-4 h-4')}</span>
                            <div class="min-w-0"><p class="caracter">Código DANE</p><p class="truncate font-medium text-navy-500">${inst.dane_code || '—'}</p></div>
                        </div>
                        <div class="card flex items-start gap-3 p-4">
                            <span class="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-navy-50 text-navy-500">${icon('mapPin', 'w-4 h-4')}</span>
                            <div class="min-w-0"><p class="caracter">Dirección</p><p class="truncate font-medium text-navy-500" title="${inst.address || ''}">${inst.address || '—'}</p></div>
                        </div>
                    </div>`;
            } else {
                infoContainer.innerHTML = '';
            }
        }
    },

    // Para cada campaña en curso (hasta 4) consulta sus métricas y pinta una
    // barra de progreso (actualizados vs. elegibles) — el KPI central del sistema.
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
            // Métricas del admin: forma plana { total_elegibles, total_actualizados }.
            const elegibles = m ? (m.total_elegibles ?? m.totales?.total_elegibles ?? 0) : 0;
            const actualizados = m ? (m.total_actualizados ?? m.totales?.total_actualizados ?? 0) : 0;
            return progressBar({ titulo: c.title, actualizados, elegibles });
        }).join('');
    },

    _tablaEstudiantes(estudiantes, estadoPorId) {
        const filas = estudiantes.map((e) => {
            const nombre = `${e.first_name} ${e.last_name}`;
            const estado = estadoPorId[e.status_id] || '';
            return `
                <tr class="border-t border-navy-50 hover:bg-navy-50/40 transition-colors">
                    <td class="px-5 py-3.5">
                        <div class="flex items-center gap-3">
                            ${avatar(iniciales(e.first_name, e.last_name), e.people_id)}
                            <div class="min-w-0">
                                <p class="truncate font-medium text-navy-600">${nombre}</p>
                                <p class="truncate text-xs text-ink-muted">${e.email}</p>
                            </div>
                        </div>
                    </td>
                    <td class="px-5 py-3.5 text-sm text-ink-soft">${e.document_number}</td>
                    <td class="px-5 py-3.5"><span class="badge ${estado.toUpperCase() === 'EGRESADO' ? 'badge-navy' : 'badge-green'}">${estado || '—'}</span></td>
                    <td class="px-5 py-3.5 text-sm text-ink-soft">${formatearFecha(e.start_date)}</td>
                </tr>`;
        }).join('');

        return `
            <table class="w-full text-left">
                <thead>
                    <tr class="text-xs uppercase tracking-wide text-ink-muted">
                        <th class="px-5 py-3 font-semibold">Estudiante</th>
                        <th class="px-5 py-3 font-semibold">Documento</th>
                        <th class="px-5 py-3 font-semibold">Estado</th>
                        <th class="px-5 py-3 font-semibold">Registro</th>
                    </tr>
                </thead>
                <tbody>${filas}</tbody>
            </table>`;
    },

    _skeletonStats() {
        return Array(3).fill('<div class="card h-28 animate-pulse bg-navy-50/50"></div>').join('');
    }
};

export default DashboardEscuela;
