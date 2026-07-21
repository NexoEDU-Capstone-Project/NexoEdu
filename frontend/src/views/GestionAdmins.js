import { renderLayout } from './Layout.js';
import * as AdminService from '../services/adminService.js';
import * as InstitutionService from '../services/institutionService.js';
import { ApiError } from '../modules/http.js';
import { icon } from '../components/icons.js';
import { encabezado, modalOverlay, modalHeader, vacio, iniciales, avatar, paginacion, skeletonTabla } from '../components/ui.js';
import { toast } from '../components/toast.js';
import { confirmDialog } from '../components/confirm.js';

// Gestión de administradores institucionales (superadmin): tabla con búsqueda
// por institución, filtro de asignación y paginación. Permite crear, reasignar
// institución y eliminar.
const GestionAdmins = {
    async render() {
        const contenido = document.createElement('div');
        this._contenido = contenido;
        this._admins = [];
        this._filtro = '';
        this._filtroAsignacion = '';
        this._page = 1;

        contenido.innerHTML = `
            ${encabezado({
                titulo: 'Administradores',
                subtitulo: 'Gestiona los directores institucionales y su institución asignada.',
                acciones: `<button id="btn-nuevo" class="btn btn-primary">${icon('plus', 'w-4 h-4')} Nuevo administrador</button>`
            })}
            <div class="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
                <div class="relative flex-1">
                    <span class="pointer-events-none absolute inset-y-0 left-3 flex items-center text-navy-300">${icon('search', 'w-4 h-4')}</span>
                    <input id="buscar" class="input pl-9" placeholder="Buscar por institución...">
                </div>
                <select id="filtro-asignacion" class="select sm:w-52">
                    <option value="">Todos</option>
                    <option value="asignado">Con institución</option>
                    <option value="sin">Sin asignar</option>
                </select>
            </div>
            <div id="tabla-container" class="card p-0 overflow-hidden"></div>
            <div id="paginacion"></div>
            <div id="modal-container"></div>
        `;

        // Sin await: el shell (con skeleton) se muestra de inmediato; los datos llegan después.
        this._cargarTabla();

        contenido.querySelector('#btn-nuevo').addEventListener('click', () => this._abrirModal());
        contenido.querySelector('#buscar').addEventListener('input', (e) => {
            this._filtro = e.target.value.toLowerCase();
            this._page = 1;
            this._pintar();
        });
        contenido.querySelector('#filtro-asignacion').addEventListener('change', (e) => {
            this._filtroAsignacion = e.target.value;
            this._page = 1;
            this._pintar();
        });

        return renderLayout(contenido);
    },

    async _cargarTabla() {
        const tablaContainer = this._contenido.querySelector('#tabla-container');
        tablaContainer.innerHTML = skeletonTabla(6);
        try {
            this._admins = await AdminService.listar();
            this._pintar();
        } catch (error) {
            const mensaje = error instanceof ApiError ? error.message : 'Error al cargar administradores';
            tablaContainer.innerHTML = `<div class="p-6 text-red-500">${mensaje}</div>`;
        }
    },

    _pintar() {
        const tablaContainer = this._contenido.querySelector('#tabla-container');
        const pagCont = this._contenido.querySelector('#paginacion');
        const { _filtro: q, _filtroAsignacion: asig } = this;

        const filtrados = this._admins.filter((a) => {
            const coincideQ = !q || (a.institution_name || '').toLowerCase().includes(q);
            const asignado = Boolean(a.institution_name);
            const coincideAsig = !asig || (asig === 'asignado' ? asignado : !asignado);
            return coincideQ && coincideAsig;
        });

        if (filtrados.length === 0) {
            tablaContainer.innerHTML = `<div class="p-6">${vacio('No hay administradores que coincidan.', 'users')}</div>`;
            pagCont.innerHTML = '';
            return;
        }

        const pag = paginacion({ total: filtrados.length, page: this._page, perPage: 10, label: 'administradores' });
        this._page = pag.page;
        const visibles = filtrados.slice(pag.sliceStart, pag.sliceEnd);

        const filas = visibles.map((a) => `
            <tr class="border-t border-navy-50 hover:bg-navy-50/40 transition-colors">
                <td class="px-5 py-3.5">
                    <div class="flex items-center gap-3">
                        ${avatar(iniciales(a.username), a.credential_id)}
                        <p class="font-medium text-navy-600">${a.username}</p>
                    </div>
                </td>
                <td class="px-5 py-3.5">
                    ${a.institution_name
                        ? `<span class="badge badge-green">${a.institution_name}</span>`
                        : `<span class="badge badge-yellow">Sin asignar</span>`}
                </td>
                <td class="px-5 py-3.5">
                    <div class="flex items-center justify-end gap-2">
                        <button class="btn-reasignar btn btn-outline" data-id="${a.credential_id}">${icon('refresh', 'w-4 h-4')} Reasignar</button>
                        <button class="btn-eliminar btn btn-ghost text-red-500 hover:bg-red-50" data-id="${a.credential_id}" aria-label="Eliminar">${icon('logout', 'w-4 h-4')}</button>
                    </div>
                </td>
            </tr>`).join('');

        tablaContainer.innerHTML = `
            <table class="w-full text-left">
                <thead>
                    <tr class="text-xs uppercase tracking-wide text-ink-muted">
                        <th class="px-5 py-3 font-semibold">Usuario</th>
                        <th class="px-5 py-3 font-semibold">Institución asignada</th>
                        <th class="px-5 py-3 text-right font-semibold">Acciones</th>
                    </tr>
                </thead>
                <tbody>${filas}</tbody>
            </table>`;
        pagCont.innerHTML = pag.html;

        tablaContainer.querySelectorAll('.btn-reasignar').forEach((btn) =>
            btn.addEventListener('click', () => this._abrirModalReasignar(btn.dataset.id))
        );
        tablaContainer.querySelectorAll('.btn-eliminar').forEach((btn) =>
            btn.addEventListener('click', () => this._confirmarEliminar(btn.dataset.id))
        );
        pagCont.querySelectorAll('[data-page]').forEach((btn) =>
            btn.addEventListener('click', () => {
                this._page = Number(btn.dataset.page);
                this._pintar();
            })
        );
    },

    _mostrarMensaje(texto, tipo = 'success') {
        toast(texto, tipo);
    },

    async _abrirModal() {
        const modalContainer = this._contenido.querySelector('#modal-container');
        const instituciones = await InstitutionService.listar();

        modalContainer.innerHTML = modalOverlay(`
            ${modalHeader('Nuevo administrador')}
            <form id="form-admin" class="space-y-4">
                <div>
                    <label class="label">Usuario</label>
                    <input name="username" required class="input" placeholder="correo o usuario">
                </div>
                <div>
                    <label class="label">Contraseña</label>
                    <input type="password" name="password" required class="input" placeholder="••••••••">
                </div>
                <div>
                    <label class="label">Institución (opcional)</label>
                    <select name="institution_id" class="select">
                        <option value="">Sin asignar por ahora</option>
                        ${instituciones.map((i) => `<option value="${i.id}">${i.institution_name}</option>`).join('')}
                    </select>
                </div>
                <div id="form-error" class="hidden rounded-xl bg-red-50 p-3 text-sm text-red-600"></div>
                <div class="flex justify-end gap-3 pt-2">
                    <button type="button" id="btn-cancelar" class="btn btn-ghost">Cancelar</button>
                    <button type="submit" class="btn btn-primary">Crear administrador</button>
                </div>
            </form>
        `);

        const modal = modalContainer.firstElementChild;
        const cerrarModal = () => (modalContainer.innerHTML = '');
        modal.querySelector('#btn-cancelar').addEventListener('click', cerrarModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) cerrarModal();
        });

        const form = modal.querySelector('#form-admin');
        const errorDiv = modal.querySelector('#form-error');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            errorDiv.classList.add('hidden');

            const data = Object.fromEntries(new FormData(form).entries());
            if (!data.institution_id) delete data.institution_id;

            try {
                await AdminService.crear(data);
                cerrarModal();
                this._mostrarMensaje('Administrador creado');
                await this._cargarTabla();
            } catch (error) {
                const mensaje = error instanceof ApiError ? error.message : 'Error al crear el administrador';
                errorDiv.textContent = mensaje;
                errorDiv.classList.remove('hidden');
            }
        });
    },

    async _abrirModalReasignar(credentialId) {
        const modalContainer = this._contenido.querySelector('#modal-container');
        const instituciones = await InstitutionService.listar();

        modalContainer.innerHTML = modalOverlay(`
            ${modalHeader('Reasignar institución')}
            <form id="form-reasignar" class="space-y-4">
                <div>
                    <label class="label">Nueva institución</label>
                    <select name="institution_id" required class="select">
                        <option value="">Selecciona una institución</option>
                        ${instituciones.map((i) => `<option value="${i.id}">${i.institution_name}</option>`).join('')}
                    </select>
                </div>
                <div id="form-error" class="hidden rounded-xl bg-red-50 p-3 text-sm text-red-600"></div>
                <div class="flex justify-end gap-3 pt-2">
                    <button type="button" id="btn-cancelar" class="btn btn-ghost">Cancelar</button>
                    <button type="submit" class="btn btn-primary">Asignar</button>
                </div>
            </form>
        `);

        const modal = modalContainer.firstElementChild;
        const cerrarModal = () => (modalContainer.innerHTML = '');
        modal.querySelector('#btn-cancelar').addEventListener('click', cerrarModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) cerrarModal();
        });

        const form = modal.querySelector('#form-reasignar');
        const errorDiv = modal.querySelector('#form-error');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            errorDiv.classList.add('hidden');
            const data = Object.fromEntries(new FormData(form).entries());

            try {
                await AdminService.asignarInstitucion(credentialId, data.institution_id);
                cerrarModal();
                this._mostrarMensaje('Institución reasignada');
                await this._cargarTabla();
            } catch (error) {
                const mensaje = error instanceof ApiError ? error.message : 'Error al reasignar la institución';
                errorDiv.textContent = mensaje;
                errorDiv.classList.remove('hidden');
            }
        });
    },

    async _confirmarEliminar(id) {
        const ok = await confirmDialog({
            titulo: 'Eliminar administrador',
            mensaje: 'Esta acción no se puede deshacer.',
            confirmar: 'Eliminar',
            peligro: true
        });
        if (!ok) return;

        try {
            await AdminService.eliminar(id);
            this._mostrarMensaje('Administrador eliminado');
            await this._cargarTabla();
        } catch (error) {
            const mensaje = error instanceof ApiError ? error.message : 'Error al eliminar el administrador';
            this._mostrarMensaje(mensaje, 'error');
        }
    }
};

export default GestionAdmins;
