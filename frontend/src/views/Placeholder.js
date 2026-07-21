import { renderLayout } from './Layout.js';
import { icon } from '../components/icons.js';

// Vista placeholder genérica: se usa para rutas ya enlazadas desde el
// Sidebar cuyo CRUD completo todavía no se ha construido. Evita que el
// router falle al no encontrar una vista, y deja claro al usuario (y al
// equipo) qué falta por construir.
function crearPlaceholder(titulo) {
    return {
        async render() {
            const contenido = document.createElement('div');
            contenido.innerHTML = `
                <div class="flex flex-col items-center justify-center rounded-2xl border border-dashed border-navy-200 bg-white/60 p-14 text-center">
                    <span class="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-navy-50 text-navy-300">${icon('settings', 'w-7 h-7')}</span>
                    <h1 class="font-display text-xl font-bold text-navy-600">${titulo}</h1>
                    <p class="mt-1 text-ink-muted">Esta sección está en construcción.</p>
                </div>
            `;
            return renderLayout(contenido);
        }
    };
}

export default crearPlaceholder;
