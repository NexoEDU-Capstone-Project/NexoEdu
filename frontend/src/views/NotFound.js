import { icon } from '../components/icons.js';

const NotFound = {
    async render() {
        const container = document.createElement('div');
        container.className = 'min-h-screen flex items-center justify-center bg-surface px-4';
        container.innerHTML = `
            <div class="text-center">
                <span class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-navy-50 text-navy-400">${icon('search', 'w-8 h-8')}</span>
                <h1 class="font-display text-7xl font-bold text-navy-600">404</h1>
                <p class="mt-2 text-ink-soft">La página que buscas no existe.</p>
                <a href="/login" data-link class="btn btn-primary mt-6">${icon('home', 'w-4 h-4')} Volver al inicio</a>
            </div>
        `;
        return container;
    }
};

export default NotFound;
