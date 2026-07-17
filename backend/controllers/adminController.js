import * as AdminModel from '../models/adminModel.js';
import { obtenerRolId } from '../helpers/roles.js';

export async function crearAdmin(req, res) {
    const { username, password, institution_id } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'username y password son requeridos' });
    }

    try {
        const usernameExiste = await AdminModel.existeUsername(username);
        if (usernameExiste) {
            return res.status(409).json({ error: 'El nombre de usuario ya existe' });
        }

        const roleId = await obtenerRolId('administrador');
        if (!roleId) {
            return res.status(500).json({ error: 'Error de configuración: rol administrador no encontrado' });
        }

        if (institution_id) {
            const institucionExiste = await AdminModel.existeInstitucion(institution_id);
            if (!institucionExiste) {
                return res.status(404).json({ error: 'Institución no encontrada' });
            }
        }

        const credencial = await AdminModel.crearCredencial({ username, password, role_id: roleId });

        let institucion = null;
        if (institution_id) {
            institucion = await AdminModel.asignarAInstitucion(credencial.id, institution_id);
            if (!institucion) {
                return res.status(404).json({ error: 'Institución no encontrada' });
            }
        }

        res.status(201).json({
            message: 'administrador creado exitosamente',
            admin: { id: credencial.id, username: credencial.username },
            institucion: institucion
                ? { id: institucion.id, institution_name: institucion.institution_name }
                : null
        });
    } catch (error) {
        console.error(error);
        if (error.code === '23505') {
            return res.status(409).json({ error: 'Esa institución ya tiene un administrador asignado' });
        }
        if (error.code === '23503') {
            return res.status(404).json({ error: 'La institución especificada no existe' });
        }
        res.status(500).json({ error: 'Error al crear el administrador' });
    }
}

export async function asignarInstitucion(req, res) {
    const { id } = req.params;
    const { institution_id } = req.body;

    if (!institution_id) {
        return res.status(400).json({ error: 'institution_id es requerido' });
    }

    try {
        const institucion = await AdminModel.asignarAInstitucion(id, institution_id);
        if (!institucion) {
            return res.status(404).json({ error: 'Institución no encontrada' });
        }
        res.json({
            message: 'administrador asignado a la institución exitosamente',
            institucion
        });
    } catch (error) {
        console.error(error);
        if (error.code === '23505') {
            return res.status(409).json({ error: 'Esa institución ya tiene un administrador asignado' });
        }
        if (error.code === '23503') {
            return res.status(404).json({ error: 'La institución especificada no existe' });
        }
        res.status(500).json({ error: 'Error al asignar la institución' });
    }
}

export async function eliminarAdmin(req, res) {
    try {
        const roleId = await obtenerRolId('administrador');
        const admin = await AdminModel.eliminar(req.params.id, roleId);
        if (!admin) {
            return res.status(404).json({ error: 'administrador no encontrado' });
        }
        res.json({ message: 'administrador eliminado', admin });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al eliminar el administrador' });
    }
}