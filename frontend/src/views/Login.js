import Auth from '../modules/auth.js';
import { ApiError } from '../modules/http.js';
import { icon } from '../components/icons.js';

// Pantalla de inicio de sesión (pública). Panel visual + formulario con
// mostrar/ocultar contraseña y guía de recuperación. Tras login, el router
// redirige solo al dashboard según el rol (no se navega desde aquí).
const Login = {
    async render() {
        const container = document.createElement('div');
        container.className = 'min-h-screen bg-surface';

        container.innerHTML = `
        <div class="mx-auto flex min-h-screen max-w-7xl items-stretch gap-0 p-0 lg:p-6">
            <div class="grid w-full overflow-hidden rounded-none lg:rounded-3xl lg:shadow-2xl lg:grid-cols-2">

                <!-- Panel visual (foto de niños estudiando + degradado, texto arriba) -->
                <aside class="relative hidden lg:block bg-navy-600"
                    style="background-image:linear-gradient(180deg, rgba(20,35,52,.90) 0%, rgba(20,35,52,.35) 48%, rgba(20,35,52,.25) 100%), url('/brand/Niños_estudiando2.jpg'); background-size:cover; background-position:center;">
                    <div class="relative flex h-full flex-col justify-start p-12 text-white">
                        <div class="mb-5 flex h-1.5 w-24 overflow-hidden rounded-full" aria-hidden="true">
                            <span class="flex-1 bg-red-500"></span>
                            <span class="flex-1 bg-yellow-400"></span>
                            <span class="flex-1 bg-green-500"></span>
                        </div>
                        <h1 class="font-display text-4xl font-bold leading-tight">
                            Transformando la<br>educación en el Caribe.
                        </h1>
                        <p class="mt-4 max-w-sm text-[15px] leading-relaxed text-navy-100">
                            Accede a una red de conocimiento diseñada para potenciar
                            el talento de nuestra región.
                        </p>
                    </div>
                </aside>

                <!-- Panel de formulario -->
                <main class="flex flex-col justify-center bg-white px-6 py-12 sm:px-14">
                    <div class="mx-auto w-full max-w-sm">
                        <!-- Marca (wordmark) -->
                        <div class="flex items-center justify-center">
                            <img src="/brand/NexoEDU_Negro_Largo.png" alt="NexoEdu" class="h-12 w-auto object-contain" />
                        </div>

                        <div class="mb-7 text-center">
                            <h2 class="font-display text-2xl md:text-3xl font-bold text-navy-600">Bienvenido de nuevo</h2>
                            <p class="mt-1.5 text-sm text-ink-soft">Inicia sesión para continuar con tu formación académica.</p>
                        </div>

                        <form id="login-form" class="space-y-4">
                            <div>
                                <div class="relative">
                                    <span class="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-navy-300">
                                        ${icon('mail', 'w-5 h-5')}
                                    </span>
                                    <input type="text" id="username" required autocomplete="username"
                                        class="input pl-11" placeholder="Usuario o correo electrónico">
                                </div>
                            </div>

                            <div>
                                <div class="relative">
                                    <span class="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-navy-300">
                                        ${icon('lock', 'w-5 h-5')}
                                    </span>
                                    <input type="password" id="password" required autocomplete="current-password"
                                        class="input pl-11 pr-11" placeholder="Contraseña">
                                    <button type="button" id="toggle-pw"
                                        class="absolute inset-y-0 right-3 flex items-center text-navy-300 hover:text-navy-600 transition-colors"
                                        aria-label="Mostrar contraseña">
                                        ${icon('eye', 'w-5 h-5')}
                                    </button>
                                </div>
                            </div>

                            <div class="flex justify-end text-sm">
                                <a href="#" id="forgot" class="font-semibold text-green-600 hover:text-green-700">¿Olvidaste tu contraseña?</a>
                            </div>

                            <div id="error-message" class="hidden rounded-xl bg-red-50 py-2.5 px-3 text-sm text-red-600"></div>

                            <button id="login-btn" type="submit" class="btn btn-primary w-full py-3 text-base">
                                Iniciar sesión ${icon('chevronRight', 'w-4 h-4')}
                            </button>
                        </form>

                        <div class="mt-8 border-t border-navy-100 pt-6">
                            <p class="text-center text-[11px] font-semibold uppercase tracking-wider text-ink-muted">Una iniciativa de</p>
                            <div class="mt-4 flex items-center justify-center gap-6">
                                <img src="/brand/Riwi_negro.png" alt="Riwi" class="h-8 w-auto object-contain" />
                                <span class="h-10 w-px bg-navy-100"></span>
                                <img src="/brand/barranquilla_logo.png" alt="Alcaldía de Barranquilla" class="h-10 w-auto object-contain" />
                            </div>
                            <p class="mt-5 text-center text-xs text-ink-muted">© ${new Date().getFullYear()} NexoEdu · Distrito de Barranquilla</p>
                        </div>
                    </div>
                </main>
            </div>
        </div>
        `;
        this._bindEvents(container);
        return container;
    },

    _bindEvents(container) {
        const form = container.querySelector('#login-form');
        const btn = container.querySelector('#login-btn');
        const errorMsg = container.querySelector('#error-message');
        const pwInput = container.querySelector('#password');
        const togglePw = container.querySelector('#toggle-pw');

        togglePw.addEventListener('click', () => {
            const mostrar = pwInput.type === 'password';
            pwInput.type = mostrar ? 'text' : 'password';
            togglePw.setAttribute('aria-label', mostrar ? 'Ocultar contraseña' : 'Mostrar contraseña');
        });

        container.querySelector('#forgot').addEventListener('click', (e) => {
            e.preventDefault();
            showError('Para restablecer tu contraseña, comunícate con el superadministrador del distrito si eres administrador de una institución; si eres estudiante, acércate al administrador de tu institución para recibir las instrucciones.');
        });

        const showError = (message) => {
            errorMsg.textContent = message;
            errorMsg.classList.remove('hidden');
        };

        const hideError = () => errorMsg.classList.add('hidden');

        const setLoading = (loading) => {
            btn.disabled = loading;
            btn.textContent = loading ? 'Iniciando sesión...' : 'Iniciar sesión';
        };

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            hideError();

            const username = container.querySelector('#username').value.trim();
            const password = pwInput.value;

            if (!username || !password) {
                showError('Completa usuario y contraseña.');
                return;
            }

            setLoading(true);
            try {
                await Auth.login(username, password);
                // No navegamos aquí: Auth.login() dispara _notify(), que hace
                // que el router (suscrito vía Auth.onChange) resuelva la ruta
                // y redirija solo. Navegar también aquí duplicaba el render
                // del dashboard (carrera entre dos resolve() concurrentes).
            } catch (error) {
                if (error instanceof ApiError) {
                    showError(error.message);
                } else {
                    showError('Ocurrió un error inesperado. Intenta de nuevo.');
                    console.error(error);
                }
            } finally {
                setLoading(false);
            }
        });
    }
};

export default Login;
