import { renderLayout } from './Layout.js';
import * as CampaignService from '../services/campaignService.js';
import * as CatalogService from '../services/catalogService.js';
import * as InstitutionService from '../services/institutionService.js';
import { crearEditorCriteria } from '../components/EditorCriteria.js';
import { ApiError } from '../modules/http.js';
import Auth from '../modules/auth.js';
import { icon } from '../components/icons.js';
import { encabezado, campaignCard, vacio, modalOverlay, modalHeader, progressBar, estadoCampania, formatearFecha, avatar, iniciales, skeletonCards } from '../components/ui.js';
import { toast } from '../components/toast.js';
import { confirmDialog } from '../components/confirm.js';

// Gestión de campañas (superadmin y admin): grid de campañas con chip de
// origen (distrital/institucional), crear (con alcance y criterios), editar
// datos básicos, y un modal de detalle con progreso y quién actualizó.
const GestionCampanias = {
    async render() {
        const user = Auth.getUser();
        this._esSuperadmin = user.rol === 'superadmin';

        const contenido = document.createElement('div');
        this._contenido = contenido;
        // Catálogos/instituciones vacíos al inicio; se llenan cuando cargan.
        this._catalogos = { generos: [], grados: [], estados: [], localidades: [] };
        this._instituciones = [];

        contenido.innerHTML = `
            ${encabezado({
                titulo: this._esSuperadmin ? 'Campañas globales' : 'Campañas de mi institución',
                subtitulo: 'Lanza y monitorea campañas de actualización de datos.',
                acciones: `<button id="btn-nueva" class="btn btn-primary">${icon('rocket', 'w-4 h-4')} Nueva campaña</button>`
            })}
            <div id="lista-campanias" class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">${skeletonCards(6, 'h-72')}</div>
            <div id="modal-container"></div>
        `;

        contenido.querySelector('#btn-nueva').addEventListener('click', () => this._abrirModalCrear());

        // Carga en segundo plano; NO se hace await para mostrar el shell (con skeleton) YA.
        this._init();

        return renderLayout(contenido);
    },

    // Carga inicial EN PARALELO: catálogos (para los modales) + campañas + instituciones (si super).
    async _init() {
        const lista = this._contenido.querySelector('#lista-campanias');
        try {
            const [generos, grados, estados, localidades, campanias, instituciones] = await Promise.all([
                CatalogService.generos(), CatalogService.grados(), CatalogService.estados(), CatalogService.localidades(),
                CampaignService.listar(),
                this._esSuperadmin ? InstitutionService.listar() : Promise.resolve([])
            ]);
            this._catalogos = { generos, grados, estados, localidades };
            this._instituciones = instituciones;
            this._pintarLista(campanias);
        } catch (error) {
            lista.innerHTML = `<div class="card text-red-500">${error instanceof ApiError ? error.message : 'Error al cargar campañas'}</div>`;
        }
    },

    // Recarga la lista de campañas (tras crear/editar/eliminar).
    async _cargarLista() {
        const lista = this._contenido.querySelector('#lista-campanias');
        lista.innerHTML = skeletonCards(6, 'h-72');
        try {
            this._pintarLista(await CampaignService.listar());
        } catch (error) {
            lista.innerHTML = `<div class="card text-red-500">${error instanceof ApiError ? error.message : 'Error al cargar campañas'}</div>`;
        }
    },

    _pintarLista(campanias) {
        const lista = this._contenido.querySelector('#lista-campanias');
        this._campanias = campanias;

        if (campanias.length === 0) {
            lista.className = '';
            lista.innerHTML = vacio('Aún no hay campañas creadas.', 'megaphone');
            return;
        }

        lista.className = 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3';
        lista.innerHTML = campanias
            .map((c) => campaignCard(c, {
                dataId: c.id,
                acciones: `
                    <button class="btn-detalle btn btn-outline flex-1" data-id="${c.id}">${icon('chart', 'w-4 h-4')} Ver detalle</button>
                    ${c.puede_editar ? `
                    <button class="btn-editar btn btn-ghost" data-id="${c.id}" aria-label="Editar">${icon('pencil', 'w-4 h-4')}</button>
                    <button class="btn-eliminar btn btn-ghost text-red-500 hover:bg-red-50" data-id="${c.id}" aria-label="Eliminar">${icon('logout', 'w-4 h-4')}</button>` : ''}`
            }))
            .join('');

        lista.querySelectorAll('.btn-detalle').forEach((btn) =>
            btn.addEventListener('click', () => this._abrirDetalle(btn.dataset.id))
        );
        lista.querySelectorAll('.btn-editar').forEach((btn) =>
            btn.addEventListener('click', () => this._abrirModalEditar(btn.dataset.id))
        );
        lista.querySelectorAll('.btn-eliminar').forEach((btn) =>
            btn.addEventListener('click', () => this._confirmarEliminar(btn.dataset.id))
        );
    },

    _mostrarMensaje(texto, tipo = 'success') {
        toast(texto, tipo);
    },

    // Editar datos básicos de una campaña (título, tipo, descripción, patrocinador,
    // fechas, multimedia). El alcance/criterios no se editan aquí (el backend solo
    // actualiza datos básicos en PUT /campaigns/:id).
    async _abrirModalEditar(id) {
        const c = (this._campanias || []).find((x) => String(x.id) === String(id));
        if (!c) return;
        const modalContainer = this._contenido.querySelector('#modal-container');
        const val = (v) => (v ?? '');
        const fecha = (f) => (f ? f.substring(0, 10) : '');

        modalContainer.innerHTML = modalOverlay(`
            ${modalHeader('Editar campaña', 'El alcance y los criterios no se modifican desde aquí.')}
            <form id="form-editar" class="space-y-4">
                <div><label class="label">Título</label><input name="title" value="${val(c.title)}" required class="input"></div>
                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div><label class="label">Tipo</label><input name="type" value="${val(c.type)}" class="input" placeholder="Ej. Actualización de datos"></div>
                    <div><label class="label">Patrocinador</label><input name="sponsor" value="${val(c.sponsor)}" class="input"></div>
                </div>
                <div><label class="label">Descripción</label><textarea name="description" rows="2" class="textarea">${val(c.description)}</textarea></div>
                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div><label class="label">Fecha de inicio</label><input type="date" name="start_date" value="${fecha(c.start_date)}" required class="input"></div>
                    <div><label class="label">Fecha de fin (opcional)</label><input type="date" name="end_date" value="${fecha(c.end_date)}" class="input"></div>
                </div>
                <div><label class="label">Imagen (URL, opcional)</label><input name="url_multimedia" value="${val(c.url_multimedia)}" class="input" placeholder="https://..."></div>
                <div id="form-error" class="hidden rounded-xl bg-red-50 p-3 text-sm text-red-600"></div>
                <div class="flex justify-end gap-3 pt-2">
                    <button type="button" id="btn-cancelar" class="btn btn-ghost">Cancelar</button>
                    <button type="submit" class="btn btn-primary">Guardar cambios</button>
                </div>
            </form>
        `, 'max-w-lg');

        const modal = modalContainer.firstElementChild;
        const cerrarModal = () => (modalContainer.innerHTML = '');
        modal.querySelector('#btn-cancelar').addEventListener('click', cerrarModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) cerrarModal();
        });

        const form = modal.querySelector('#form-editar');
        const errorDiv = modal.querySelector('#form-error');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            errorDiv.classList.add('hidden');
            const data = Object.fromEntries(new FormData(form).entries());
            Object.keys(data).forEach((k) => { if (data[k] === '') data[k] = null; });

            try {
                await CampaignService.actualizar(id, data);
                cerrarModal();
                this._mostrarMensaje('Campaña actualizada');
                await this._cargarLista();
            } catch (error) {
                const mensaje = error instanceof ApiError ? error.message : 'Error al actualizar la campaña';
                errorDiv.textContent = mensaje;
                errorDiv.classList.remove('hidden');
            }
        });
    },

    // Detalle de campaña en modal: info + progreso de actualización (métricas) +
    // lista de estudiantes que ya actualizaron sus datos en esta campaña.
    async _abrirDetalle(id) {
        const c = (this._campanias || []).find((x) => String(x.id) === String(id));
        if (!c) return;
        const modalContainer = this._contenido.querySelector('#modal-container');
        const est = estadoCampania(c.start_date, c.end_date);
        const gradoNombre = (gid) => this._catalogos.grados.find((g) => g.id === gid)?.grade ?? 'Sin grado';

        modalContainer.innerHTML = modalOverlay(`
            ${modalHeader(c.title, `Detalle de la campaña`)}
            <div class="space-y-4">
                <div class="flex flex-wrap items-center gap-2">
                    <span class="badge ${est.badge}">${est.texto}</span>
                    ${c.type ? `<span class="badge badge-navy">${c.type}</span>` : ''}
                    ${c.sponsor ? `<span class="badge badge-yellow">${c.sponsor}</span>` : ''}
                    ${c.creador_rol ? `<span class="badge ${c.creador_rol === 'superadmin' ? 'badge-yellow' : 'badge-green'}">${c.creador_rol === 'superadmin' ? 'Distrital · Alcaldía' : 'Institucional'}</span>` : ''}
                </div>
                <p class="text-sm text-ink-soft">${c.description ?? 'Sin descripción.'}</p>
                <p class="flex items-center gap-1.5 text-xs text-ink-muted">${icon('calendar', 'w-4 h-4')} ${formatearFecha(c.start_date)} — ${c.end_date ? formatearFecha(c.end_date) : 'sin fecha límite'}</p>

                <div id="detalle-progreso"></div>

                <div>
                    <h3 class="mb-2 font-display text-sm font-semibold text-navy-600">Estudiantes que actualizaron</h3>
                    <div id="detalle-updates" class="max-h-64 overflow-y-auto"></div>
                </div>

                <div class="flex justify-end pt-1">
                    <button type="button" id="btn-cerrar" class="btn btn-ghost">Cerrar</button>
                </div>
            </div>
        `, 'max-w-lg');

        const modal = modalContainer.firstElementChild;
        const cerrar = () => (modalContainer.innerHTML = '');
        modal.querySelector('#btn-cerrar').addEventListener('click', cerrar);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) cerrar();
        });

        const progEl = modal.querySelector('#detalle-progreso');
        const updEl = modal.querySelector('#detalle-updates');
        progEl.innerHTML = '<div class="card h-16 animate-pulse bg-navy-50/50"></div>';
        updEl.innerHTML = '<p class="text-sm text-ink-muted">Cargando...</p>';

        const [m, updates] = await Promise.all([
            CampaignService.metricas(id).catch(() => null),
            CampaignService.estudiantesActualizados(id).catch(() => [])
        ]);

        const elegibles = m ? (m.totales?.total_elegibles ?? m.total_elegibles ?? 0) : 0;
        const actualizados = m ? (m.totales?.total_actualizados ?? m.total_actualizados ?? 0) : 0;
        progEl.innerHTML = progressBar({ titulo: 'Progreso de actualización', actualizados, elegibles });

        if (!updates.length) {
            updEl.innerHTML = vacio('Aún nadie ha actualizado sus datos en esta campaña.', 'users');
        } else {
            updEl.innerHTML = `<div class="divide-y divide-navy-50">` + updates.map((u) => `
                <div class="flex items-center justify-between gap-3 py-2.5">
                    <div class="flex min-w-0 items-center gap-3">
                        ${avatar(iniciales(u.first_name, u.last_name), u.people_id)}
                        <div class="min-w-0">
                            <p class="truncate font-medium text-navy-600">${u.first_name} ${u.last_name}</p>
                            <p class="truncate text-xs text-ink-muted">${gradoNombre(u.grade_id)}</p>
                        </div>
                    </div>
                    <span class="shrink-0 text-xs text-ink-muted">${formatearFecha(u.updated_at)}</span>
                </div>`).join('') + `</div>`;
        }
    },

    _editorScopeHtml() {
        if (!this._esSuperadmin) {
            return `<p class="text-xs text-ink-muted mb-2">Esta campaña aplicará únicamente a tu institución.</p>`;
        }

        return `
            <div>
                <div class="flex items-center justify-between mb-2">
                    <label class="label mb-0">Alcance de la campaña</label>
                    <button type="button" id="btn-agregar-scope" class="text-sm font-semibold text-green-600 hover:text-green-700">+ Agregar alcance</button>
                </div>
                <p class="text-xs text-ink-muted mb-2">Puedes combinar varios alcances (localidades, barrios o instituciones específicas); se aplican como "cualquiera de los siguientes".</p>
                <div id="scope-filas"></div>
            </div>
        `;
    },

    _initEditorScope(modal) {
        if (!this._esSuperadmin) return;

        const filasContainer = modal.querySelector('#scope-filas');
        const btnAgregar = modal.querySelector('#btn-agregar-scope');
        let contador = 0;

        const { localidades } = this._catalogos;
        const instituciones = this._instituciones;

        const agregarFila = () => {
            const indice = contador++;
            const div = document.createElement('div');
            div.className = 'scope-fila relative mb-2 rounded-xl border border-navy-100 bg-navy-50/40 p-4';
            div.dataset.fila = indice;
            div.innerHTML = `
                <button type="button" class="btn-quitar-scope absolute right-2 top-2 text-xs font-semibold text-red-500 hover:text-red-600">Quitar</button>
                <label class="mb-1 block text-xs font-medium text-ink-soft">Tipo de alcance</label>
                <select name="scope-type-${indice}" class="scope-type-select select mb-2">
                    <option value="GLOBAL">Global (todas las instituciones)</option>
                    <option value="INSTITUTION">Institución específica</option>
                    <option value="NEIGHBORHOOD">Barrio</option>
                    <option value="LOCALITY">Localidad</option>
                </select>
                <div class="scope-valor-container">
                    <p class="text-xs text-ink-muted">Esta campaña aplicará a todos los estudiantes y egresados del sistema.</p>
                </div>
            `;
            filasContainer.appendChild(div);

            const selectTipo = div.querySelector('.scope-type-select');
            const valorContainer = div.querySelector('.scope-valor-container');

            selectTipo.addEventListener('change', () => {
                if (selectTipo.value === 'GLOBAL') {
                    valorContainer.innerHTML = `
                        <p class="text-xs text-ink-muted">Esta campaña aplicará a todos los estudiantes y egresados del sistema.</p>`;
                } else if (selectTipo.value === 'INSTITUTION') {
                    valorContainer.innerHTML = `
                        <select name="scope-institution-${indice}" class="select">
                            ${instituciones.map((i) => `<option value="${i.id}">${i.institution_name}</option>`).join('')}
                        </select>`;
                } else if (selectTipo.value === 'LOCALITY') {
                    valorContainer.innerHTML = `
                        <select name="scope-locality-${indice}" class="select">
                            ${localidades.map((l) => `<option value="${l.id}">${l.name}</option>`).join('')}
                        </select>`;
                } else {
                    valorContainer.innerHTML = `
                        <select name="scope-locality-sel-${indice}" class="select mb-2">
                            <option value="">Selecciona una localidad</option>
                            ${localidades.map((l) => `<option value="${l.id}">${l.name}</option>`).join('')}
                        </select>
                        <select name="scope-neighborhood-${indice}" class="select">
                            <option value="">Selecciona una localidad primero</option>
                        </select>`;
                    const selLocalidad = valorContainer.querySelector(`[name="scope-locality-sel-${indice}"]`);
                    const selBarrio = valorContainer.querySelector(`[name="scope-neighborhood-${indice}"]`);
                    selLocalidad.addEventListener('change', async () => {
                        const barrios = await CatalogService.barrios(selLocalidad.value);
                        selBarrio.innerHTML = barrios.map((b) => `<option value="${b.id}">${b.name}</option>`).join('');
                    });
                }
            });

            div.querySelector('.btn-quitar-scope').addEventListener('click', () => div.remove());
        };

        btnAgregar.addEventListener('click', agregarFila);
        agregarFila(); // al menos una fila por defecto
    },

    _leerScope(modal, institutionIdDelAdmin) {
        if (!this._esSuperadmin) {
            return [{ scope_type: 'INSTITUTION', institution_id: institutionIdDelAdmin }];
        }

        const filas = modal.querySelectorAll('.scope-fila');
        const scope = [];

        filas.forEach((fila) => {
            const indice = fila.dataset.fila;
            const tipo = fila.querySelector(`[name="scope-type-${indice}"]`).value;

            if (tipo === 'GLOBAL') {
                scope.push({ scope_type: 'GLOBAL' });
            } else if (tipo === 'INSTITUTION') {
                const institution_id = fila.querySelector(`[name="scope-institution-${indice}"]`)?.value;
                scope.push({ scope_type: 'INSTITUTION', institution_id });
            } else if (tipo === 'LOCALITY') {
                const localities_id = fila.querySelector(`[name="scope-locality-${indice}"]`)?.value;
                scope.push({ scope_type: 'LOCALITY', localities_id });
            } else if (tipo === 'NEIGHBORHOOD') {
                const neighborhood_id = fila.querySelector(`[name="scope-neighborhood-${indice}"]`)?.value;
                scope.push({ scope_type: 'NEIGHBORHOOD', neighborhood_id });
            }
        });

        return scope;
    },

    async _abrirModalCrear() {
        const modalContainer = this._contenido.querySelector('#modal-container');
        const editorCriteria = crearEditorCriteria({ catalogos: this._catalogos });

        modalContainer.innerHTML = `
            <div class="modal-overlay fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-navy-900/50 p-4 backdrop-blur-sm sm:items-center">
                <div class="modal-panel my-8 w-full max-w-lg rounded-2xl bg-white p-6 shadow-(--shadow-pop)" role="dialog" aria-modal="true" tabindex="-1">
                    <h2 class="mb-5 font-display text-xl font-bold text-navy-600">Nueva campaña</h2>
                    <form id="form-campania" class="space-y-4">
                        <div>
                            <label class="label">Título</label>
                            <input name="title" required class="input">
                        </div>
                        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <label class="label">Tipo</label>
                                <input name="type" class="input" placeholder="Ej. Actualización de datos">
                            </div>
                            <div>
                                <label class="label">Patrocinador</label>
                                <input name="sponsor" class="input" placeholder="Ej. Alcaldía de Barranquilla">
                            </div>
                        </div>
                        <div>
                            <label class="label">Descripción</label>
                            <textarea name="description" rows="2" class="textarea"></textarea>
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="label">Fecha de inicio</label>
                                <input type="date" name="start_date" required class="input">
                            </div>
                            <div>
                                <label class="label">Fecha de fin (opcional)</label>
                                <input type="date" name="end_date" class="input">
                            </div>
                        </div>
                        <div>
                            <label class="label">Imagen (URL, opcional)</label>
                            <input name="url_multimedia" class="input" placeholder="https://...">
                        </div>
                        ${this._editorScopeHtml()}
                        ${editorCriteria.html}
                        <div id="form-error" class="hidden rounded-xl bg-red-50 p-3 text-sm text-red-600"></div>
                        <div class="flex justify-end gap-3 pt-2">
                            <button type="button" id="btn-cancelar" class="btn btn-ghost">Cancelar</button>
                            <button type="submit" class="btn btn-primary">
                                Crear campaña
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        const modal = modalContainer.firstElementChild;
        this._initEditorScope(modal);
        editorCriteria.init(modal);

        const cerrarModal = () => (modalContainer.innerHTML = '');
        modal.querySelector('#btn-cancelar').addEventListener('click', cerrarModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) cerrarModal();
        });

        const form = modal.querySelector('#form-campania');
        const errorDiv = modal.querySelector('#form-error');
        const user = Auth.getUser();

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            errorDiv.classList.add('hidden');

            const formData = new FormData(form);
            const data = {
                title: formData.get('title'),
                type: formData.get('type') || null,
                sponsor: formData.get('sponsor') || null,
                description: formData.get('description') || null,
                url_multimedia: formData.get('url_multimedia') || null,
                start_date: formData.get('start_date'),
                end_date: formData.get('end_date') || null,
                scope: this._leerScope(modal, user.institution_id),
                criteria: editorCriteria.leerValores(modal)
            };

            try {
                await CampaignService.crear(data);
                cerrarModal();
                this._mostrarMensaje('Campaña creada');
                await this._cargarLista();
            } catch (error) {
                const mensaje = error instanceof ApiError ? error.message : 'Error al crear la campaña';
                errorDiv.textContent = mensaje;
                errorDiv.classList.remove('hidden');
            }
        });
    },

    async _confirmarEliminar(id) {
        const ok = await confirmDialog({
            titulo: 'Eliminar campaña',
            mensaje: 'Se eliminará la campaña y sus métricas asociadas. Esta acción no se puede deshacer.',
            confirmar: 'Eliminar',
            peligro: true
        });
        if (!ok) return;

        try {
            await CampaignService.eliminar(id);
            this._mostrarMensaje('Campaña eliminada');
            await this._cargarLista();
        } catch (error) {
            const mensaje = error instanceof ApiError ? error.message : 'Error al eliminar la campaña';
            this._mostrarMensaje(mensaje, 'error');
        }
    }
};

export default GestionCampanias;
