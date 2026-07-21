import Auth from "./auth";
import { DASHBOARD_POR_ROL } from "./config.js";

const Router = {
    routes: {},

    init(routes) {
        this.routes = routes;

        //escuchar botones atras y adelante del browser
        window.addEventListener("popstate", () => this.resolve());

        document.addEventListener("click", (e) => {
            const link = e.target.closest("[data-link]");

            if (link) {
                e.preventDefault()
                this.navigate(link.getAttribute("href"));
            }
        });

        //si el usuario hace login/logout, el router re-evalua la ruta
        Auth.onChange(() => this.resolve());

        this.resolve()
    },

    navigate(path) {
        window.history.pushState({}, "", path) //con el history pushState podemos cambiar la ruta del navegador sin recargar la pagina y se cambia la URL en la barra de direccion
        this.resolve()
    },

    async resolve() {
        const path = window.location.pathname;

        if (path === "/") {
            this.navigate(Auth.isAuthenticated() ? this._dashboardSegunRol() : "/login");
            return;
        }

        // Busca coincidencia exacta o por patrón con parámetros (ej. "/instituciones/:id").
        const { route, params } = this._match(path);
        const rutaFinal = route || this.routes["/404"];

        if (rutaFinal.protected && !Auth.isAuthenticated()) {
            this.navigate("/login")
            return;
        }

        if (rutaFinal.roles && !Auth.hasRole(...rutaFinal.roles)) {
            this.navigate("/403")
            return;
        }

        if (path === "/login" && Auth.isAuthenticated()) {
            this.navigate(this._dashboardSegunRol())
            return;
        }

        await this.render(rutaFinal.view, params)
    },

    // Resuelve una ruta contra las definiciones registradas. Primero intenta
    // coincidencia exacta; si no, prueba patrones con segmentos dinámicos
    // (":param"). Devuelve { route, params }.
    _match(path) {
        if (this.routes[path]) return { route: this.routes[path], params: {} };

        const partesPath = path.split("/").filter(Boolean);
        for (const [patron, def] of Object.entries(this.routes)) {
            if (!patron.includes(":")) continue;
            const partesPatron = patron.split("/").filter(Boolean);
            if (partesPatron.length !== partesPath.length) continue;

            const params = {};
            let coincide = true;
            for (let i = 0; i < partesPatron.length; i++) {
                if (partesPatron[i].startsWith(":")) {
                    params[partesPatron[i].slice(1)] = decodeURIComponent(partesPath[i]);
                } else if (partesPatron[i] !== partesPath[i]) {
                    coincide = false;
                    break;
                }
            }
            if (coincide) return { route: def, params };
        }
        return { route: null, params: {} };
    },

    _dashboardSegunRol() {
        const user = Auth.getUser();
        return DASHBOARD_POR_ROL[user?.rol] || "/login";
    },

    async render(view, params = {}) {
        const app = document.getElementById("app");
        app.innerHTML = "" //Las vistas serán objetos con un método render() que devuelve un elemento DOM
        const veo = await view.render(params)
        app.appendChild(veo)
    }
}

export default Router;