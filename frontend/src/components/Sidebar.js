import Auth from "../modules/auth"

const Sidebar= {
    render() {
        const user= Auth.getUser()
        const aside= document.createElement("aside")
        aside.innerHTML= `
            <aside class="w-64 h-screen bg-slate-900 text-white flex flex-col shadow-lg">
                <div class="p-6 border-b border-slate-700">
                    <h1 class="text-2xl font-bold">Panel</h1>
                </div>

                <nav class="flex-1 p-4">
                    <ul id="sidebar-options" class="space-y-2">
                    </ul>
                </nav>
            </aside>
        `
        const sidebar= document.getElementById("sidebar-options")
        if(user.role=== "superadmin"){
            sidebar.innerHTML= `
                <li>
                    <a id="superadmin_dashboard" href="/dashboard-general" class="block px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors duration-200">
                        Dashboard
                    </a>
                </li>
                <li>
                    <a id="gestionate_events" href="/gestion-eventos" class="block px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors duration-200">
                        Gestión eventos
                    </a>
                </li>
                <li>
                    <a id="all_schools" href="/gestion-escuelas" class="block px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors duration-200">
                        Gestión escuelas
                    </a>
                </li>
                `
                // Ver escuelas y sus detalles (director, profesores, contacto, direccion)
        }
        else if(user.role=== "admin"){
            sidebar.innerHTML= `
                <li>
                    <a id="school_dashboard" href="/dashboard-escuela" class="block px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors duration-200">
                        Dashboard
                    </a>
                </li>
                <li>
                    <a id="students" href="/gestion-estudiantes" class="block px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors duration-200">
                        Gestión estudiantes
                    </a>
                </li>
                <li>
                    <a id="gestionate_events" href="/eventos-propios" class="block px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors duration-200">
                        Gestión eventos/campañas
                    </a>
                </li>
                `
                //Dashboard de su escuela, eventos y campañas de su escuela, lista de estudiantes completa 
        }
        else if(user.role=== "estudiante"){
            sidebar.innerHTML= `
                <li>
                    <a id="events" href="/ver-eventos" class="block px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors duration-200">
                        Eventos
                    </a>
                </li>`
                //Ver eventos y convocatorias para aplicar a ellos y sus resultados, feature de actualizacion de datos
                //Ejemplo: setTimeOut que detecte informacion vieja cada cierto tiempo y le pida actualizarla obligatoriamente
                //si desea aplicar a un evento o campaña.
        }
        sidebar.innerHTML+= `
            <li>
                <a id="configuration" href="/configuracion" class="block px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors duration-200">
                    Configuración
                </a>
            </li>`
    }
}