import Auth from '../modules/auth.js';
import Router from '../modules/router.js';
import { icon } from './icons.js';
import { confirmDialog } from './confirm.js';

const NOMBRES_ROL = {
    superadmin: 'Super administrador',
    administrador: 'Director institucional',
    estudiante: 'Estudiante / Egresado'
};

// Rastro de navegación (breadcrumb) por ruta. La última entrada es la página
// actual (sin href). Las vistas de detalle pueden pasar su propio rastro a
// renderLayout(contenido, { crumbs }) para añadir p. ej. "Est. Juan".
const BREADCRUMB_POR_RUTA = {
    '/dashboard-superadmin': [{ label: 'Dashboard' }],
    '/gestion-instituciones': [{ label: 'Dashboard', href: '/dashboard-superadmin' }, { label: 'Instituciones' }],
    '/gestion-admins': [{ label: 'Dashboard', href: '/dashboard-superadmin' }, { label: 'Administradores' }],
    '/gestion-campanias': [{ label: 'Dashboard', href: '/dashboard-superadmin' }, { label: 'Campañas' }],
    '/dashboard-escuela': [{ label: 'Dashboard' }],
    '/gestion-estudiantes': [{ label: 'Dashboard', href: '/dashboard-escuela' }, { label: 'Estudiantes' }],
    '/campanias-institucion': [{ label: 'Dashboard', href: '/dashboard-escuela' }, { label: 'Campañas' }],
    '/mis-campanias': [{ label: 'Mis campañas' }],
    '/mi-perfil': [{ label: 'Mi perfil' }]
};

// Barra superior de las vistas autenticadas: breadcrumb dinámico, hamburguesa
// (móvil) que abre el drawer, y menú de avatar con cerrar sesión.
const Navbar = {
    // crumbs: opcional, sobreescribe el rastro derivado de la ruta.
    render(crumbs) {
        const user = Auth.getUser();
        const rastro = crumbs || BREADCRUMB_POR_RUTA[window.location.pathname] || [];
        const inicial = (user.username || '?').charAt(0).toUpperCase();

        const nav = document.createElement('header');
        nav.className = 'sticky top-0 z-40';

        const crumbsHtml = rastro
            .map((c, i) => {
                const esUltimo = i === rastro.length - 1;
                const sep = i > 0 ? `<span class="text-navy-200">${icon('chevronRight', 'w-4 h-4')}</span>` : '';
                const contenido = esUltimo
                    ? `<span class="font-display font-semibold text-navy-600">${c.label}</span>`
                    : c.href
                        ? `<a data-link href="${c.href}" class="text-ink-muted hover:text-green-600 transition-colors">${c.label}</a>`
                        : `<span class="text-ink-muted">${c.label}</span>`;
                return `<span class="inline-flex items-center gap-2">${sep}${contenido}</span>`;
            })
            .join('');

        nav.innerHTML = `
            <!-- Tricolor bandera de Barranquilla -->
            <div class="flex h-1 w-full" aria-hidden="true">
                <span class="flex-1 bg-red-500"></span>
                <span class="flex-1 bg-yellow-400"></span>
                <span class="flex-1 bg-green-500"></span>
            </div>

            <div class="bg-white/90 backdrop-blur border-b border-navy-100">
                <div class="flex items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
                    <div class="flex min-w-0 items-center gap-2">
                        <!-- Hamburguesa (solo móvil) -->
                        <button id="nav-hamburger" class="rounded-lg p-2 text-navy-600 hover:bg-navy-50 transition-colors lg:hidden" aria-label="Abrir menú">
                            ${icon('grid', 'w-5 h-5')}
                        </button>
                        <!-- Breadcrumb -->
                        <nav class="flex items-center gap-2 text-sm min-w-0 overflow-x-auto">
                            ${crumbsHtml || '<span class="font-display font-semibold text-navy-600">NexoEdu</span>'}
                        </nav>
                    </div>

                    <!-- Acciones -->
                    <div class="flex items-center gap-1 sm:gap-3">
                        <!-- Menú de usuario -->
                        <div class="relative">
                            <button id="nav-avatar" class="flex items-center gap-3 rounded-full py-1 pl-1 pr-2 hover:bg-navy-50 transition-colors sm:pr-3" aria-haspopup="true" aria-expanded="false">
                                <span class="flex h-9 w-9 items-center justify-center rounded-full bg-navy-600 text-sm font-bold text-yellow-400">${inicial}</span>
                                <span class="hidden text-left leading-tight sm:block">
                                    <span class="block text-sm font-semibold text-navy-600">${user.username}</span>
                                    <span class="block text-xs text-ink-muted">${NOMBRES_ROL[user.rol] || user.rol}</span>
                                </span>
                                <span class="hidden text-navy-300 sm:block">${icon('chevronRight', 'w-4 h-4 rotate-90')}</span>
                            </button>

                            <div id="nav-menu" class="absolute right-0 mt-2 hidden w-52 overflow-hidden rounded-xl border border-navy-100 bg-white py-1 shadow-(--shadow-pop)">
                                <div class="border-b border-navy-50 px-4 py-3 sm:hidden">
                                    <p class="text-sm font-semibold text-navy-600">${user.username}</p>
                                    <p class="text-xs text-ink-muted">${NOMBRES_ROL[user.rol] || user.rol}</p>
                                </div>
                                <button id="nav-logout" class="flex w-full items-center gap-2 px-4 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors">
                                    ${icon('logout', 'w-4 h-4')} Cerrar sesión
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Hamburguesa -> avisa al Layout para abrir el drawer.
        nav.querySelector('#nav-hamburger')?.addEventListener('click', () => {
            document.dispatchEvent(new CustomEvent('nexo:toggle-sidebar'));
        });

        // Menú de avatar (abrir/cerrar + cerrar al hacer clic afuera).
        const btnAvatar = nav.querySelector('#nav-avatar');
        const menu = nav.querySelector('#nav-menu');
        const cerrarMenu = () => {
            menu.classList.add('hidden');
            btnAvatar.setAttribute('aria-expanded', 'false');
        };
        btnAvatar.addEventListener('click', (e) => {
            e.stopPropagation();
            const abierto = !menu.classList.contains('hidden');
            menu.classList.toggle('hidden', abierto);
            btnAvatar.setAttribute('aria-expanded', String(!abierto));
        });
        document.addEventListener('click', cerrarMenu);

        nav.querySelector('#nav-logout').addEventListener('click', async () => {
            const ok = await confirmDialog({
                titulo: 'Cerrar sesión',
                mensaje: '¿Seguro que quieres salir de tu cuenta?',
                confirmar: 'Cerrar sesión'
            });
            if (ok) {
                await Auth.logout();
                Router.navigate('/login');
            }
        });

        return nav;
    }
};

export default Navbar;
