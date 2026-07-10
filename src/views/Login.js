import Auth from "../modules/auth";
import Router from "../modules/router";
import { API_URL } from "../modules/auth";

const Login = {
    async render() {
        const container = document.createElement("div")
        container.className = "min-h-screen flex items-center justify-center bg-blue-100 px-4";

        container.innerHTML = `
        <div class="max-w-md w-full bg-white shadow-xl p-8">
                <div class="text-center mb-8">
                    <h2 class="text-3xl font-bold text-gray-800">Bienvenido</h2>
                    <p class="text-gray-500 mt-2">Ingresa a tu cuenta para continuar</p>
                </div>
 
                <form id="login-form" class="space-y-6">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
                        <input type="email" id="email" required 
                            class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            placeholder="tu@email.com">
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                        <input type="password" id="password" required 
                            class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            placeholder="••••••••">
                    </div>

                    <div id="error-message" class="hidden text-red-500 text-sm text-center bg-red-50 rounded-lg py-2"></div>

                    <button id="login-btn" type="submit" 
                        class="w-full cursor-pointer bg-black hover:bg-gray-900 text-white font-bold py-3 transition-colors shadow-lg hover:shadow-xl active:transform active:scale-[0.98]">
                        Iniciar Sesión
                    </button>
                </form>
                <form id="login-form" class="space-y-6">
                    <label class"block text-sm font-medium text-gray-700 mb-1">Country</label>
                    <input id="country-input" type="text" placeholder="Sudan">
                    <label class"block text-sm font-medium text-gray-700 mb-1">Capital</label>
                    <input id="capital-input" type="text" placeholder="Khartoum">
                    <button id="country-btn" type="submit" 
                        class="w-full cursor-pointer bg-black hover:bg-gray-900 text-white font-bold py-3 transition-colors shadow-lg hover:shadow-xl active:transform active:scale-[0.98]">
                        Añadir país
                    </button>
                </form>
            </div>
        `;
        this._bindEvents(container);
        return container;
    },

    _bindEvents(container) {
        const form = container.querySelector("#login-form");
        const btn = container.querySelector("#login-btn");
        const errorMSG = container.querySelector("#error-message")

        const setLoading = (loading) => {
            btn.disabled = loading;
            btn.textContent = loading ? "Iniciar Sesion..." : "Iniciar Sesion";
            btn.className = loading
                ? "w-full cursor-pointer bg-black hover:bg-gray-900 text-white font-semibold py-2.5  cursor-not-allowed"
                : "w-full cursor-pointer bg-black hover:bg-gray-900 text-white font-semibold py-2.5 transition-colors duration-200";
        };

        btn.addEventListener('click', async (e) => {
            e.preventDefault()
            const email = container.querySelector("#email").value;
            const password = container.querySelector("#password").value

            if (!email || !password) {
                showError("Please fill in all fields.");
                return;
            }

            setLoading(true)

            try {
                await Auth.Login(email, password)
                Router.navigate("/dashboard")
            }
            catch (error) {
                errorMSG.textContent = error.message;
                errorMSG.classList.remove("hidden")
            } finally {
                setLoading(false)
            }
        });
        container.addEventListener("keydown", (e) => {
            if (e.key === "Enter") btn.click()
        })
    }
}

export default Login;