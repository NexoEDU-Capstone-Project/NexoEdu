import Auth from "./auth";

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
        const route = this.routes[path] || this.routes["/404"] //se dirije a la pagina que se señale de lo contrario manda a 404

        if (route.protected && !Auth.isAuthenticated()) {
            this.navigate("/login")
            return;
        }

        if (path === "/login" && Auth.isAuthenticated()) {
            this.navigate("/dashboard")
            return;
        }

        await this.render(route.view)
    },

    async render(view) {
        const app = document.getElementById("app");
        app.innerHTML = "" //Las vistas serán objetos con un método render() que devuelve un elemento DOM
        const veo = await view.render()
        app.appendChild(veo)
    }
}

export default Router;