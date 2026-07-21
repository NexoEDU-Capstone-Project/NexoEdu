import * as CatalogService from '../services/catalogService.js';

/**
 * Crea el HTML de un selector encadenado localidad -> barrio, y devuelve
 * una función de inicialización que hay que llamar DESPUÉS de insertar
 * el HTML en el DOM (para enlazar el evento 'change' y, si se pasa un
 * neighborhoodIdSeleccionado, dejar preseleccionado el barrio correcto
 * al cargar el formulario en modo edición).
 *
 * Uso:
 *   const { html, init } = crearSelectorBarrio({ idPrefix: 'inst' });
 *   contenedor.innerHTML = `... ${html} ...`;
 *   await init(contenedor, neighborhoodIdActual); // neighborhoodIdActual opcional
 */
export function crearSelectorBarrio({ idPrefix, localidades }) {
    const html = `
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
                <label class="label">Localidad</label>
                <select id="${idPrefix}-localidad" class="select">
                    <option value="">Selecciona una localidad</option>
                    ${localidades.map((l) => `<option value="${l.id}">${l.name}</option>`).join('')}
                </select>
            </div>
            <div>
                <label class="label">Barrio</label>
                <select id="${idPrefix}-barrio" name="neighborhood_id" required class="select">
                    <option value="">Selecciona una localidad primero</option>
                </select>
            </div>
        </div>
    `;

    async function init(container, neighborhoodIdActual = null) {
        const selectLocalidad = container.querySelector(`#${idPrefix}-localidad`);
        const selectBarrio = container.querySelector(`#${idPrefix}-barrio`);

        const cargarBarrios = async (localityId, barrioSeleccionado = null) => {
            const barrios = await CatalogService.barrios(localityId);
            selectBarrio.innerHTML = barrios
                .map((b) => `<option value="${b.id}" ${b.id === barrioSeleccionado ? 'selected' : ''}>${b.name}</option>`)
                .join('');
        };

        selectLocalidad.addEventListener('change', () => cargarBarrios(selectLocalidad.value));

        // Modo edición: si ya hay un barrio actual, hay que descubrir a qué
        // localidad pertenece para preseleccionar ambos selects correctamente.
        if (neighborhoodIdActual) {
            const todosLosBarrios = await CatalogService.barrios();
            const barrioActual = todosLosBarrios.find((b) => b.id === neighborhoodIdActual);
            if (barrioActual) {
                selectLocalidad.value = barrioActual.locality_id;
                await cargarBarrios(barrioActual.locality_id, neighborhoodIdActual);
            }
        }
    }

    return { html, init };
}
