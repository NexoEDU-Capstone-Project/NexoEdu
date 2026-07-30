import { renderLayout } from './Layout.js';
import * as StudentService from '../services/studentService.js';
import * as CatalogService from '../services/catalogService.js';
import * as InstitutionService from '../services/institutionService.js';
import { ApiError } from '../modules/http.js';
import { icon } from '../components/icons.js';
import { encabezado, iniciales, formatearFecha, semaforoActualizacion, skeletonBloque, abreviarInstitucion } from '../components/ui.js';

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
        // El skeleton imita la forma real (portada + estado + tarjeta de datos)
        // para que no haya un salto de altura cuando llegan los datos.
        container.innerHTML = `
            ${skeletonBloque('h-44')}
            <div class="my-4">${skeletonBloque('h-20')}</div>
            ${skeletonBloque('h-96')}
        `;

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
            // Se muestra la abreviatura (CC, TI...) en vez del nombre completo:
            // ocupa mucho menos y se lee mejor. El nombre completo queda en el
            // title, al pasar el mouse.
            const tipoDocumento = tiposDocumento.find((t) => t.id === datos.document_type_id);
            const abrevDocumento = tipoDocumento?.abbreviation ?? tipoDocumento?.name ?? '—';
            const nombreDocumento = tipoDocumento?.name ?? '—';
            const nombreGrado = grados.find((g) => g.id === datos.grade_id)?.grade ?? 'Egresado / sin grado';
            const nombreEstado = estados.find((s) => s.id === datos.status_id)?.status ?? '—';

            let nombreInstitucion = '—';
            if (datos.institution_id) {
                try {
                    const institucion = await InstitutionService.obtener(datos.institution_id);
                    nombreInstitucion = abreviarInstitucion(institucion.institution_name);
                } catch {
                    // Si falla, dejamos el guion; no bloqueamos el resto del perfil por esto.
                }
            }

            const esEgresado = nombreEstado.toUpperCase() === 'EGRESADO';
            const sem = semaforoActualizacion(datos.ultima_actualizacion);

            // Estilos del bloque de estado según el semáforo (verde/amarillo/rojo).
            const estiloSemaforo = {
                'badge-green': { borde: 'border-l-green-500', fondo: 'bg-green-50', texto: 'text-green-700', chip: 'bg-green-100 text-green-700', ic: 'checkCircle' },
                'badge-yellow': { borde: 'border-l-yellow-400', fondo: 'bg-yellow-50', texto: 'text-yellow-700', chip: 'bg-yellow-100 text-yellow-700', ic: 'clock' },
                'badge-red': { borde: 'border-l-red-500', fondo: 'bg-red-50', texto: 'text-red-600', chip: 'bg-red-100 text-red-600', ic: 'bell' }
            }[sem.clase];

            // Tarjeta de dato: chip con ícono + etiqueta + valor.
            // `titulo` permite mostrar un texto corto y dejar el completo en el tooltip.
            const dato = (label, valor, iconName, titulo = null) => `
                <div class="flex items-start gap-3 rounded-xl border border-navy-50 bg-white p-3.5 transition-shadow hover:shadow-(--shadow-pop)">
                    <span class="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-navy-50 text-navy-500">${icon(iconName, 'w-4 h-4')}</span>
                    <div class="min-w-0">
                        <p class="text-xs text-ink-muted">${label}</p>
                        <p class="truncate font-medium text-navy-600" title="${titulo ?? valor ?? ''}">${valor}</p>
                    </div>
                </div>`;

            // Bloque de sección con título e ícono de acento.
            const seccion = (titulo, iconName, cuerpo) => `
                <div>
                    <h3 class="mb-3 flex items-center gap-2 font-display text-sm font-semibold text-navy-600">
                        ${icon(iconName, 'w-4 h-4 text-green-500')} ${titulo}
                    </h3>
                    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">${cuerpo}</div>
                </div>`;

            container.innerHTML = `
                <!-- Portada: identidad del estudiante sobre fondo de marca -->
                <section class="relative mb-4 overflow-hidden rounded-2xl bg-navy-600 px-6 py-7 sm:px-8">
                    <span class="pointer-events-none absolute -right-10 -top-12 h-48 w-48 rounded-full bg-green-500/25 blur-2xl"></span>
                    <span class="pointer-events-none absolute -bottom-16 right-24 h-44 w-44 rounded-full bg-yellow-400/15 blur-2xl"></span>
                    <div class="relative">
                        <span class="mb-4 flex h-1.5 w-24 overflow-hidden rounded-full" aria-hidden="true">
                            <span class="flex-1 bg-red-500"></span><span class="flex-1 bg-yellow-400"></span><span class="flex-1 bg-green-500"></span>
                        </span>
                        <div class="flex flex-col gap-4 sm:flex-row sm:items-center">
                            <span class="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-yellow-400 font-display text-3xl font-bold text-navy-700 shadow-lg ring-4 ring-white/20">
                                ${iniciales(datos.first_name, datos.last_name)}
                            </span>
                            <div class="min-w-0 flex-1">
                                <h2 class="font-display text-2xl font-bold leading-tight text-white sm:text-3xl">${datos.first_name} ${datos.last_name}</h2>
                                <p class="mt-1 flex items-center gap-1.5 text-sm text-navy-100">${icon('school', 'w-4 h-4')} <span class="truncate">${nombreInstitucion}</span></p>
                                <div class="mt-3 flex flex-wrap items-center gap-2">
                                    <span class="badge ${esEgresado ? 'badge-yellow' : 'badge-green'}">${nombreEstado}</span>
                                    <span class="badge badge-navy">${nombreGrado}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- Estado de actualización: lo más importante para el estudiante -->
                <div class="mb-5 flex flex-col gap-3 rounded-2xl border border-navy-50 border-l-4 ${estiloSemaforo.borde} ${estiloSemaforo.fondo} px-5 py-4 sm:flex-row sm:items-center">
                    <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${estiloSemaforo.chip}">
                        ${icon(estiloSemaforo.ic, 'w-5 h-5')}
                    </span>
                    <div class="min-w-0 flex-1">
                        <p class="font-display text-sm font-bold ${estiloSemaforo.texto}">Tus datos están: ${sem.label}</p>
                        <p class="text-xs text-ink-soft">
                            Última actualización: ${sem.fecha}${sem.dias !== null ? ` · hace ${sem.dias} días` : ''}
                        </p>
                    </div>
                    <a href="/mis-campanias" data-link class="btn btn-primary shrink-0">
                        ${icon('pencil', 'w-4 h-4')} Actualizar mis datos
                    </a>
                </div>

                <!-- Información, agrupada por tipo -->
                <div class="card space-y-6">
                    ${seccion('Datos personales', 'user', `
                        ${dato('Documento', `${abrevDocumento} ${datos.document_number}`, 'idCard', `${nombreDocumento} ${datos.document_number}`)}
                        ${dato('Género', nombreGenero, 'user')}
                        ${dato('Fecha de nacimiento', formatearFecha(datos.birth_date), 'calendar')}
                        ${dato('Estado', nombreEstado, 'checkCircle')}
                    `)}
                    ${seccion('Contacto', 'mail', `
                        ${dato('Email', datos.email, 'mail')}
                        ${dato('Teléfono', datos.phone ?? '—', 'idCard')}
                        ${dato('Dirección', datos.address ?? '—', 'mapPin')}
                    `)}
                    ${seccion('Información académica', 'gradCap', `
                        ${dato('Institución', nombreInstitucion, 'school')}
                        ${dato('Grado', nombreGrado, 'gradCap')}
                    `)}
                </div>

                <p class="mt-4 flex items-center gap-2 px-1 text-xs text-ink-soft">
                    ${icon('help', 'w-4 h-4 text-navy-300')}
                    ¿Necesitas corregir algún dato? Solo puedes actualizar tu información durante una
                    <a href="/mis-campanias" data-link class="font-semibold text-green-600 hover:text-green-700">campaña activa</a>.
                </p>
            `;
        } catch (error) {
            const mensaje = error instanceof ApiError ? error.message : 'Error al cargar tu perfil';
            container.innerHTML = `<div class="card text-red-500">${mensaje}</div>`;
        }
    }
};

export default MiPerfil;
