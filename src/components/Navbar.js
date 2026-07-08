import Auth from "../modules/auth";
import Router from "../modules/router";

const Navbar = {
    render() {
        const user = Auth.getUser();

        const nav = document.createElement("nav")
        nav.className = "bg-white shadow-sm sticky top-0 z-50"

        nav.innerHTML = `
        <div class="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
        
        <!-- Logo -->
        <div class="flex items-center gap-2">
          <span class="text-blue-600 text-xl font-bold">Reservation manage</span>
        </div>

        <!-- Links -->
        <div class="flex items-center gap-6">
          <a data-link href="/dashboard"
            class="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">
            Home
          </a>
          <a data-link href="/Reservations"
            class="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">
            Reservaciones
          </a>
        </div>

        <!-- Usuario + Logout -->
        <div class="flex items-center gap-4">
          <div class="text-right hidden sm:block">
            <p class="text-sm font-semibold text-gray-700">${user.name}</p>
            <p class="text-xs text-gray-400 capitalize">${user.role}</p>
          </div>
          <div class="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
            ${user.name.charAt(0).toUpperCase()}
          </div>
          <button id="logout-btn"
            class="text-sm text-red-500 hover:text-red-700 cursor-pointer font-medium transition-colors">
            Logout
          </button>
        </div>

      </div>
        `;

        nav.querySelector("#logout-btn").addEventListener('click', (e) => {
            e.preventDefault()
            if (confirm("Estas seguro que quieres cerrar sesion?")) {
                Auth.logout();
                Router.navigate("/")
            }
        });

        return nav
    }
}

export default Navbar;