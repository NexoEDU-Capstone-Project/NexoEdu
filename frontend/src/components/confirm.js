import { icon } from './icons.js';

// Diálogo de confirmación de marca (reemplaza el confirm() nativo).
// Devuelve una Promesa<boolean>: true si el usuario confirma, false si cancela.
// Uso: if (await confirmDialog({ titulo, mensaje, peligro:true })) { ... }
export function confirmDialog({
    titulo = '¿Confirmar acción?',
    mensaje = '',
    confirmar = 'Confirmar',
    cancelar = 'Cancelar',
    peligro = false
} = {}) {
    return new Promise((resolve) => {
        const back = document.createElement('div');
        back.className = 'fixed inset-0 z-[60] flex items-center justify-center bg-navy-900/50 p-4 backdrop-blur-sm';
        back.innerHTML = `
            <div class="w-full max-w-sm rounded-2xl bg-white p-6 shadow-(--shadow-pop)" role="dialog" aria-modal="true">
                <div class="mb-4 flex items-start gap-3">
                    <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${peligro ? 'bg-red-100 text-red-500' : 'bg-navy-50 text-navy-500'}">
                        ${icon(peligro ? 'logout' : 'help', 'w-5 h-5')}
                    </span>
                    <div>
                        <h2 class="font-display text-lg font-bold text-navy-600">${titulo}</h2>
                        ${mensaje ? `<p class="mt-1 text-sm text-ink-soft">${mensaje}</p>` : ''}
                    </div>
                </div>
                <div class="flex justify-end gap-3">
                    <button data-cancel class="btn btn-ghost">${cancelar}</button>
                    <button data-ok class="btn ${peligro ? 'btn-danger' : 'btn-primary'}">${confirmar}</button>
                </div>
            </div>`;
        document.body.appendChild(back);

        const cerrar = (val) => {
            back.remove();
            document.removeEventListener('keydown', onKey);
            resolve(val);
        };
        const onKey = (e) => {
            if (e.key === 'Escape') cerrar(false);
            if (e.key === 'Enter') cerrar(true);
        };

        back.querySelector('[data-cancel]').addEventListener('click', () => cerrar(false));
        back.querySelector('[data-ok]').addEventListener('click', () => cerrar(true));
        back.addEventListener('click', (e) => {
            if (e.target === back) cerrar(false);
        });
        document.addEventListener('keydown', onKey);
        back.querySelector('[data-ok]').focus();
    });
}

export default confirmDialog;
