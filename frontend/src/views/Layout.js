import Navbar from '../components/Navbar.js';
import Sidebar from '../components/Sidebar.js';

// Control del drawer móvil. Los listeners se registran UNA sola vez a nivel de
// módulo (no por render) para no acumular handlers en cada navegación. Operan
// sobre el #mobile-drawer que exista en el DOM en ese momento.
let drawerGlobalInit = false;

function abrirDrawer() {
    const d = document.getElementById('mobile-drawer');
    if (!d) return;
    d.classList.remove('pointer-events-none');
    d.querySelector('.drawer-overlay')?.classList.remove('opacity-0');
    d.querySelector('.drawer-panel')?.classList.remove('-translate-x-full');
}

function cerrarDrawer() {
    const d = document.getElementById('mobile-drawer');
    if (!d) return;
    d.querySelector('.drawer-overlay')?.classList.add('opacity-0');
    d.querySelector('.drawer-panel')?.classList.add('-translate-x-full');
    setTimeout(() => d.classList.add('pointer-events-none'), 200);
}

function initDrawerGlobal() {
    if (drawerGlobalInit) return;
    drawerGlobalInit = true;
    document.addEventListener('nexo:toggle-sidebar', abrirDrawer);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') cerrarDrawer();
    });
}

// Layout compartido por todas las vistas autenticadas (Sidebar + Navbar).
// Cada vista construye solo su contenido y lo pasa aquí.
//
// opciones:
//   - crumbs: rastro de breadcrumb personalizado (para vistas de detalle,
//     p. ej. [{label:'Estudiantes', href:'/gestion-estudiantes'}, {label:'Juan Pérez'}]).
export function renderLayout(contenidoElement, { crumbs } = {}) {
    initDrawerGlobal();

    const wrapper = document.createElement('div');
    wrapper.className = 'min-h-screen bg-surface flex';

    // Columna izquierda: sidebar fija (escritorio)
    wrapper.appendChild(Sidebar.render());

    // Drawer móvil (oculto por defecto; se abre con la hamburguesa del navbar)
    const drawer = document.createElement('div');
    drawer.id = 'mobile-drawer';
    drawer.className = 'fixed inset-0 z-50 pointer-events-none lg:hidden';
    drawer.innerHTML = `
        <div class="drawer-overlay absolute inset-0 bg-navy-900/50 opacity-0 backdrop-blur-sm transition-opacity duration-200"></div>
        <div class="drawer-panel absolute left-0 top-0 h-full w-72 -translate-x-full shadow-xl transition-transform duration-200"></div>
    `;
    drawer.querySelector('.drawer-panel').appendChild(Sidebar.render({ drawer: true }));
    drawer.querySelector('.drawer-overlay').addEventListener('click', cerrarDrawer);
    // Cerrar el drawer al tocar cualquier enlace de navegación dentro de él.
    drawer.querySelectorAll('[data-link]').forEach((a) => a.addEventListener('click', cerrarDrawer));
    wrapper.appendChild(drawer);

    // Columna derecha: navbar + contenido + footer
    const col = document.createElement('div');
    col.className = 'flex-1 min-w-0 flex flex-col';

    col.appendChild(Navbar.render(crumbs));

    const main = document.createElement('main');
    main.className = 'flex-1 px-5 py-6 sm:px-8 sm:py-8';
    
    // Extraer hero si existe (para que ocupe todo el ancho)
    const hero = contenidoElement.querySelector('#hero');
    if (hero) {
        main.appendChild(hero);
    }
    
    const inner = document.createElement('div');
    inner.className = 'mx-auto w-full max-w-6xl';
    inner.appendChild(contenidoElement);
    main.appendChild(inner);
    col.appendChild(main);

    // Footer institucional (navy, acorde a la marca)
    const footer = document.createElement('footer');
    footer.className = 'bg-navy-600 text-white';
    footer.innerHTML = `
        <!-- Tricolor bandera de Barranquilla como remate superior -->
        <div class="flex h-1 w-full" aria-hidden="true">
            <span class="flex-1 bg-red-500"></span>
            <span class="flex-1 bg-yellow-400"></span>
            <span class="flex-1 bg-green-500"></span>
        </div>
        <div class="mx-auto max-w-6xl px-8 py-8">
            <div class="flex flex-col items-center gap-8 sm:flex-row sm:items-center sm:justify-between">
                <!-- Marca + tagline -->
                <div class="flex items-center gap-3">
                    <img src="/brand/NexoEDUblanco.png" alt="NexoEdu" class="h-12 w-auto object-contain" />
                    <p class="max-w-[16rem] text-xs text-navy-100">Seguimiento educativo del Distrito de Barranquilla</p>
                </div>

                <!-- Aliados (logos en chips blancos para contraste sobre navy) -->
                <div class="flex items-center gap-4">
                    <span class="text-[10px] font-semibold uppercase tracking-wider text-navy-200">Aliados</span>
                    <div class="flex items-center gap-3">
                        <div class="flex h-14 items-center px-4">
                            <img src="/brand/Logo_Riwi.png" alt="Riwi" class="h-10 w-auto object-contain" />
                        </div>
                        <div class="flex h-14 items-center px-4">
                            <img src="/brand/Alcaldia_blanco.png" alt="Alcaldía de Barranquilla" class="h-10 w-auto object-contain" />
                        </div>
                    </div>
                </div>
            </div>

            <div class="mt-6 border-t border-white/10 pt-5 text-center text-xs text-navy-200 sm:text-left">
                © ${new Date().getFullYear()} NexoEdu · Alcaldía de Barranquilla. Todos los derechos reservados.
            </div>
        </div>
    `;
    col.appendChild(footer);

    wrapper.appendChild(col);
    return wrapper;
}
