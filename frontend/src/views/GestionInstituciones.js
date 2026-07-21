import { renderLayout } from './Layout.js';
import * as InstitutionService from '../services/institutionService.js';
import * as CatalogService from '../services/catalogService.js';
import { crearSelectorBarrio } from '../components/SelectorBarrio.js';
import { ApiError } from '../modules/http.js';
import Router from '../modules/router.js';
import { icon } from '../components/icons.js';
import { encabezado, modalOverlay, modalHeader, vacio, paginacion, skeletonCards } from '../components/ui.js';
import { toast } from '../components/toast.js';

// Gestión de instituciones (superadmin): grid de tarjetas con búsqueda,
// filtro por estado y paginación. Cada tarjeta lleva al perfil de la
// institución; el alta se hace en un modal.
const GestionInstituciones = {
    async render() {
        const contenido = document.createElement('div');
        contenido.innerHTML = `
            ${encabezado({
                titulo: 'Gestión de Instituciones',
                subtitulo: 'Supervisa y gestiona los centros educativos registrados en el distrito.',
                acciones: `
                    <div class="relative">
                        <span class="pointer-events-none absolute inset-y-0 left-3 flex items-center text-navy-300">${icon('search', 'w-4 h-4')}</span>
                        <input id="buscar" class="input w-56 pl-9" placeholder="Buscar institución...">
                    </div>
                    <select id="filtro-estado" class="select w-44">
                        <option value="">Todas</option>
                        <option value="activo">Con director</option>
                        <option value="sin">Sin director</option>
                    </select>`
            })}
            <div id="lista" class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"></div>
            <div id="paginacion"></div>
            <div id="modal-container"></div>
        `;

        this._contenido = contenido;
        this._instituciones = [];
        this._filtro = '';
        this._filtroEstado = '';
        this._page = 1;
        // Sin await: el shell (con skeleton) se muestra de inmediato; los datos llegan después.
        this._cargarLista();

        contenido.querySelector('#buscar').addEventListener('input', (e) => {
            this._filtro = e.target.value.toLowerCase();
            this._page = 1;
            this._pintarLista();
        });
        contenido.querySelector('#filtro-estado').addEventListener('change', (e) => {
            this._filtroEstado = e.target.value;
            this._page = 1;
            this._pintarLista();
        });

        return renderLayout(contenido);
    },

    async _cargarLista() {
        const lista = this._contenido.querySelector('#lista');
        lista.innerHTML = skeletonCards(6, 'h-56');
        try {
            this._instituciones = await InstitutionService.listar();
            this._pintarLista();
        } catch (error) {
            const mensaje = error instanceof ApiError ? error.message : 'Error al cargar instituciones';
            lista.innerHTML = `<div class="col-span-full">${vacio(mensaje, 'school')}</div>`;
        }
    },

    _pintarLista() {
        const lista = this._contenido.querySelector('#lista');
        const filtro = this._filtro || '';
        const estado = this._filtroEstado || '';
        const items = this._instituciones.filter((i) => {
            const coincideNombre = i.institution_name.toLowerCase().includes(filtro);
            const activo = Boolean(i.credential_id);
            const coincideEstado = !estado || (estado === 'activo' ? activo : !activo);
            return coincideNombre && coincideEstado;
        });

        const pag = paginacion({ total: items.length, page: this._page, perPage: 9, label: 'instituciones' });
        this._page = pag.page;
        const visibles = items.slice(pag.sliceStart, pag.sliceEnd);

        const cards = visibles.map((i) => this._card(i)).join('');
        const cardAgregar = `
            <button id="btn-nueva" class="flex min-h-55 flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-navy-200 bg-white/50 p-6 text-center transition-colors hover:border-green-400 hover:bg-green-50/40">
                <span class="flex h-12 w-12 items-center justify-center rounded-full bg-navy-50 text-navy-400">${icon('plus', 'w-6 h-6')}</span>
                <span class="font-semibold text-navy-600">Agregar institución</span>
                <span class="text-xs text-ink-muted">Registrar nuevo centro educativo</span>
            </button>`;

        lista.innerHTML = (cards || '') + cardAgregar;
        this._contenido.querySelector('#paginacion').innerHTML = pag.html;

        lista.querySelector('#btn-nueva').addEventListener('click', () => this._abrirModal(null));
        // La card completa lleva al perfil de la institución (editar/eliminar viven allí).
        lista.querySelectorAll('[data-perfil]').forEach((el) =>
            el.addEventListener('click', () => Router.navigate(`/instituciones/${el.dataset.perfil}`))
        );
        this._contenido.querySelectorAll('#paginacion [data-page]').forEach((btn) =>
            btn.addEventListener('click', () => {
                this._page = Number(btn.dataset.page);
                this._pintarLista();
            })
        );
    },

    _card(i) {
        const activo = Boolean(i.credential_id);
        const acento = activo ? 'border-l-green-500' : 'border-l-red-400';
        const badge = activo
            ? `<span class="badge badge-green">ACTIVO</span>`
            : `<span class="badge badge-red">SIN DIRECTOR</span>`;

        return `
            <div data-perfil="${i.id}" class="card group flex cursor-pointer flex-col border-l-4 ${acento} p-5 transition-shadow hover:shadow-(--shadow-pop)">
                <div class="mb-3 flex items-start justify-between">
                    <span class="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-navy-50 text-navy-500">
                        ${i.logo_url
                            ? `<img src="${i.logo_url}" alt="${i.institution_name}" class="h-full w-full object-cover" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"><div style="display:none" class="flex h-full w-full items-center justify-center">${icon('gradCap', 'w-6 h-6')}</div>`
                            : icon('gradCap', 'w-6 h-6')}
                    </span>
                    ${badge}
                </div>
                <h3 class="font-display text-lg font-semibold leading-snug text-navy-600">${i.institution_name}</h3>
                <p class="mt-1 flex items-center gap-1 text-xs text-ink-muted">${icon('idCard', 'w-4 h-4')} DANE: ${i.dane_code ?? '—'}</p>

                <div class="my-4 border-t border-navy-50"></div>

                <div class="space-y-1.5 text-sm">
                    <p class="text-ink-muted">Director</p>
                    <p class="font-medium text-navy-600">${i.director || 'Sin asignar'}</p>
                    <p class="mt-2 flex items-center gap-1.5 text-ink-soft">${icon('mapPin', 'w-4 h-4 text-navy-300')} ${i.address ?? '—'}</p>
                </div>

                <div class="mt-4 flex items-center gap-1 pt-1 text-sm font-semibold text-green-600">
                    Ver perfil ${icon('chevronRight', 'w-4 h-4 transition-transform group-hover:translate-x-0.5')}
                </div>
            </div>`;
    },

    _mostrarMensaje(texto, tipo = 'success') {
        toast(texto, tipo);
    },

    async _abrirModal(id) {
        const esEdicion = id !== null;
        const modalContainer = this._contenido.querySelector('#modal-container');

        let institucion = null;
        if (esEdicion) {
            try {
                institucion = await InstitutionService.obtener(id);
            } catch (error) {
                this._mostrarMensaje('No se pudo cargar la institución', 'error');
                return;
            }
        }

        const localidades = await CatalogService.localidades();
        const selectorBarrio = crearSelectorBarrio({ idPrefix: 'institucion', localidades });

        modalContainer.innerHTML = modalOverlay(`
            ${modalHeader(esEdicion ? 'Editar institución' : 'Nueva institución')}
            <form id="form-institucion" class="space-y-4">
                <div>
                    <label class="label">Nombre</label>
                    <input name="institution_name" value="${institucion?.institution_name ?? ''}" required class="input">
                </div>
                <div>
                    <label class="label">Director</label>
                    <input name="director" value="${institucion?.director ?? ''}" required class="input">
                </div>
                <div>
                    <label class="label">Código DANE</label>
                    <input name="dane_code" value="${institucion?.dane_code ?? ''}" required class="input">
                </div>
                <div>
                    <label class="label">Dirección</label>
                    <input name="address" value="${institucion?.address ?? ''}" class="input">
                </div>
                ${selectorBarrio.html}
                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div><label class="label">Logo (URL, opcional)</label><input name="logo_url" value="${institucion?.logo_url ?? ''}" class="input" placeholder="https://..."></div>
                    <div><label class="label">Banner (URL, opcional)</label><input name="banner_url" value="${institucion?.banner_url ?? ''}" class="input" placeholder="https://..."></div>
                </div>
                <div id="form-error" class="hidden rounded-xl bg-red-50 p-3 text-sm text-red-600"></div>
                <div class="flex justify-end gap-3 pt-2">
                    <button type="button" id="btn-cancelar" class="btn btn-ghost">Cancelar</button>
                    <button type="submit" class="btn btn-primary">${esEdicion ? 'Guardar cambios' : 'Crear institución'}</button>
                </div>
            </form>
        `);

        const modal = modalContainer.firstElementChild;
        await selectorBarrio.init(modal, institucion?.neighborhood_id ?? null);

        const cerrarModal = () => (modalContainer.innerHTML = '');
        modal.querySelector('#btn-cancelar').addEventListener('click', cerrarModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) cerrarModal();
        });

        const form = modal.querySelector('#form-institucion');
        const errorDiv = modal.querySelector('#form-error');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            errorDiv.classList.add('hidden');
            const data = Object.fromEntries(new FormData(form).entries());

            try {
                if (esEdicion) {
                    await InstitutionService.actualizar(id, data);
                } else {
                    await InstitutionService.crear(data);
                }
                cerrarModal();
                this._mostrarMensaje(esEdicion ? 'Institución actualizada' : 'Institución creada');
                await this._cargarLista();
            } catch (error) {
                const mensaje = error instanceof ApiError ? error.message : 'Error al guardar la institución';
                errorDiv.textContent = mensaje;
                errorDiv.classList.remove('hidden');
            }
        });
    }
};

export default GestionInstituciones;
