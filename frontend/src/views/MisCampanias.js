import { renderLayout } from './Layout.js';
import * as CampaignService from '../services/campaignService.js';
import * as StudentService from '../services/studentService.js';
import * as CatalogService from '../services/catalogService.js';
import { ApiError } from '../modules/http.js';
import { icon } from '../components/icons.js';
import { encabezado, campaignCard, vacio, modalOverlay, modalHeader, skeletonCards } from '../components/ui.js';
import { toast } from '../components/toast.js';

// Vista del estudiante: sus campañas activas elegibles. Cada tarjeta indica
// si ya actualizó, y abre un modal para actualizar sus datos dentro de la
// campaña.
const MisCampanias = {
    async render() {
        const contenido = document.createElement('div');
        contenido.innerHTML = `
            ${encabezado({
                titulo: 'Mis campañas',
                subtitulo: 'Estas son las campañas de actualización de datos activas para ti.'
            })}
            <div id="lista-campanias" class="grid grid-cols-1 gap-4 sm:grid-cols-2"></div>
            <div id="modal-container"></div>
        `;

        this._contenido = contenido;
        this._campanias = [];
        // Sin await: el shell (con skeleton) se muestra de inmediato; los datos llegan después.
        this._cargarLista();

        return renderLayout(contenido);
    },

    async _cargarLista() {
        const lista = this._contenido.querySelector('#lista-campanias');
        lista.innerHTML = skeletonCards(4, 'h-56');
        try {
            this._campanias = await CampaignService.misCampanias();
            this._pintarLista();
        } catch (error) {
            const mensaje = error instanceof ApiError ? error.message : 'Error al cargar tus campañas';
            lista.className = '';
            lista.innerHTML = `<div class="card text-red-500">${mensaje}</div>`;
        }
    },

    _pintarLista() {
        const lista = this._contenido.querySelector('#lista-campanias');

        if (this._campanias.length === 0) {
            lista.className = '';
            lista.innerHTML = vacio('No tienes campañas activas por el momento.', 'megaphone');
            return;
        }

        lista.className = 'grid grid-cols-1 gap-4 sm:grid-cols-2';
        lista.innerHTML = this._campanias
            .map((c) => {
                const acciones = c.actualizada
                    ? `<span class="badge badge-green">${icon('checkCircle', 'w-4 h-4')} Actualizado</span>
                       <button data-campaign-id="${c.id}" class="btn-actualizar btn btn-ghost ml-auto text-sm text-green-600 hover:bg-green-50">Actualizar de nuevo</button>`
                    : `<button data-campaign-id="${c.id}" class="btn-actualizar btn btn-accent w-full">${icon('pencil', 'w-4 h-4')} Actualizar mis datos</button>`;
                return campaignCard(c, { acciones });
            })
            .join('');

        lista.querySelectorAll('.btn-actualizar').forEach((btn) =>
            btn.addEventListener('click', () => {
                const c = this._campanias.find((x) => String(x.id) === btn.dataset.campaignId);
                this._abrirModal(c);
            })
        );
    },

    _mostrarMensaje(texto, tipo = 'success') {
        toast(texto, tipo);
    },

    async _abrirModal(campania) {
        const modalContainer = this._contenido.querySelector('#modal-container');
        modalContainer.innerHTML = modalOverlay(
            `<div class="py-10 text-center text-ink-muted">Cargando tu información...</div>`,
            'max-w-2xl'
        );

        try {
            const [misDatos, generos, tiposDocumento, localidades] = await Promise.all([
                StudentService.obtenerMisDatos(),
                CatalogService.generos(),
                CatalogService.tiposDocumento(),
                CatalogService.localidades()
            ]);

            modalContainer.innerHTML = modalOverlay(`
                ${modalHeader('Actualizar mis datos', `Campaña: <span class="font-semibold text-navy-600">${campania.title}</span>`)}
                <form id="form-actualizacion" class="space-y-4">
                    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div><label class="label">Nombres</label><input name="first_name" value="${misDatos.first_name ?? ''}" required class="input"></div>
                        <div><label class="label">Apellidos</label><input name="last_name" value="${misDatos.last_name ?? ''}" required class="input"></div>
                    </div>
                    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <label class="label">Género</label>
                            <select name="gender_id" required class="select">
                                ${generos.map((g) => `<option value="${g.id}" ${g.id === misDatos.gender_id ? 'selected' : ''}>${g.name}</option>`).join('')}
                            </select>
                        </div>
                        <div><label class="label">Fecha de nacimiento</label><input type="date" name="birth_date" value="${misDatos.birth_date ? misDatos.birth_date.substring(0, 10) : ''}" required class="input"></div>
                    </div>
                    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div><label class="label">Email</label><input type="email" name="email" value="${misDatos.email ?? ''}" required class="input"></div>
                        <div><label class="label">Teléfono</label><input name="phone" value="${misDatos.phone ?? ''}" class="input"></div>
                    </div>
                    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <label class="label">Tipo de documento</label>
                            <select name="document_type_id" required class="select">
                                ${tiposDocumento.map((t) => `<option value="${t.id}" ${t.id === misDatos.document_type_id ? 'selected' : ''}>${t.abbreviation}</option>`).join('')}
                            </select>
                        </div>
                        <div><label class="label">Número de documento</label><input name="document_number" value="${misDatos.document_number ?? ''}" required class="input"></div>
                    </div>
                    <div><label class="label">Dirección</label><input name="address" value="${misDatos.address ?? ''}" class="input"></div>
                    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <label class="label">Localidad</label>
                            <select class="select" id="select-localidad">
                                <option value="">Selecciona una localidad</option>
                                ${localidades.map((l) => `<option value="${l.id}">${l.name}</option>`).join('')}
                            </select>
                        </div>
                        <div>
                            <label class="label">Barrio</label>
                            <select name="neighborhood_id" required class="select" id="select-barrio">
                                <option value="">Selecciona una localidad primero</option>
                            </select>
                        </div>
                    </div>

                    <div id="form-error" class="hidden rounded-xl bg-red-50 p-3 text-sm text-red-600"></div>
                    <div class="flex justify-end gap-3 pt-2">
                        <button type="button" id="btn-cancelar" class="btn btn-ghost">Cancelar</button>
                        <button type="submit" class="btn btn-accent">${icon('check', 'w-4 h-4')} Guardar actualización</button>
                    </div>
                </form>
            `, 'max-w-2xl');

            const modal = modalContainer.firstElementChild;
            const cerrarModal = () => (modalContainer.innerHTML = '');
            modal.querySelector('#btn-cancelar').addEventListener('click', cerrarModal);
            modal.addEventListener('click', (e) => {
                if (e.target === modal) cerrarModal();
            });

            // Selector encadenado localidad -> barrio (preselecciona el barrio actual).
            const selectLocalidad = modal.querySelector('#select-localidad');
            const selectBarrio = modal.querySelector('#select-barrio');
            const cargarBarrios = async (localityId, seleccionado = null) => {
                const barrios = await CatalogService.barrios(localityId);
                selectBarrio.innerHTML = barrios
                    .map((b) => `<option value="${b.id}" ${b.id === seleccionado ? 'selected' : ''}>${b.name}</option>`)
                    .join('');
            };
            selectLocalidad.addEventListener('change', () => cargarBarrios(selectLocalidad.value));
            if (misDatos.neighborhood_id) {
                const todos = await CatalogService.barrios();
                const actual = todos.find((b) => b.id === misDatos.neighborhood_id);
                if (actual) {
                    selectLocalidad.value = actual.locality_id;
                    await cargarBarrios(actual.locality_id, misDatos.neighborhood_id);
                }
            }

            const form = modal.querySelector('#form-actualizacion');
            const errorDiv = modal.querySelector('#form-error');

            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                errorDiv.classList.add('hidden');
                const data = Object.fromEntries(new FormData(form).entries());

                try {
                    await CampaignService.actualizarMisDatosEnCampania(campania.id, data);
                    // Marca la campaña como actualizada y refresca la card.
                    const c = this._campanias.find((x) => x.id === campania.id);
                    if (c) c.actualizada = true;
                    cerrarModal();
                    this._pintarLista();
                    this._mostrarMensaje('¡Listo! Tus datos se actualizaron correctamente.');
                } catch (error) {
                    const mensaje = error instanceof ApiError ? error.message : 'Error al actualizar tus datos';
                    errorDiv.textContent = mensaje;
                    errorDiv.classList.remove('hidden');
                }
            });
        } catch (error) {
            const mensaje = error instanceof ApiError ? error.message : 'Error al cargar el formulario';
            modalContainer.innerHTML = '';
            this._mostrarMensaje(mensaje, 'error');
        }
    }
};

export default MisCampanias;
