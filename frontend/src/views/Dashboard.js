import Auth, { API_URL } from "../modules/auth";
import Navbar from "../components/Navbar";

const Dashboard = {
    async render() {
        const user = Auth.getUser();
        const reservation = await this._fetchReservation(user)
        const container = document.createElement("div")
        container.className = "min-h-screen bg-blue-50";

        container.appendChild(Navbar.render())

        const content = document.createElement("main")
        content.className = "max-w-7xl mx-auto px-6 py-10";

        content.innerHTML = `
         <div class="mb-8">
        <h2 class="text-2xl font-bold text-gray-800">
          Welcome back, ${user.name} 
        </h2>
        <p class="text-gray-500 mt-1 capitalize">Role: ${user.role}</p>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
        ${this._renderStats(reservation, user)}
      </div>

      <!-- Accesos rápidos -->
      <div class="bg-white rounded-2xl shadow p-6">
        <h3 class="text-lg font-semibold text-gray-700 mb-4">Acceso Rapido</h3>
        <div class="flex gap-4 flex-wrap">
          <a data-link href="/Reservations"
            class="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors">
             Ver Reservaciones
          </a>
          ${Auth.isUser() ? `
          <a data-link href="/Reservations"
            class="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors">
            Nueva Reservacion
          </a>` : ""}
        </div>
      </div>
        `;
        container.appendChild(content)
        return container;
    },

    async _fetchReservation(user) {
        try {
            const res = await fetch(`${API_URL}/Reservations`)
            const all = await res.json()

            if (Auth.isAdmin()) {
                return all
            } else {
                return all.filter(p => String(p.assignedTo) === String(user.id))
            }
        } catch {
            return []
        }
    },

    _renderStats(reservation, user) {
        if (Auth.isAdmin()) {
            const total = reservation.length
            const approved = reservation.filter(p => p.status === "Aprobada").length;
            const rejected = reservation.filter(p => p.status === "Rechazada").length;
            const canceled = reservation.filter(p => p.status === "Cancelada").length;
            const pending = reservation.filter(p => p.status === "Pendiente").length;

            return `
            ${this._statCard("Total Reservas", total, "bg-blue-300")}
            ${this._statCard("Total Aprobadas", approved, "bg-green-300")}
            ${this._statCard("Total Rechazadas", rejected, "bg-red-300")}
            ${this._statCard("Total Canceladas", canceled, "bg-gray-300")}
            ${this._statCard("Total Pendientes", pending, "bg-yellow-300")}
            `;
        } else { //para el user
            const total = reservation.length
            const pending = reservation.filter(p => p.status === "Pendiente").length;
            const approved = reservation.filter(p => p.status === "Aprobada").length;
            const canceled = reservation.filter(p => p.status === "Cancelada").length;

            const rejected = reservation.filter(p => p.status === "Rechazada").length;

            return `
            ${this._statCard("Total Reservas", total, "bg-blue-300")}
            ${this._statCard("Total Aprobadas", approved, "bg-green-300")}
            ${this._statCard("Total Pendientes", pending, "bg-yellow-300")}
            ${this._statCard("Total Canceladas", canceled, "bg-gray-300")}
            ${this._statCard("Total Rechazadas", rejected, "bg-red-300")}
            `
        }
    },

    _statCard(label, value, color) {
        return `
           <div class="bg-white rounded-2xl shadow p-6 flex items-center gap-4">
        <div class="w-12 h-12 ${color} rounded-xl flex items-center justify-center text-gray-900 text-xl font-bold">
          ${value}
        </div>
        <div>
          <p class="text-gray-500 text-sm">${label}</p>
        </div>
      </div> 
        `;
    }
}

export default Dashboard;