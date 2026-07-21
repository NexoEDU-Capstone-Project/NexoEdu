/**
 * Editor de filas dinámicas para campaign_criteria. Cada fila representa
 * un conjunto de condiciones combinadas con AND (género + edad + grado +
 * estado); varias filas se combinan con OR entre sí. Si no se agrega
 * ninguna fila, la campaña aplica a todos los que cumplan el scope
 * (comportamiento confirmado con el usuario).
 *
 * Uso:
 *   const editor = crearEditorCriteria({ catalogos });
 *   contenedor.innerHTML = editor.html;
 *   editor.init(contenedor);
 *   // ...
 *   const criteria = editor.leerValores(contenedor); // array listo para el body
 */
export function crearEditorCriteria({ catalogos }) {
    let contadorFilas = 0;

    function filaHtml(indice) {
        const { generos, grados, estados } = catalogos;
        return `
            <div class="criteria-fila relative mb-2 grid grid-cols-2 gap-3 rounded-xl border border-navy-100 bg-navy-50/40 p-4" data-fila="${indice}">
                <button type="button" class="btn-quitar-criteria absolute right-2 top-2 text-xs font-semibold text-red-500 hover:text-red-600">Quitar</button>
                <div>
                    <label class="mb-1 block text-xs font-medium text-ink-soft">Género (opcional)</label>
                    <select name="criteria-gender-${indice}" class="input">
                        <option value="">Cualquiera</option>
                        ${generos.map((g) => `<option value="${g.id}">${g.name}</option>`).join('')}
                    </select>
                </div>
                <div>
                    <label class="mb-1 block text-xs font-medium text-ink-soft">Grado (opcional)</label>
                    <select name="criteria-grade-${indice}" class="input">
                        <option value="">Cualquiera</option>
                        ${grados.map((g) => `<option value="${g.id}">${g.grade}</option>`).join('')}
                    </select>
                </div>
                <div>
                    <label class="mb-1 block text-xs font-medium text-ink-soft">Estado (opcional)</label>
                    <select name="criteria-status-${indice}" class="input">
                        <option value="">Cualquiera</option>
                        ${estados.map((s) => `<option value="${s.id}">${s.status}</option>`).join('')}
                    </select>
                </div>
                <div class="grid grid-cols-2 gap-2">
                    <div>
                        <label class="mb-1 block text-xs font-medium text-ink-soft">Edad mín.</label>
                        <input type="number" name="criteria-minage-${indice}" min="0" class="input">
                    </div>
                    <div>
                        <label class="mb-1 block text-xs font-medium text-ink-soft">Edad máx.</label>
                        <input type="number" name="criteria-maxage-${indice}" min="0" class="input">
                    </div>
                </div>
            </div>
        `;
    }

    const html = `
        <div>
            <div class="mb-2 flex items-center justify-between">
                <label class="label mb-0">Criterios de elegibilidad (opcional)</label>
                <button type="button" id="btn-agregar-criteria" class="text-sm font-semibold text-green-600 hover:text-green-700">+ Agregar criterio</button>
            </div>
            <p class="mb-2 text-xs text-ink-muted">Si no agregas ningún criterio, la campaña aplica a todos dentro del alcance elegido. Varios criterios se combinan como "cualquiera de los siguientes".</p>
            <div id="criteria-filas"></div>
        </div>
    `;

    function init(container) {
        const filasContainer = container.querySelector('#criteria-filas');
        const btnAgregar = container.querySelector('#btn-agregar-criteria');

        const agregarFila = () => {
            const div = document.createElement('div');
            div.innerHTML = filaHtml(contadorFilas);
            const filaEl = div.firstElementChild;
            filasContainer.appendChild(filaEl);
            filaEl.querySelector('.btn-quitar-criteria').addEventListener('click', () => filaEl.remove());
            contadorFilas++;
        };

        btnAgregar.addEventListener('click', agregarFila);
    }

    function leerValores(container) {
        const filas = container.querySelectorAll('.criteria-fila');
        const criteria = [];

        filas.forEach((fila) => {
            const indice = fila.dataset.fila;
            const gender_id = fila.querySelector(`[name="criteria-gender-${indice}"]`).value;
            const grade_id = fila.querySelector(`[name="criteria-grade-${indice}"]`).value;
            const status_id = fila.querySelector(`[name="criteria-status-${indice}"]`).value;
            const min_age = fila.querySelector(`[name="criteria-minage-${indice}"]`).value;
            const max_age = fila.querySelector(`[name="criteria-maxage-${indice}"]`).value;

            // Los inputs HTML siempre devuelven string. Las edades tienen que
            // enviarse como número: si van como texto, una comparación como
            // "9" > "10" da true (comparación lexicográfica) y el backend
            // rechazaría un rango 9-10 perfectamente válido.
            criteria.push({
                gender_id: gender_id ? Number(gender_id) : null,
                grade_id: grade_id ? Number(grade_id) : null,
                status_id: status_id ? Number(status_id) : null,
                min_age: min_age !== '' ? Number(min_age) : null,
                max_age: max_age !== '' ? Number(max_age) : null
            });
        });

        return criteria;
    }

    return { html, init, leerValores };
}
