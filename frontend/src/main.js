import './style.css';
import Router from './modules/router.js';
import { initModalA11y } from './components/modalA11y.js';
import Login from './views/Login.js';
import NotFound from './views/NotFound.js';
import Forbidden from './views/Forbidden.js';
import DashboardSuperadmin from './views/DashboardSuperadmin.js';
import GestionInstituciones from './views/GestionInstituciones.js';
import InstitucionPerfil from './views/InstitucionPerfil.js';
import GestionAdmins from './views/GestionAdmins.js';
import DashboardEscuela from './views/DashboardEscuela.js';
import GestionEstudiantes from './views/GestionEstudiantes.js';
import GestionCampanias from './views/GestionCampanias.js';
import MisCampanias from './views/MisCampanias.js';
import MiPerfil from './views/MiPerfil.js';

const routes = {
    '/login': { view: Login, protected: false },

    // Super Admin
    '/dashboard-superadmin': { view: DashboardSuperadmin, protected: true, roles: ['superadmin'] },
    '/gestion-instituciones': { view: GestionInstituciones, protected: true, roles: ['superadmin'] },
    '/instituciones/:id': { view: InstitucionPerfil, protected: true, roles: ['superadmin'] },
    '/gestion-admins': { view: GestionAdmins, protected: true, roles: ['superadmin'] },
    '/gestion-campanias': { view: GestionCampanias, protected: true, roles: ['superadmin'] },

    // Admin institucional
    '/dashboard-escuela': { view: DashboardEscuela, protected: true, roles: ['administrador'] },
    '/gestion-estudiantes': { view: GestionEstudiantes, protected: true, roles: ['administrador'] },
    '/campanias-institucion': { view: GestionCampanias, protected: true, roles: ['administrador'] },

    // Estudiante / egresado
    '/mis-campanias': { view: MisCampanias, protected: true, roles: ['estudiante'] },
    '/mi-perfil': { view: MiPerfil, protected: true, roles: ['estudiante'] },

    '/403': { view: Forbidden, protected: false },
    '/404': { view: NotFound, protected: false }
};

initModalA11y();
Router.init(routes);
