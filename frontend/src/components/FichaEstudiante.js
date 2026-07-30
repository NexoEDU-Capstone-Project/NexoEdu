// Ficha completa de un estudiante, en modal. Es autocontenida: recibe el id y
// se encarga de traer los datos y los catálogos que necesita para mostrar
// nombres legibles (género, tipo de documento, grado, estado, barrio) en vez de
// ids. Se reutiliza desde el perfil de institución, el detalle de campaña y la
// gestión de estudiantes, para que la información se vea igual en todos lados.
import * as StudentService from '../services/studentService.js';
import * as CatalogService from '../services/catalogService.js';
import * as InstitutionService from '../services/institutionService.js';
import { ApiError } from '../modules/http.js';
import { icon } from './icons.js';
import {
    modalOverlay, iniciales, formatearFecha, semaforoActualizacion, abreviarInstitucion
} from './ui.js';

// Edad a partir de la fecha de nacimiento (null si no hay fecha válida).
function calcularEdad(iso) {
    if (!iso) return null;
    const nacimiento = new Date(iso);
    if (Number.isNaN(nacimiento.getTime())) return null;
    const hoy = new Date();
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) edad--;
    return edad;
}

// Fila de dato: ícono + etiqueta + valor. `valor` puede venir vacío -> '—'.
function dato(label, valor, iconName) {
    return `
        <div class="flex items-start gap-3">
            <span class="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-navy-50 text-navy-400">${icon(iconName, 'w-4 h-4')}</span>
            <div class="min-w-0">
                <p class="text-xs text-ink-muted">${label}</p>
                <p class="truncate font-medium text-navy-600" title="${valor || ''}">${valor || '—'}</p>
            </div>
        </div>`;
}

function seccion(titulo, iconName, contenidoHtml) {
    return `
        <div>
            <h3 class="mb-3 flex items-center gap-2 font-display text-sm font-semibold text-navy-600">
                ${icon(iconName, 'w-4 h-4 text-green-500')} ${titulo}
            </h3>
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">${contenidoHtml}</div>
        </div>`;
}

/**
 * Abre la ficha del estudiante en un modal.
 *
 * @param {number|string} peopleId  id de la persona (people_id)
 * @param {object} opciones
 *   - modalContainer: elemento donde se inyecta el modal (obligatorio)
 *   - catalogos: { generos, tiposDocumento, grados, estados } ya cargados
 *     (opcional; lo que falte se pide a la API)
 */
export async function abrirFichaEstudiante(peopleId, { modalContainer, catalogos = {} } = {}) {
    if (!modalContainer) return;

    // Estado de carga inmediato: el modal aparece ya, los datos llegan después.
    modalContainer.innerHTML = modalOverlay(`
        <div class="space-y-4">
            <div class="h-24 animate-pulse rounded-2xl bg-navy-50/60"></div>
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                ${Array(4).fill('<div class="h-12 animate-pulse rounded-xl bg-navy-50/50"></div>').join('')}
            </div>
        </div>
    `, 'max-w-2xl');

    const cerrar = () => (modalContainer.innerHTML = '');

    try {
        // Solo se piden los catálogos que no vengan ya cargados desde la vista.
        const [datos, generos, tiposDocumento, grados, estados, barrios] = await Promise.all([
            StudentService.obtener(peopleId),
            catalogos.generos ?? CatalogService.generos().catch(() => []),
            catalogos.tiposDocumento ?? CatalogService.tiposDocumento().catch(() => []),
            catalogos.grados ?? CatalogService.grados().catch(() => []),
            catalogos.estados ?? CatalogService.estados().catch(() => []),
            CatalogService.barrios().catch(() => [])
        ]);

        // La institución se resuelve aparte (no siempre la conoce quien abre la ficha).
        let institucion = '—';
        if (datos.institution_id) {
            try {
                const inst = await InstitutionService.obtener(datos.institution_id);
                institucion = abreviarInstitucion(inst.institution_name);
            } catch {
                // Si falla, se deja el guion: no vale la pena romper toda la ficha.
            }
        }

        const nombre = `${datos.first_name ?? ''} ${datos.last_name ?? ''}`.trim();
        const genero = generos.find((g) => g.id === datos.gender_id)?.name ?? '—';
        const tipoDoc = tiposDocumento.find((t) => t.id === datos.document_type_id);
        const grado = grados.find((g) => g.id === datos.grade_id)?.grade ?? 'Egresado / sin grado';
        const estado = estados.find((s) => s.id === datos.status_id)?.status ?? '—';
        const barrio = barrios.find((b) => b.id === datos.neighborhood_id)?.name ?? '—';
        const edad = calcularEdad(datos.birth_date);
        const esEgresado = estado.toUpperCase() === 'EGRESADO';
        const sem = semaforoActualizacion(datos.ultima_actualizacion);

        modalContainer.innerHTML = modalOverlay(`
            <!-- Cabecera: identidad del estudiante + semáforo de vigencia -->
            <div class="-mx-6 -mt-6 mb-5 rounded-t-2xl bg-navy-600 px-6 py-5">
                <div class="flex items-center gap-4">
                    <span class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-yellow-400 font-display text-xl font-bold text-navy-700">
                        ${iniciales(datos.first_name, datos.last_name)}
                    </span>
                    <div class="min-w-0 flex-1">
                        <h2 class="truncate font-display text-xl font-bold text-white" title="${nombre}">${nombre}</h2>
                        <div class="mt-1.5 flex flex-wrap items-center gap-1.5">
                            <span class="badge ${esEgresado ? 'badge-yellow' : 'badge-green'}">${estado}</span>
                            <span class="badge badge-navy">${grado}</span>
                        </div>
                    </div>
                </div>
                <div class="mt-4 flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2">
                    <span class="h-2.5 w-2.5 shrink-0 rounded-full ${sem.dot}"></span>
                    <p class="text-xs text-white">
                        Última actualización: <span class="font-semibold">${sem.label}</span>
                        <span class="text-navy-100">· ${sem.fecha}${sem.dias !== null ? ` (hace ${sem.dias} días)` : ''}</span>
                    </p>
                </div>
            </div>

            <div class="max-h-[60vh] space-y-6 overflow-y-auto pr-1">
                ${seccion('Datos personales', 'user', `
                    ${dato('Documento', `${tipoDoc?.abbreviation ?? ''} ${datos.document_number ?? ''}`.trim(), 'idCard')}
                    ${dato('Género', genero, 'user')}
                    ${dato('Fecha de nacimiento', formatearFecha(datos.birth_date), 'calendar')}
                    ${dato('Edad', edad !== null ? `${edad} años` : '—', 'clock')}
                `)}

                ${seccion('Contacto', 'mail', `
                    ${dato('Email', datos.email, 'mail')}
                    ${dato('Teléfono', datos.phone, 'idCard')}
                    ${dato('Dirección', datos.address, 'mapPin')}
                    ${dato('Barrio', barrio, 'home')}
                `)}

                ${seccion('Información académica', 'gradCap', `
                    ${dato('Institución', institucion, 'school')}
                    ${dato('Grado', grado, 'gradCap')}
                    ${dato('Fecha de ingreso', formatearFecha(datos.start_date), 'calendar')}
                    ${dato('Fecha de egreso', datos.end_date ? formatearFecha(datos.end_date) : 'En curso', 'checkCircle')}
                `)}

                ${seccion('Acceso al sistema', 'lock', `
                    ${dato('Usuario', datos.username, 'user')}
                    ${dato('Credencial', datos.credential_id ? 'Activa' : 'Sin credencial', 'lock')}
                `)}
            </div>

            <div class="mt-5 flex justify-end border-t border-navy-50 pt-4">
                <button type="button" id="btn-cerrar-ficha" class="btn btn-primary">Cerrar</button>
            </div>
        `, 'max-w-2xl');

        const modal = modalContainer.firstElementChild;
        modal.querySelector('#btn-cerrar-ficha').addEventListener('click', cerrar);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) cerrar();
        });
    } catch (error) {
        const mensaje = error instanceof ApiError ? error.message : 'No se pudo cargar la información del estudiante';
        modalContainer.innerHTML = modalOverlay(`
            <p class="text-red-500">${mensaje}</p>
            <div class="mt-4 flex justify-end">
                <button type="button" id="btn-cerrar-ficha" class="btn btn-ghost">Cerrar</button>
            </div>
        `, 'max-w-md');
        modalContainer.querySelector('#btn-cerrar-ficha').addEventListener('click', cerrar);
    }
}
