import { renderLayout } from './Layout.js';
import * as InstitutionService from '../services/institutionService.js';
import * as StudentService from '../services/studentService.js';
import * as CatalogService from '../services/catalogService.js';
import { crearSelectorBarrio } from '../components/SelectorBarrio.js';
import { ApiError } from '../modules/http.js';
import Router from '../modules/router.js';
import { icon } from '../components/icons.js';
import { vacio, iniciales, avatar, semaforoPill, modalOverlay, modalHeader } from '../components/ui.js';
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
                                <h1 class="font-display text-2xl font-bold leading-tight drop-shadow sm:text-3xl">${inst.institution_name}</h1>
                                <p class="flex items-center gap-1.5 text-sm text-navy-100">${icon('idCard', 'w-4 h-4')} DANE: ${inst.dane_code ?? '—'}</p>
                            </div>
                        </div>
                    </div>
                </section>

                <div class="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
                    <!-- Info + acciones -->
                    <div class="card lg:col-span-1">
                        <h2 class="mb-4 font-display text-lg font-semibold text-navy-600">Información</h2>
                        <div class="space-y-3 text-sm">
                            <div class="flex items-start gap-2"><span class="mt-0.5 text-navy-300">${icon('user', 'w-4 h-4')}</span><div><p class="text-xs text-ink-muted">Director</p><p class="font-medium text-navy-600">${inst.director || 'Sin asignar'}</p></div></div>
                            <div class="flex items-start gap-2"><span class="mt-0.5 text-navy-300">${icon('mapPin', 'w-4 h-4')}</span><div><p class="text-xs text-ink-muted">Dirección</p><p class="font-medium text-navy-600">${inst.address ?? '—'}</p></div></div>
                            <div class="flex items-start gap-2"><span class="mt-0.5 text-navy-300">${icon('users', 'w-4 h-4')}</span><div><p class="text-xs text-ink-muted">Estudiantes registrados</p><p class="font-medium text-navy-600">${estudiantes.length}</p></div></div>
                        </div>
                        <div class="mt-5 flex gap-2 border-t border-navy-50 pt-4">
                            <button id="btn-editar" class="btn btn-outline flex-1">${icon('pencil', 'w-4 h-4')} Editar</button>
                            <button id="btn-eliminar" class="btn btn-ghost text-red-500 hover:bg-red-50" aria-label="Eliminar">${icon('logout', 'w-4 h-4')}</button>
                        </div>
                    </div>

                    <!-- Estudiantes -->
                    <div class="lg:col-span-2">
                        <div class="mb-3 flex items-center gap-2">
                            <h2 class="flex items-center gap-2 font-display text-lg font-semibold text-navy-600">${icon('users', 'w-5 h-5 text-green-500')} Estudiantes</h2>
                            <span class="badge badge-navy">${estudiantes.length}</span>
                        </div>
                        <div id="lista-estudiantes"></div>
                    </div>
                </div>
                <div id="modal-container"></div>
            `;

            this._pintarEstudiantes(estudiantes);

            contenido.querySelector('#btn-editar').addEventListener('click', () => this._abrirModalEditar());
            contenido.querySelector('#btn-eliminar').addEventListener('click', () => this._confirmarEliminar());

            return renderLayout(contenido, {
                crumbs: [
                    { label: 'Instituciones', href: '/gestion-instituciones' },
                    { label: inst.institution_name }
                ]
            });
        } catch (error) {
            const mensaje = error instanceof ApiError ? error.message : 'No se pudo cargar la institución';
            contenido.innerHTML = `<div class="card text-red-500">${mensaje}</div>`;
            return renderLayout(contenido, { crumbs: [{ label: 'Instituciones', href: '/gestion-instituciones' }, { label: 'Detalle' }] });
        }
    },

    _pintarEstudiantes(estudiantes) {
        const cont = this._contenido.querySelector('#lista-estudiantes');
        if (estudiantes.length === 0) {
            cont.innerHTML = vacio('Esta institución aún no tiene estudiantes registrados.', 'users');
            return;
        }
        const nombreGrado = (id) => this._catalogos.grados.find((g) => g.id === id)?.grade ?? 'Sin grado';
        const nombreEstado = (id) => this._catalogos.estados.find((s) => s.id === id)?.status ?? '—';

        const filas = estudiantes.map((e) => `
            <tr class="border-t border-navy-50 hover:bg-navy-50/40 transition-colors">
                <td class="px-5 py-3.5">
                    <div class="flex items-center gap-3">
                        ${avatar(iniciales(e.first_name, e.last_name), e.people_id)}
                        <div class="min-w-0">
                            <p class="truncate font-medium text-navy-600">${e.first_name} ${e.last_name}</p>
                            <p class="truncate text-xs text-ink-muted">${nombreGrado(e.grade_id)} · ${nombreEstado(e.status_id)}</p>
                        </div>
                    </div>
                </td>
                <td class="px-5 py-3.5 text-right">${semaforoPill(e.ultima_actualizacion)}</td>
            </tr>`).join('');

        cont.innerHTML = `
            <div class="card p-0 overflow-hidden">
                <table class="w-full text-left">
                    <thead>
                        <tr class="text-xs uppercase tracking-wide text-ink-muted">
                            <th class="px-5 py-3 font-semibold">Estudiante</th>
                            <th class="px-5 py-3 text-right font-semibold">Última actualización</th>
                        </tr>
                    </thead>
                    <tbody>${filas}</tbody>
                </table>
            </div>`;
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
