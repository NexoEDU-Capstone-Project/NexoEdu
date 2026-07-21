import { icon } from './icons.js';

// Sistema de notificaciones (toasts) global. Reemplaza los mensajes inline
// (#mensaje-global) por avisos apilables en la esquina superior derecha.
// Uso: import { toast } from '../components/toast.js'; toast('Guardado', 'success');

let contenedor;

function getContenedor() {
    if (contenedor && document.body.contains(contenedor)) return contenedor;
    contenedor = document.createElement('div');
    contenedor.id = 'toast-container';
    contenedor.className = 'pointer-events-none fixed right-4 top-4 z-[60] flex flex-col gap-2';
    document.body.appendChild(contenedor);
    return contenedor;
}

const ESTILOS = {
    success: { cls: 'border-green-200 bg-green-50 text-green-800', ic: 'checkCircle', icCls: 'text-green-500' },
    error: { cls: 'border-red-200 bg-red-50 text-red-700', ic: 'help', icCls: 'text-red-500' },
    info: { cls: 'border-navy-200 bg-white text-navy-700', ic: 'bell', icCls: 'text-navy-400' }
};

export function toast(mensaje, tipo = 'success', duracion = 3500) {
    const cont = getContenedor();
    const e = ESTILOS[tipo] || ESTILOS.info;

    const el = document.createElement('div');
    el.className = `pointer-events-auto flex max-w-sm translate-x-2 items-start gap-3 rounded-xl border ${e.cls} px-4 py-3 opacity-0 shadow-(--shadow-pop) transition-all duration-200`;
    el.setAttribute('role', 'status');
    el.innerHTML = `
        <span class="mt-0.5 shrink-0 ${e.icCls}">${icon(e.ic, 'w-5 h-5')}</span>
        <p class="text-sm font-medium">${mensaje}</p>`;
    cont.appendChild(el);

    // Entrada (deslizar+aparecer). Un frame después para que la transición corra.
    requestAnimationFrame(() => el.classList.remove('translate-x-2', 'opacity-0'));

    const cerrar = () => {
        el.classList.add('translate-x-2', 'opacity-0');
        setTimeout(() => el.remove(), 200);
    };
    const t = setTimeout(cerrar, duracion);
    el.addEventListener('click', () => {
        clearTimeout(t);
        cerrar();
    });
}

export default toast;
