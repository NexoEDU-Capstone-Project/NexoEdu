import { renderLayout } from './Layout.js';
import * as StudentService from '../services/studentService.js';
import * as CatalogService from '../services/catalogService.js';
import { crearSelectorBarrio } from '../components/SelectorBarrio.js';
import { ApiError } from '../modules/http.js';
import { icon } from '../components/icons.js';
import { encabezado, vacio, iniciales, avatar, semaforoPill, semaforoActualizacion, skeletonTabla } from '../components/ui.js';
import { toast } from '../components/toast.js';
import { confirmDialog } from '../components/confirm.js';

// Gestión de estudiantes/egresados (admin): lista agrupada por curso con
// búsqueda, filtros y semáforo de última actualización. Alta en modal y
// edición con pestañas (datos personales / académico / acceso/credenciales).
const GestionEstudiantes = {
    async render() {
        const contenido = document.createElement('div');
        this._contenido = contenido;
        this._estudiantes = [];
        this._cargado = false;   // evita pintar/usar catálogos antes de que carguen
        this._filtros = { q: '', grade: '', status: '', actualizacion: '' };
        // Catálogos: vacíos al inicio; se llenan cuando cargan (no bloquean el render).
        this._catalogos = { generos: [], tiposDocumento: [], grados: [], estados: [], localidades: [] };

        contenido.innerHTML = `
            ${encabezado({
                titulo: 'Estudiantes y egresados',
                subtitulo: 'Administra a tus estudiantes y egresados, organizados por curso.',
                acciones: `<button id="btn-nuevo" class="btn btn-primary">${icon('plus', 'w-4 h-4')} Nuevo estudiante</button>`
            })}
            <div class="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
                <div class="relative flex-1">
                    <span class="pointer-events-none absolute inset-y-0 left-3 flex items-center text-navy-300">${icon('search', 'w-4 h-4')}</span>
                    <input id="buscar" class="input pl-9" placeholder="Buscar por nombre o documento...">
                </div>
                <select id="filtro-grado" class="select sm:w-48"><option value="">Todos los cursos</option></select>
                <select id="filtro-estado" class="select sm:w-44"><option value="">Todos los estados</option></select>
                <select id="filtro-actualizacion" class="select sm:w-48">
                    <option value="">Actualización: todos</option>
                    <option value="actualizados">Actualizados</option>
                    <option value="pendientes">Pendientes</option>
                </select>
            </div>
            <div id="tabla-container" class="space-y-6">${skeletonTabla(6)}</div>
            <div id="modal-container"></div>
        `;

        contenido.querySelector('#btn-nuevo').addEventListener('click', () => this._abrirModalCrear());
        contenido.querySelector('#buscar').addEventListener('input', (e) => {
            this._filtros.q = e.target.value.toLowerCase();
            if (this._cargado) this._pintar();
        });
        contenido.querySelector('#filtro-grado').addEventListener('change', (e) => {
            this._filtros.grade = e.target.value;
            if (this._cargado) this._pintar();
        });
        contenido.querySelector('#filtro-estado').addEventListener('change', (e) => {
            this._filtros.status = e.target.value;
            if (this._cargado) this._pintar();
        });
        contenido.querySelector('#filtro-actualizacion').addEventListener('change', (e) => {
            this._filtros.actualizacion = e.target.value;
            if (this._cargado) this._pintar();
        });

        // Carga en segundo plano; NO se hace await para que el shell (con skeleton) se muestre YA.
        this._init();

        return renderLayout(contenido);
    },

    // Carga inicial: catálogos + estudiantes EN PARALELO (una sola espera, no 6 seguidas).
    async _init() {
        const cont = this._contenido.querySelector('#tabla-container');
        try {
            const [generos, tiposDocumento, grados, estados, localidades, estudiantes] = await Promise.all([
                CatalogService.generos(), CatalogService.tiposDocumento(), CatalogService.grados(),
                CatalogService.estados(), CatalogService.localidades(), StudentService.listar()
            ]);
            this._catalogos = { generos, tiposDocumento, grados, estados, localidades };
            this._estudiantes = estudiantes;
            this._cargado = true;
            // Rellena los selects de filtro con las opciones de catálogo ya cargadas.
            this._contenido.querySelector('#filtro-grado').insertAdjacentHTML('beforeend',
                grados.map((g) => `<option value="${g.id}">${g.grade}</option>`).join('') + '<option value="__none__">Egresados</option>');
            this._contenido.querySelector('#filtro-estado').insertAdjacentHTML('beforeend',
                estados.map((s) => `<option value="${s.id}">${s.status}</option>`).join(''));
            this._pintar();
        } catch (error) {
            const mensaje = error instanceof ApiError ? error.message : 'Error al cargar estudiantes';
            cont.innerHTML = `<div class="card text-red-500">${mensaje}</div>`;
        }
    },

    // Recarga solo la lista (tras crear/editar/eliminar); los catálogos ya están cargados.
    async _cargarTabla() {
        const cont = this._contenido.querySelector('#tabla-container');
        cont.innerHTML = skeletonTabla(6);
        try {
            this._estudiantes = await StudentService.listar();
            this._pintar();
        } catch (error) {
            const mensaje = error instanceof ApiError ? error.message : 'Error al cargar estudiantes';
            cont.innerHTML = `<div class="card text-red-500">${mensaje}</div>`;
        }
    },

    _nombreGrado(id) {
        return this._catalogos.grados.find((g) => g.id === id)?.grade ?? 'Sin grado';
    },

    _nombreEstado(id) {
        return this._catalogos.estados.find((s) => s.id === id)?.status ?? '—';
    },

    // Aplica filtros (búsqueda, grado, estado, actualización), agrupa por curso y pinta.
    _pintar() {
        const cont = this._contenido.querySelector('#tabla-container');
        const { q, grade, status, actualizacion } = this._filtros;

        let filtrados = this._estudiantes.filter((e) => {
            const nombre = `${e.first_name} ${e.last_name}`.toLowerCase();
            const coincideQ = !q || nombre.includes(q) || String(e.document_number).includes(q);
            const coincideGrado = !grade
                || (grade === '__none__' ? e.grade_id == null : String(e.grade_id) === grade);
            const coincideEstado = !status || String(e.status_id) === status;
            // Pendiente = semáforo rojo (desactualizado o nunca actualizado);
            // Actualizado = verde o amarillo (al día o por vencer).
            const pendiente = semaforoActualizacion(e.ultima_actualizacion).clase === 'badge-red';
            const coincideActualizacion = !actualizacion
                || (actualizacion === 'pendientes' ? pendiente : !pendiente);
            return coincideQ && coincideGrado && coincideEstado && coincideActualizacion;
        });

        if (filtrados.length === 0) {
            cont.innerHTML = vacio('No hay estudiantes que coincidan con los filtros.', 'users');
            return;
        }

        // Agrupa por grado (curso). Orden: según el catálogo de grados; el grupo
        // "Sin grado / Egresados" va al final.
        const grupos = new Map();
        for (const e of filtrados) {
            const key = e.grade_id ?? '__none__';
            if (!grupos.has(key)) grupos.set(key, []);
            grupos.get(key).push(e);
        }
        const ordenGrado = new Map(this._catalogos.grados.map((g, i) => [g.id, i]));
        const claves = [...grupos.keys()].sort((a, b) => {
            if (a === '__none__') return 1;
            if (b === '__none__') return -1;
            return (ordenGrado.get(a) ?? 999) - (ordenGrado.get(b) ?? 999);
        });

        cont.innerHTML = claves.map((key) => {
            const titulo = key === '__none__' ? 'Egresados' : this._nombreGrado(key);
            const alumnos = grupos.get(key);
            return `
                <div>
                    <div class="mb-2 flex items-center gap-2">
                        <h2 class="flex items-center gap-2 font-display text-lg font-semibold text-navy-600">
                            ${icon('gradCap', 'w-5 h-5 text-green-500')} ${titulo}
                        </h2>
                        <span class="badge badge-navy">${alumnos.length}</span>
                    </div>
                    <div class="card p-0 overflow-hidden">
                        <table class="w-full text-left">
                            <thead>
                                <tr class="text-xs uppercase tracking-wide text-ink-muted">
                                    <th class="px-5 py-3 font-semibold">Estudiante</th>
                                    <th class="px-5 py-3 font-semibold">Documento</th>
                                    <th class="px-5 py-3 font-semibold">Última actualización</th>
                                    <th class="px-5 py-3 font-semibold">Estado</th>
                                    <th class="px-5 py-3 text-right font-semibold">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>${alumnos.map((e) => this._fila(e)).join('')}</tbody>
                        </table>
                    </div>
                </div>`;
        }).join('');

        cont.querySelectorAll('.btn-editar').forEach((btn) =>
            btn.addEventListener('click', () => this._abrirModalEditar(btn.dataset.id))
        );
        cont.querySelectorAll('.btn-eliminar').forEach((btn) =>
            btn.addEventListener('click', () => this._confirmarEliminar(btn.dataset.id))
        );
    },

    _fila(e) {
        const estado = this._nombreEstado(e.status_id);
        return `
            <tr class="border-t border-navy-50 hover:bg-navy-50/40 transition-colors" data-id="${e.people_id}">
                <td class="px-5 py-3.5">
                    <div class="flex items-center gap-3">
                        ${avatar(iniciales(e.first_name, e.last_name), e.people_id)}
                        <div class="min-w-0 max-w-50 sm:max-w-60">
                            <p class="truncate font-medium text-navy-600" title="${e.first_name} ${e.last_name}">${e.first_name} ${e.last_name}</p>
                            <p class="truncate text-xs text-ink-muted" title="${e.email}">${e.email}</p>
                        </div>
                    </div>
                </td>
                <td class="px-5 py-3.5 text-sm text-ink-soft">${e.document_number}</td>
                <td class="px-5 py-3.5">${semaforoPill(e.ultima_actualizacion)}</td>
                <td class="px-5 py-3.5"><span class="badge ${estado.toUpperCase() === 'EGRESADO' ? 'badge-navy' : estado.toUpperCase() === 'ACTIVO' ? 'badge-green' : 'badge-yellow'}">${estado}</span></td>
                <td class="px-5 py-3.5">
                    <div class="flex items-center justify-end gap-2">
                        <button class="btn-editar btn btn-outline" data-id="${e.people_id}">${icon('pencil', 'w-4 h-4')} Editar</button>
                        <button class="btn-eliminar btn btn-ghost text-red-500 hover:bg-red-50" data-id="${e.people_id}" aria-label="Eliminar">${icon('logout', 'w-4 h-4')}</button>
                    </div>
                </td>
            </tr>`;
    },

    _mostrarMensaje(texto, tipo = 'success') {
        toast(texto, tipo);
    },

    _camposPersonales(datos, selectorBarrio) {
        const { generos, tiposDocumento } = this._catalogos;
        return `
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="label">Nombres</label>
                    <input name="first_name" value="${datos?.first_name ?? ''}" required class="input">
                </div>
                <div>
                    <label class="label">Apellidos</label>
                    <input name="last_name" value="${datos?.last_name ?? ''}" required class="input">
                </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="label">Género</label>
                    <select name="gender_id" required class="input">
                        ${generos.map((g) => `<option value="${g.id}" ${g.id === datos?.gender_id ? 'selected' : ''}>${g.name}</option>`).join('')}
                    </select>
                </div>
                <div>
                    <label class="label">Fecha de nacimiento</label>
                    <input type="date" name="birth_date" value="${datos?.birth_date ? datos.birth_date.substring(0, 10) : ''}" required class="input">
                </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="label">Email</label>
                    <input type="email" name="email" value="${datos?.email ?? ''}" required class="input">
                </div>
                <div>
                    <label class="label">Teléfono</label>
                    <input name="phone" value="${datos?.phone ?? ''}" class="input">
                </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="label">Tipo de documento</label>
                    <select name="document_type_id" required class="input">
                        ${tiposDocumento.map((t) => `<option value="${t.id}" ${t.id === datos?.document_type_id ? 'selected' : ''}>${t.abbreviation}</option>`).join('')}
                    </select>
                </div>
                <div>
                    <label class="label">Número de documento</label>
                    <input name="document_number" value="${datos?.document_number ?? ''}" required class="input">
                </div>
            </div>
            <div>
                <label class="label">Dirección</label>
                <input name="address" value="${datos?.address ?? ''}" class="input">
            </div>
            ${selectorBarrio.html}
        `;
    },

    _camposAcademicos(datos) {
        const { grados, estados } = this._catalogos;
        return `
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="label">Grado (opcional para egresados)</label>
                    <select name="grade_id" class="input">
                        <option value="">Egresado (sin grado)</option>
                        ${grados.map((g) => `<option value="${g.id}" ${g.id === datos?.grade_id ? 'selected' : ''}>${g.grade}</option>`).join('')}
                    </select>
                </div>
                <div>
                    <label class="label">Estado</label>
                    <select name="status_id" required class="input">
                        ${estados.map((s) => `<option value="${s.id}" ${s.id === datos?.status_id ? 'selected' : ''}>${s.status}</option>`).join('')}
                    </select>
                </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="label">Fecha de ingreso</label>
                    <input type="date" name="start_date" value="${datos?.start_date ? datos.start_date.substring(0, 10) : ''}" required class="input">
                </div>
                <div>
                    <label class="label">Fecha de egreso (si aplica)</label>
                    <input type="date" name="end_date" value="${datos?.end_date ? datos.end_date.substring(0, 10) : ''}" class="input">
                </div>
            </div>
        `;
    },

    async _abrirModalCrear() {
        const modalContainer = this._contenido.querySelector('#modal-container');
        const selectorBarrio = crearSelectorBarrio({ idPrefix: 'estudiante', localidades: this._catalogos.localidades });
        const { estados } = this._catalogos;

        modalContainer.innerHTML = `
            <div class="modal-overlay fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-navy-900/50 p-4 backdrop-blur-sm sm:items-center">
                <div class="modal-panel my-8 w-full max-w-lg rounded-2xl bg-white p-6 shadow-(--shadow-pop)" role="dialog" aria-modal="true" tabindex="-1">
                    <h2 class="mb-5 font-display text-xl font-bold text-navy-600">Nuevo estudiante</h2>
                    <form id="form-estudiante" class="space-y-4">
                        ${this._camposPersonales(null, selectorBarrio)}
                        <hr class="my-2 border-navy-100">
                        <div>
                            <label class="label">Estado</label>
                            <select name="status_id" required class="input">
                                ${estados.map((s) => `<option value="${s.id}">${s.status}</option>`).join('')}
                            </select>
                        </div>
                        <div>
                            <label class="label">Grado (opcional)</label>
                            <select name="grade_id" class="input">
                                <option value="">Egresado (sin grado)</option>
                                ${this._catalogos.grados.map((g) => `<option value="${g.id}">${g.grade}</option>`).join('')}
                            </select>
                        </div>
                        <div>
                            <label class="label">Fecha de ingreso</label>
                            <input type="date" name="start_date" required class="input">
                        </div>
                        <p class="rounded-xl bg-navy-50/60 px-3 py-2 text-xs text-ink-muted">
                            ${icon('lock', 'w-3.5 h-3.5 inline text-navy-400')} Las credenciales de acceso se asignan luego, desde la pestaña <span class="font-semibold text-navy-600">Acceso</span> al editar el estudiante.
                        </p>
                        <div id="form-error" class="hidden rounded-xl bg-red-50 p-3 text-sm text-red-600"></div>
                        <div class="flex justify-end gap-3 pt-2">
                            <button type="button" id="btn-cancelar" class="btn btn-ghost">Cancelar</button>
                            <button type="submit" class="btn btn-primary">
                                Crear estudiante
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        const modal = modalContainer.firstElementChild;
        await selectorBarrio.init(modal);

        const cerrarModal = () => (modalContainer.innerHTML = '');
        modal.querySelector('#btn-cancelar').addEventListener('click', cerrarModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) cerrarModal();
        });

        const form = modal.querySelector('#form-estudiante');
        const errorDiv = modal.querySelector('#form-error');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            errorDiv.classList.add('hidden');

            const data = Object.fromEntries(new FormData(form).entries());
            if (!data.grade_id) delete data.grade_id;
            // institution_id lo asigna el backend automáticamente según el
            // admin logueado (requireSameInstitutionOnCreate); no se envía aquí.

            try {
                await StudentService.crear(data);
                cerrarModal();
                this._mostrarMensaje('Estudiante creado');
                await this._cargarTabla();
            } catch (error) {
                const mensaje = error instanceof ApiError ? error.message : 'Error al crear el estudiante';
                errorDiv.textContent = mensaje;
                errorDiv.classList.remove('hidden');
            }
        });
    },

    async _abrirModalEditar(id) {
        const modalContainer = this._contenido.querySelector('#modal-container');

        let datos;
        try {
            datos = await StudentService.obtener(id);
        } catch (error) {
            this._mostrarMensaje('No se pudo cargar el estudiante', 'error');
            return;
        }

        const selectorBarrio = crearSelectorBarrio({ idPrefix: 'estudiante-edit', localidades: this._catalogos.localidades });

        const tieneAcceso = Boolean(datos.username);

        modalContainer.innerHTML = `
            <div class="modal-overlay fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-navy-900/50 p-4 backdrop-blur-sm sm:items-center">
                <div class="modal-panel my-8 w-full max-w-lg rounded-2xl bg-white p-6 shadow-(--shadow-pop)" role="dialog" aria-modal="true" tabindex="-1">
                    <h2 class="mb-5 font-display text-xl font-bold text-navy-600">Editar estudiante</h2>

                    <div class="mb-5 flex border-b border-navy-100">
                        <button type="button" id="tab-personal" class="-mb-px border-b-2 border-green-500 px-4 py-2 text-sm font-semibold text-green-600">Datos personales</button>
                        <button type="button" id="tab-academico" class="-mb-px border-b-2 border-transparent px-4 py-2 text-sm font-medium text-ink-muted">Perfil académico</button>
                        <button type="button" id="tab-acceso" class="-mb-px border-b-2 border-transparent px-4 py-2 text-sm font-medium text-ink-muted">Acceso</button>
                    </div>

                    <form id="form-personal" class="space-y-4">
                        ${this._camposPersonales(datos, selectorBarrio)}
                        <div id="error-personal" class="hidden rounded-xl bg-red-50 p-3 text-sm text-red-600"></div>
                        <div class="flex justify-end gap-3 pt-2">
                            <button type="button" id="btn-cancelar-1" class="btn btn-ghost">Cancelar</button>
                            <button type="submit" class="btn btn-primary">Guardar datos personales</button>
                        </div>
                    </form>

                    <form id="form-academico" class="hidden space-y-4">
                        ${this._camposAcademicos(datos)}
                        <div id="error-academico" class="hidden rounded-xl bg-red-50 p-3 text-sm text-red-600"></div>
                        <div class="flex justify-end gap-3 pt-2">
                            <button type="button" id="btn-cancelar-2" class="btn btn-ghost">Cancelar</button>
                            <button type="submit" class="btn btn-primary">Guardar perfil académico</button>
                        </div>
                    </form>

                    <form id="form-acceso" class="hidden space-y-4">
                        <div class="flex items-center gap-2 rounded-xl ${tieneAcceso ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'} px-3 py-2 text-sm">
                            ${icon(tieneAcceso ? 'checkCircle' : 'help', 'w-4 h-4 shrink-0')}
                            ${tieneAcceso ? 'Este estudiante ya tiene acceso.' : 'Este estudiante aún no tiene acceso. Asígnale usuario y contraseña.'}
                        </div>
                        <div>
                            <label class="label">Usuario</label>
                            <input name="username" value="${datos.username ?? ''}" class="input" autocomplete="off" placeholder="ej. correo o documento" ${tieneAcceso ? '' : 'required'}>
                        </div>
                        <div>
                            <label class="label">${tieneAcceso ? 'Nueva contraseña (dejar vacío para no cambiarla)' : 'Contraseña'}</label>
                            <input type="password" name="password" class="input" autocomplete="new-password" placeholder="••••••••" ${tieneAcceso ? '' : 'required'}>
                        </div>
                        <p class="text-xs text-ink-muted">Por seguridad, la contraseña actual no puede mostrarse. Si el estudiante la olvidó, escribe una nueva aquí para restablecerla.</p>
                        <div id="error-acceso" class="hidden rounded-xl bg-red-50 p-3 text-sm text-red-600"></div>
                        <div class="flex justify-end gap-3 pt-2">
                            <button type="button" id="btn-cancelar-3" class="btn btn-ghost">Cancelar</button>
                            <button type="submit" class="btn btn-primary">${tieneAcceso ? 'Guardar acceso' : 'Crear acceso'}</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        const modal = modalContainer.firstElementChild;
        await selectorBarrio.init(modal, datos.neighborhood_id);

        const cerrarModal = () => (modalContainer.innerHTML = '');
        modal.addEventListener('click', (e) => {
            if (e.target === modal) cerrarModal();
        });

        const formPersonal = modal.querySelector('#form-personal');
        const formAcademico = modal.querySelector('#form-academico');
        const formAcceso = modal.querySelector('#form-acceso');
        const tabs = {
            personal: { tab: modal.querySelector('#tab-personal'), form: formPersonal },
            academico: { tab: modal.querySelector('#tab-academico'), form: formAcademico },
            acceso: { tab: modal.querySelector('#tab-acceso'), form: formAcceso }
        };

        const mostrarTab = (activa) => {
            for (const [nombre, { tab, form }] of Object.entries(tabs)) {
                const es = nombre === activa;
                form.classList.toggle('hidden', !es);
                tab.className = `-mb-px px-4 py-2 text-sm ${es ? 'border-b-2 border-green-500 font-semibold text-green-600' : 'border-b-2 border-transparent font-medium text-ink-muted'}`;
            }
        };

        tabs.personal.tab.addEventListener('click', () => mostrarTab('personal'));
        tabs.academico.tab.addEventListener('click', () => mostrarTab('academico'));
        tabs.acceso.tab.addEventListener('click', () => mostrarTab('acceso'));
        modal.querySelector('#btn-cancelar-1').addEventListener('click', cerrarModal);
        modal.querySelector('#btn-cancelar-2').addEventListener('click', cerrarModal);
        modal.querySelector('#btn-cancelar-3').addEventListener('click', cerrarModal);

        formAcceso.addEventListener('submit', async (e) => {
            e.preventDefault();
            const errorDiv = modal.querySelector('#error-acceso');
            errorDiv.classList.add('hidden');
            const data = Object.fromEntries(new FormData(formAcceso).entries());
            const payload = {};
            if (data.username) payload.username = data.username;
            if (data.password) payload.password = data.password;

            try {
                await StudentService.gestionarCredenciales(id, payload);
                cerrarModal();
                this._mostrarMensaje('Credenciales actualizadas');
                await this._cargarTabla();
            } catch (error) {
                const mensaje = error instanceof ApiError ? error.message : 'Error al actualizar las credenciales';
                errorDiv.textContent = mensaje;
                errorDiv.classList.remove('hidden');
            }
        });

        formPersonal.addEventListener('submit', async (e) => {
            e.preventDefault();
            const errorDiv = modal.querySelector('#error-personal');
            errorDiv.classList.add('hidden');
            const data = Object.fromEntries(new FormData(formPersonal).entries());

            try {
                await StudentService.actualizarDatosPersonales(id, data);
                cerrarModal();
                this._mostrarMensaje('Datos personales actualizados');
                await this._cargarTabla();
            } catch (error) {
                const mensaje = error instanceof ApiError ? error.message : 'Error al actualizar datos personales';
                errorDiv.textContent = mensaje;
                errorDiv.classList.remove('hidden');
            }
        });

        formAcademico.addEventListener('submit', async (e) => {
            e.preventDefault();
            const errorDiv = modal.querySelector('#error-academico');
            errorDiv.classList.add('hidden');
            const data = Object.fromEntries(new FormData(formAcademico).entries());
            if (!data.grade_id) data.grade_id = null;
            if (!data.end_date) data.end_date = null;
            // institution_id se mantiene igual (no se edita institución desde
            // aquí; una transferencia entre instituciones queda fuera del MVP
            // según lo acordado, salvo que el superadmin lo permita a futuro).
            data.institution_id = datos.institution_id;

            try {
                await StudentService.actualizarPerfilAcademico(id, data);
                cerrarModal();
                this._mostrarMensaje('Perfil académico actualizado');
                await this._cargarTabla();
            } catch (error) {
                const mensaje = error instanceof ApiError ? error.message : 'Error al actualizar el perfil académico';
                errorDiv.textContent = mensaje;
                errorDiv.classList.remove('hidden');
            }
        });
    },

    async _confirmarEliminar(id) {
        const ok = await confirmDialog({
            titulo: 'Eliminar estudiante',
            mensaje: 'Esta acción no se puede deshacer.',
            confirmar: 'Eliminar',
            peligro: true
        });
        if (!ok) return;

        try {
            await StudentService.eliminar(id);
            this._mostrarMensaje('Estudiante eliminado');
            await this._cargarTabla();
        } catch (error) {
            const mensaje = error instanceof ApiError ? error.message : 'Error al eliminar el estudiante';
            this._mostrarMensaje(mensaje, 'error');
        }
    }
};

export default GestionEstudiantes;
