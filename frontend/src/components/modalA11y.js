// Accesibilidad centralizada para los modales que usan modalOverlay()
// (estructura .modal-overlay > .modal-panel). Se instala UNA vez desde main.js
// y cubre TODOS los modales del sistema sin cambios por vista:
//   - ESC cierra el modal superior (disparando el clic en el backdrop que las
//     vistas ya escuchan para cerrar).
//   - Tab queda atrapado dentro del panel (focus-trap).
//   - Al abrirse un modal, enfoca su primer campo.

const FOCUSABLE = [
    'a[href]', 'button:not([disabled])', 'input:not([disabled])',
    'select:not([disabled])', 'textarea:not([disabled])', '[tabindex]:not([tabindex="-1"])'
].join(',');

function overlaySuperior() {
    const abiertos = document.querySelectorAll('.modal-overlay');
    return abiertos[abiertos.length - 1] || null;
}

function focoDentro(panel) {
    return [...panel.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null);
}

export function initModalA11y() {
    if (window.__modalA11yInit) return;
    window.__modalA11yInit = true;

    document.addEventListener('keydown', (e) => {
        const overlay = overlaySuperior();
        if (!overlay) return;

        if (e.key === 'Escape') {
            // Cierra usando el handler de backdrop que la vista ya registró
            // (modal.addEventListener('click', e => if e.target===modal cerrar)).
            overlay.dispatchEvent(new MouseEvent('click', { bubbles: true }));
            return;
        }

        if (e.key === 'Tab') {
            const panel = overlay.querySelector('.modal-panel') || overlay;
            const foco = focoDentro(panel);
            if (foco.length === 0) return;
            const primero = foco[0];
            const ultimo = foco[foco.length - 1];
            if (e.shiftKey && document.activeElement === primero) {
                e.preventDefault();
                ultimo.focus();
            } else if (!e.shiftKey && document.activeElement === ultimo) {
                e.preventDefault();
                primero.focus();
            }
        }
    });

    // Autofocus del primer campo cuando aparece un modal en el DOM.
    const obs = new MutationObserver((mutaciones) => {
        for (const m of mutaciones) {
            for (const nodo of m.addedNodes) {
                if (nodo.nodeType !== 1) continue;
                const overlay = nodo.classList?.contains('modal-overlay')
                    ? nodo
                    : nodo.querySelector?.('.modal-overlay');
                if (overlay) {
                    const panel = overlay.querySelector('.modal-panel') || overlay;
                    const primero = panel.querySelector(FOCUSABLE);
                    if (primero) setTimeout(() => primero.focus(), 30);
                }
            }
        }
    });
    obs.observe(document.body, { childList: true, subtree: true });
}

export default initModalA11y;
