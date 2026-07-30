import { renderLayout } from './Layout.js';
import * as InstitutionService from '../services/institutionService.js';
import * as StudentService from '../services/studentService.js';
import * as CatalogService from '../services/catalogService.js';
import { crearSelectorBarrio } from '../components/SelectorBarrio.js';
import { ApiError } from '../modules/http.js';
import Router from '../modules/router.js';
import { icon } from '../components/icons.js';
import { vacio, iniciales, avatar, semaforoPill, semaforoActualizacion, modalOverlay, modalHeader, abreviarInstitucion } from '../components/ui.js';
import { abrirFichaEstudiante } from '../components/FichaEstudiante.js';
import { toast } from '../components/toast.js';
import { confirmDialog } from '../components/confirm.js';

// Perfil de una institución (ruta /instituciones/:id, superadmin): banner +
// logo, datos, acciones (editar/eliminar) y lista de sus estudiantes con el
// semáforo de última actualización.
const InstitucionPerfil = {
    // params.id viene del router (ruta "/instituciones/:id").
    async render(params = {}) {
        const id = params.id;
        const contenido = document.createElement('div');
        this._contenido = contenido;
        this._id = id;

        contenido.innerHTML = `<div class="card h-64 animate-pulse bg-navy-50/50"></div>`;

        try {
            const [inst, estudiantes, grados, estados, localidades] = await Promise.all([
                InstitutionService.obtener(id),
                StudentService.listar({ institution_id: id }).catch(() => []),
                CatalogService.grados(),
                CatalogService.estados(),
                CatalogService.localidades()
            ]);

            this._inst = inst;
            this._catalogos = { grados, estados, localidades };

            const bannerStyle = inst.banner_url
                ? `background-image:linear-gradient(180deg, rgba(20,35,52,.35), rgba(20,35,52,.85)), url('${inst.banner_url}'); background-size:cover; background-position:center;`
                : '';

            contenido.innerHTML = `
                <!-- Banner + identidad -->
                <section class="relative mb-6 overflow-hidden rounded-2xl bg-navy-600" style="${bannerStyle}">
                    <div class="flex h-44 flex-col justify-end p-6 sm:h-52">
                        <div class="flex items-end gap-4">
                            <div class="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-white shadow-md">
                                ${inst.logo_url
                                    ? `<img src="${inst.logo_url}" alt="${inst.institution_name}" class="h-full w-full object-cover" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                                       <div style="display:none" class="flex h-full w-full items-center justify-center bg-navy-50 text-navy-400">${icon('school', 'w-8 h-8')}</div>`
                                    : `<div class="flex h-full w-full items-center justify-center bg-navy-50 text-navy-400">${icon('school', 'w-8 h-8')}</div>`}
                            </div>
                            <div class="min-w-0 pb-1 text-white">
                                <h1 class="font-display text-2xl font-bold leading-tight drop-shadow sm:text-3xl" title="${inst.institution_name}">${abreviarInstitucion(inst.institution_name)}</h1>
                                <p class="flex items-center gap-1.5 text-sm text-navy-100">${icon('idCard', 'w-4 h-4')} DANE: ${inst.dane_code ?? '—'}</p>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- Datos de la institución en franja horizontal, para dejar el
                     ancho completo a los estudiantes (es lo que más le interesa
                     revisar al superadmin al entrar aquí). -->
                <div class="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div class="card flex items-start gap-3 p-4">
                        <span class="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-navy-50 text-navy-500">${icon('user', 'w-4 h-4')}</span>
                        <div class="min-w-0"><p class="text-xs text-ink-muted">Director</p><p class="truncate font-medium text-navy-600" title="${inst.director || ''}">${inst.director || 'Sin asignar'}</p></div>
                    </div>
                    <div class="card flex items-start gap-3 p-4">
                        <span class="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-navy-50 text-navy-500">${icon('idCard', 'w-4 h-4')}</span>
                        <div class="min-w-0"><p class="text-xs text-ink-muted">Código DANE</p><p class="truncate font-medium text-navy-600">${inst.dane_code ?? '—'}</p></div>
                    </div>
                    <div class="card flex items-start gap-3 p-4">
                        <span class="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-navy-50 text-navy-500">${icon('mapPin', 'w-4 h-4')}</span>
                        <div class="min-w-0"><p class="text-xs text-ink-muted">Dirección</p><p class="truncate font-medium text-navy-600" title="${inst.address || ''}">${inst.address ?? '—'}</p></div>
                    </div>
                    <div class="card flex items-center gap-2 p-4">
                        <button id="btn-editar" class="btn btn-outline flex-1">${icon('pencil', 'w-4 h-4')} Editar</button>
                        <button id="btn-eliminar" class="btn btn-ghost text-red-500 hover:bg-red-50" aria-label="Eliminar institución">${icon('logout', 'w-4 h-4')}</button>
                    </div>
                </div>

                <!-- Estudiantes: ancho completo, con filtros -->
                <div class="mb-3 flex items-center gap-2">
                    <h2 class="flex items-center gap-2 font-display text-lg font-semibold text-navy-600">${icon('users', 'w-5 h-5 text-green-500')} Estudiantes</h2>
                    <span class="badge badge-navy">${estudiantes.length}</span>
                </div>
                <div class="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div class="relative flex-1">
                        <span class="pointer-events-none absolute inset-y-0 left-3 flex items-center text-navy-300">${icon('search', 'w-4 h-4')}</span>
                        <input id="buscar" class="input pl-9" placeholder="Buscar por nombre o documento...">
                    </div>
                    <select id="filtro-grado" class="select sm:w-44">
                        <option value="">Todos los cursos</option>
                        ${grados.map((g) => `<option value="${g.id}">${g.grade}</option>`).join('')}
                        <option value="__none__">Egresados</option>
                    </select>
                    <select id="filtro-estado" class="select sm:w-40">
                        <option value="">Todos los estados</option>
                        ${estados.map((s) => `<option value="${s.id}">${s.status}</option>`).join('')}
                    </select>
                    <select id="filtro-actualizacion" class="select sm:w-44">
                        <option value="">Actualización: todos</option>
                        <option value="actualizados">Actualizados</option>
                        <option value="pendientes">Pendientes</option>
                    </select>
                </div>
                <div id="lista-estudiantes"></div>
                <div id="modal-container"></div>
            `;

            this._estudiantes = estudiantes;
            this._filtros = { q: '', grade: '', status: '', actualizacion: '' };
            this._pintarEstudiantes();

            contenido.querySelector('#btn-editar').addEventListener('click', () => this._abrirModalEditar());
            contenido.querySelector('#btn-eliminar').addEventListener('click', () => this._confirmarEliminar());
            contenido.querySelector('#buscar').addEventListener('input', (e) => {
                this._filtros.q = e.target.value.toLowerCase();
                this._pintarEstudiantes();
            });
            contenido.querySelector('#filtro-grado').addEventListener('change', (e) => {
                this._filtros.grade = e.target.value;
                this._pintarEstudiantes();
            });
            contenido.querySelector('#filtro-estado').addEventListener('change', (e) => {
                this._filtros.status = e.target.value;
                this._pintarEstudiantes();
            });
            contenido.querySelector('#filtro-actualizacion').addEventListener('change', (e) => {
                this._filtros.actualizacion = e.target.value;
                this._pintarEstudiantes();
            });

            return renderLayout(contenido, {
                crumbs: [
                    { label: 'Instituciones', href: '/gestion-instituciones' },
                    { label: abreviarInstitucion(inst.institution_name) }
                ]
            });
        } catch (error) {
            const mensaje = error instanceof ApiError ? error.message : 'No se pudo cargar la institución';
            contenido.innerHTML = `<div class="card text-red-500">${mensaje}</div>`;
            return renderLayout(contenido, { crumbs: [{ label: 'Instituciones', href: '/gestion-instituciones' }, { label: 'Detalle' }] });
        }
    },

    // Lista de estudiantes de la institución: aplica los filtros, agrupa por
    // curso (mismo criterio y estructura de tabla que las demás vistas) y deja
    // abrir la ficha completa de cada uno.
    _pintarEstudiantes() {
        const cont = this._contenido.querySelector('#lista-estudiantes');
        const { grados, estados } = this._catalogos;
        const nombreGrado = (id) => grados.find((g) => g.id === id)?.grade ?? 'Sin grado';
        const nombreEstado = (id) => estados.find((s) => s.id === id)?.status ?? '—';
        const { q, grade, status, actualizacion } = this._filtros;

        const filtrados = this._estudiantes.filter((e) => {
            const nombre = `${e.first_name} ${e.last_name}`.toLowerCase();
            const coincideQ = !q || nombre.includes(q) || String(e.document_number).includes(q);
            const coincideGrado = !grade
                || (grade === '__none__' ? e.grade_id == null : String(e.grade_id) === grade);
            const coincideEstado = !status || String(e.status_id) === status;
            // Pendiente = semáforo rojo (desactualizado o nunca actualizado).
            const pendiente = semaforoActualizacion(e.ultima_actualizacion).clase === 'badge-red';
            const coincideActualizacion = !actualizacion
                || (actualizacion === 'pendientes' ? pendiente : !pendiente);
            return coincideQ && coincideGrado && coincideEstado && coincideActualizacion;
        });

        if (this._estudiantes.length === 0) {
            cont.innerHTML = vacio('Esta institución aún no tiene estudiantes registrados.', 'users');
            return;
        }
        if (filtrados.length === 0) {
            cont.innerHTML = vacio('No hay estudiantes que coincidan con los filtros.', 'users');
            return;
        }

        // Agrupa por curso; "Egresados / sin curso" queda al final.
        const grupos = new Map();
        for (const e of filtrados) {
            const key = e.grade_id ?? '__none__';
            if (!grupos.has(key)) grupos.set(key, []);
            grupos.get(key).push(e);
        }
        const ordenGrado = new Map(grados.map((g, i) => [g.id, i]));
        const claves = [...grupos.keys()].sort((a, b) => {
            if (a === '__none__') return 1;
            if (b === '__none__') return -1;
            return (ordenGrado.get(a) ?? 999) - (ordenGrado.get(b) ?? 999);
        });

        const fila = (e) => {
            const estado = nombreEstado(e.status_id);
            const nombre = `${e.first_name} ${e.last_name}`;
            return `
                <tr class="border-t border-navy-50 transition-colors hover:bg-navy-50/40">
                    <td class="px-5 py-3.5">
                        <div class="flex items-center gap-3">
                            ${avatar(iniciales(e.first_name, e.last_name), e.people_id)}
                            <div class="min-w-0">
                                <p class="truncate font-medium text-navy-600" title="${nombre}">${nombre}</p>
                                <p class="truncate text-xs text-ink-muted" title="${e.email ?? ''}">${e.email ?? '—'}</p>
                            </div>
                        </div>
                    </td>
                    <td class="truncate px-5 py-3.5 text-sm text-ink-soft">${e.document_number}</td>
                    <td class="px-5 py-3.5">${semaforoPill(e.ultima_actualizacion)}</td>
                    <td class="px-5 py-3.5"><span class="badge ${estado.toUpperCase() === 'EGRESADO' ? 'badge-navy' : 'badge-green'}">${estado}</span></td>
                    <td class="whitespace-nowrap px-5 py-3.5 text-right">
                        <button class="btn-ver-perfil btn btn-outline" data-id="${e.people_id}">${icon('eye', 'w-4 h-4')} Ver perfil</button>
                    </td>
                </tr>`;
        };

        cont.innerHTML = claves.map((key) => {
            const titulo = key === '__none__' ? 'Egresados / sin curso' : nombreGrado(key);
            const alumnos = grupos.get(key);
            return `
                <div class="card mb-4 p-0 overflow-hidden">
                    <div class="flex items-center gap-2 bg-navy-50/50 px-5 py-2.5">
                        ${icon('gradCap', 'w-4 h-4 text-green-500')}
                        <span class="font-display text-sm font-semibold text-navy-600">${titulo}</span>
                        <span class="badge badge-navy ml-auto">${alumnos.length}</span>
                    </div>
                    <div class="overflow-x-auto">
                        <!-- table-fixed: mantiene las columnas alineadas entre cursos. -->
                        <table class="w-full min-w-3xl table-fixed text-left">
                            <thead>
                                <tr class="text-xs uppercase tracking-wide text-ink-muted">
                                    <th class="w-[30%] px-5 py-2.5 font-semibold">Estudiante</th>
                                    <th class="w-[14%] px-5 py-2.5 font-semibold">Documento</th>
                                    <th class="w-[18%] px-5 py-2.5 font-semibold">Última actualización</th>
                                    <th class="w-[14%] px-5 py-2.5 font-semibold">Estado</th>
                                    <th class="w-[24%] px-5 py-2.5 text-right font-semibold">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>${alumnos.map(fila).join('')}</tbody>
                        </table>
                    </div>
                </div>`;
        }).join('');

        // Ficha completa del estudiante (componente compartido con campañas).
        const modalContainer = this._contenido.querySelector('#modal-container');
        cont.querySelectorAll('.btn-ver-perfil').forEach((btn) =>
            btn.addEventListener('click', () =>
                abrirFichaEstudiante(btn.dataset.id, { modalContainer, catalogos: this._catalogos })
            )
        );
    },

    async _abrirModalEditar() {
        const inst = this._inst;
        const modalContainer = this._contenido.querySelector('#modal-container');
        const selectorBarrio = crearSelectorBarrio({ idPrefix: 'inst-perfil', localidades: this._catalogos.localidades });
        const val = (v) => (v ?? '');

        modalContainer.innerHTML = modalOverlay(`
            ${modalHeader('Editar institución')}
            <form id="form-institucion" class="space-y-4">
                <div><label class="label">Nombre</label><input name="institution_name" value="${val(inst.institution_name)}" required class="input"></div>
                <div><label class="label">Director</label><input name="director" value="${val(inst.director)}" required class="input"></div>
                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div><label class="label">Código DANE</label><input name="dane_code" value="${val(inst.dane_code)}" required class="input"></div>
                    <div><label class="label">Dirección</label><input name="address" value="${val(inst.address)}" class="input"></div>
                </div>
                ${selectorBarrio.html}
                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div><label class="label">Logo (URL)</label><input name="logo_url" value="${val(inst.logo_url)}" class="input" placeholder="https://..."></div>
                    <div><label class="label">Banner (URL)</label><input name="banner_url" value="${val(inst.banner_url)}" class="input" placeholder="https://..."></div>
                </div>
                <div id="form-error" class="hidden rounded-xl bg-red-50 p-3 text-sm text-red-600"></div>
                <div class="flex justify-end gap-3 pt-2">
                    <button type="button" id="btn-cancelar" class="btn btn-ghost">Cancelar</button>
                    <button type="submit" class="btn btn-primary">Guardar cambios</button>
                </div>
            </form>
        `, 'max-w-lg');

        const modal = modalContainer.firstElementChild;
        await selectorBarrio.init(modal, inst.neighborhood_id ?? null);

        const cerrar = () => (modalContainer.innerHTML = '');
        modal.querySelector('#btn-cancelar').addEventListener('click', cerrar);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) cerrar();
        });

        const form = modal.querySelector('#form-institucion');
        const errorDiv = modal.querySelector('#form-error');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            errorDiv.classList.add('hidden');
            const data = Object.fromEntries(new FormData(form).entries());
            if (!data.logo_url) data.logo_url = null;
            if (!data.banner_url) data.banner_url = null;

            try {
                await InstitutionService.actualizar(this._id, data);
                toast('Institución actualizada');
                cerrar();
                // Re-render de la vista para reflejar banner/logo/datos.
                Router.navigate(`/instituciones/${this._id}`);
            } catch (error) {
                const mensaje = error instanceof ApiError ? error.message : 'Error al guardar';
                errorDiv.textContent = mensaje;
                errorDiv.classList.remove('hidden');
            }
        });
    },

    async _confirmarEliminar() {
        const ok = await confirmDialog({
            titulo: 'Eliminar institución',
            mensaje: 'Esta acción no se puede deshacer.',
            confirmar: 'Eliminar',
            peligro: true
        });
        if (!ok) return;
        try {
            await InstitutionService.eliminar(this._id);
            toast('Institución eliminada');
            Router.navigate('/gestion-instituciones');
        } catch (error) {
            toast(error instanceof ApiError ? error.message : 'Error al eliminar', 'error');
        }
    }
};

export default InstitucionPerfil;
