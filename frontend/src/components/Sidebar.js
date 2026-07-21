import Auth from '../modules/auth.js';
import Router from '../modules/router.js';
import { icon } from './icons.js';
import { confirmDialog } from './confirm.js';
import { toast } from './toast.js';

// Subtítulo del portal según rol (bajo el logo NexoEdu).
const PORTAL_POR_ROL = {
    superadmin: 'Portal Distrital',
    administrador: 'Portal del Director',
    estudiante: 'Portal del Estudiante'
};

// Opciones de navegación por rol. Un único componente que, mediante el rol
// del usuario, decide qué ve cada quien. `icono` referencia a icons.js.
const OPCIONES_POR_ROL = {
    superadmin: [
        { href: '/dashboard-superadmin', label: 'Dashboard', icono: 'dashboard' },
        { href: '/gestion-instituciones', label: 'Instituciones', icono: 'school' },
        { href: '/gestion-admins', label: 'Administradores', icono: 'users' },
        { href: '/gestion-campanias', label: 'Campañas', icono: 'megaphone' }
    ],
    administrador: [
        { href: '/dashboard-escuela', label: 'Dashboard', icono: 'dashboard' },
        { href: '/gestion-estudiantes', label: 'Estudiantes', icono: 'users' },
        { href: '/campanias-institucion', label: 'Campañas', icono: 'megaphone' }
    ],
    estudiante: [
        { href: '/mis-campanias', label: 'Mis campañas', icono: 'megaphone' },
        { href: '/mi-perfil', label: 'Mi perfil', icono: 'user' }
    ]
};

// Solo superadmin y administrador pueden lanzar campañas -> botón inferior.
const PUEDE_CREAR_CAMPANIA = {
    superadmin: '/gestion-campanias',
    administrador: '/campanias-institucion'
};

// Barra lateral de navegación. Un único componente que, según el rol del
// usuario, muestra las opciones que corresponden (superadmin/administrador/
// estudiante). Se usa fija en escritorio y como drawer en móvil.
const Sidebar = {
    // drawer=true -> variante para el menú deslizante en móvil (siempre visible,
    // sin sticky). drawer=false -> barra lateral fija de escritorio.
    render({ drawer = false } = {}) {
        const user = Auth.getUser();
        const opciones = OPCIONES_POR_ROL[user.rol] || [];
        const rutaActual = window.location.pathname;

        const aside = document.createElement('aside');
        aside.className = drawer
            ? 'w-72 h-full bg-white flex flex-col'
            : 'w-64 shrink-0 h-screen sticky top-0 bg-white border-r border-navy-100 flex flex-col hidden lg:flex';

        const itemsHtml = opciones
            .map((op) => {
                const activo = rutaActual === op.href;
                return `
                <li>
                    <a data-link href="${op.href}"
                        class="group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors
                        ${activo
                            ? 'bg-navy-600 text-white shadow-sm'
                            : 'text-ink-soft hover:bg-navy-50 hover:text-navy-600'}">
                        <span class="${activo ? 'text-yellow-400' : 'text-navy-300 group-hover:text-green-500'}">
                            ${icon(op.icono, 'w-5 h-5')}
                        </span>
                        ${op.label}
                    </a>
                </li>`;
            })
            .join('');

        const rutaCampania = PUEDE_CREAR_CAMPANIA[user.rol];
        const botonCampania = rutaCampania
            ? `<a data-link href="${rutaCampania}" class="btn btn-primary w-full">
                    ${icon('plus', 'w-4 h-4')} Nueva campaña
               </a>`
            : '';

        aside.innerHTML = `
            <!-- Marca -->
            <div class="flex items-center gap-3 px-6 py-6">
                <img src="/brand/nexoLogo.svg" alt="NexoEdu" class="h-10 w-10 shrink-0"
                    onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                <div style="display:none" class="h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-navy-600 font-display font-bold text-yellow-400">N</div>
                <div class="leading-tight">
                    <p class="font-display text-xl font-bold text-navy-600">NexoEdu</p>
                    <p class="text-xs text-ink-muted">${PORTAL_POR_ROL[user.rol] || ''}</p>
                </div>
            </div>

            <!-- Navegación -->
            <nav class="flex-1 overflow-y-auto px-3 py-2">
                <ul class="space-y-1">${itemsHtml}</ul>
            </nav>

            <!-- Acciones inferiores -->
            <div class="border-t border-navy-100 p-4 space-y-3">
                ${botonCampania}
                <button id="sb-support" class="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-ink-soft hover:bg-navy-50 transition-colors">
                    ${icon('help', 'w-5 h-5 text-navy-300')} Soporte
                </button>
                <button id="sb-logout" class="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors">
                    ${icon('logout', 'w-5 h-5')} Cerrar sesión
                </button>
            </div>
        `;

        aside.querySelector('#sb-support').addEventListener('click', () => {
            toast('Soporte: escribe a soporte@nexoedu.co (próximamente en la app).', 'info', 5000);
        });

        aside.querySelector('#sb-logout').addEventListener('click', async () => {
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

        return aside;
    }
};

export default Sidebar;
