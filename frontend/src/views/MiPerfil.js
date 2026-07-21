import { renderLayout } from './Layout.js';
import * as StudentService from '../services/studentService.js';
import * as CatalogService from '../services/catalogService.js';
import * as InstitutionService from '../services/institutionService.js';
import { ApiError } from '../modules/http.js';
import { icon } from '../components/icons.js';
import { encabezado, iniciales, formatearFecha, semaforoActualizacion, skeletonBloque } from '../components/ui.js';

// Perfil del estudiante (solo lectura): sus datos personales/académicos y el
// semáforo de última actualización. La edición solo es posible durante una
// campaña activa (desde "Mis campañas").
const MiPerfil = {
    async render() {
        const contenido = document.createElement('div');
        contenido.innerHTML = `
            ${encabezado({ titulo: 'Mi perfil', subtitulo: 'Tu información personal y académica registrada.' })}
            <div id="perfil-container" class="max-w-3xl"></div>
        `;

        const container = contenido.querySelector('#perfil-container');
        container.innerHTML = skeletonBloque('h-96');

        // Sin await: devolvemos el shell (con skeleton) y cargamos en segundo plano.
        this._cargar(container);
        return renderLayout(contenido);
    },

    async _cargar(container) {
        try {
            const [datos, generos, tiposDocumento, grados, estados] = await Promise.all([
                StudentService.obtenerMisDatos(),
                CatalogService.generos(),
                CatalogService.tiposDocumento(),
                CatalogService.grados(),
                CatalogService.estados()
            ]);

            const nombreGenero = generos.find((g) => g.id === datos.gender_id)?.name ?? '—';
            const nombreDocumento = tiposDocumento.find((t) => t.id === datos.document_type_id)?.name ?? '—';
            const nombreGrado = grados.find((g) => g.id === datos.grade_id)?.grade ?? 'Egresado / sin grado';
            const nombreEstado = estados.find((s) => s.id === datos.status_id)?.status ?? '—';

            let nombreInstitucion = '—';
            if (datos.institution_id) {
                try {
                    const institucion = await InstitutionService.obtener(datos.institution_id);
                    nombreInstitucion = institucion.institution_name;
                } catch {
                    // Si falla, dejamos el guion; no bloqueamos el resto del perfil por esto.
                }
            }

            const esEgresado = nombreEstado.toUpperCase() === 'EGRESADO';
            const sem = semaforoActualizacion(datos.ultima_actualizacion);
            const dato = (label, valor, iconName) => `
                <div class="flex items-start gap-3">
                    <span class="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-navy-50 text-navy-400">${icon(iconName, 'w-4 h-4')}</span>
                    <div class="min-w-0">
                        <p class="text-xs text-ink-muted">${label}</p>
                        <p class="truncate font-medium text-navy-600">${valor}</p>
                    </div>
                </div>`;

            container.innerHTML = `
                <div class="card overflow-hidden p-0">
                    <!-- Cabecera con acento navy -->
                    <div class="relative bg-navy-600 px-6 py-6">
                        <span class="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-green-500/20 blur-2xl"></span>
                        <div class="relative flex items-center gap-4">
                            <span class="flex h-16 w-16 items-center justify-center rounded-2xl bg-yellow-400 font-display text-2xl font-bold text-navy-700">
                                ${iniciales(datos.first_name, datos.last_name)}
                            </span>
                            <div class="min-w-0">
                                <h2 class="font-display text-xl font-bold text-white">${datos.first_name} ${datos.last_name}</h2>
                                <p class="flex items-center gap-1.5 text-sm text-navy-100">${icon('school', 'w-4 h-4')} ${nombreInstitucion}</p>
                            </div>
                            <span class="badge ${esEgresado ? 'badge-yellow' : 'badge-green'} ml-auto self-start">${nombreEstado}</span>
                        </div>
                    </div>

                    <!-- Estado de actualización (semáforo) -->
                    <div class="flex items-center gap-3 border-b border-navy-50 px-6 py-4">
                        <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${sem.clase}">
                            <span class="h-2.5 w-2.5 rounded-full ${sem.dot}"></span>
                        </span>
                        <div>
                            <p class="text-sm font-semibold text-navy-600">Última actualización de datos: ${sem.label}</p>
                            <p class="text-xs text-ink-muted">${sem.fecha}${sem.dias !== null ? ` · hace ${sem.dias} días` : ''}</p>
                        </div>
                    </div>

                    <!-- Datos -->
                    <div class="grid grid-cols-1 gap-5 p-6 sm:grid-cols-2">
                        ${dato('Email', datos.email, 'mail')}
                        ${dato('Teléfono', datos.phone ?? '—', 'idCard')}
                        ${dato('Género', nombreGenero, 'user')}
                        ${dato('Fecha de nacimiento', formatearFecha(datos.birth_date), 'calendar')}
                        ${dato('Documento', `${nombreDocumento} ${datos.document_number}`, 'idCard')}
                        ${dato('Dirección', datos.address ?? '—', 'mapPin')}
                        ${dato('Grado', nombreGrado, 'gradCap')}
                        ${dato('Estado', nombreEstado, 'checkCircle')}
                    </div>

                    <div class="border-t border-navy-50 bg-navy-50/40 px-6 py-4">
                        <p class="flex items-center gap-2 text-xs text-ink-soft">
                            ${icon('help', 'w-4 h-4 text-navy-300')}
                            ¿Necesitas corregir algún dato? Solo puedes actualizar tu información durante una
                            <a href="/mis-campanias" data-link class="font-semibold text-green-600 hover:text-green-700">campaña activa</a>.
                        </p>
                    </div>
                </div>
            `;
        } catch (error) {
            const mensaje = error instanceof ApiError ? error.message : 'Error al cargar tu perfil';
            container.innerHTML = `<div class="card text-red-500">${mensaje}</div>`;
        }
    }
};

export default MiPerfil;
