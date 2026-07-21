import * as StudentModel from '../models/studentModel.js';

/**
 * Middleware que verifica que el admin institucional logueado solo pueda
 * operar sobre estudiantes de SU PROPIA institución. El superadmin no tiene
 * esta restricción (puede operar sobre cualquier institución).
 *
 * Debe usarse DESPUÉS de authToken (necesita req.user) y para rutas que
 * reciben el id de la persona/estudiante en req.params.id.
 *
 * Cómo funciona:
 *  - Si req.user.rol === 'superadmin' -> pasa siempre.
 *  - Si req.user.rol === 'administrador' -> busca el student_profile de
 *    req.params.id y compara su institution_id contra req.user.institution_id.
 *    Si no coinciden, o el admin no tiene institution_id asignado, 403.
 */
export default async function requireSameInstitution(req, res, next) {
    const usuario = req.user;

    if (!usuario) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    if (usuario.rol === 'superadmin') {
        return next();
    }

    if (usuario.rol !== 'administrador') {
        return res.status(403).json({ error: 'Usuario no autorizado' });
    }

    if (!usuario.institution_id) {
        return res.status(403).json({ error: 'El administrador no tiene una institución asignada' });
    }

    try {
        const persona = await StudentModel.obtenerPorId(req.params.id);
        if (!persona) {
            return res.status(404).json({ error: 'Persona no encontrada' });
        }

        if (persona.institution_id !== usuario.institution_id) {
            return res.status(403).json({ error: 'No tienes permiso sobre estudiantes de otra institución' });
        }

        next();
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al validar la institución del estudiante' });
    }
}

/**
 * Variante para rutas de CREACIÓN (POST), donde no hay req.params.id todavía
 * porque el estudiante no existe. En vez de comparar contra un registro
 * existente, fuerza que el institution_id del body coincida con el del
 * admin logueado (y lo sobreescribe si falta, por conveniencia).
 */
export function requireSameInstitutionOnCreate(req, res, next) {
    const usuario = req.user;

    if (!usuario) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    if (usuario.rol === 'superadmin') {
        return next();
    }

    if (usuario.rol !== 'administrador') {
        return res.status(403).json({ error: 'Usuario no autorizado' });
    }

    if (!usuario.institution_id) {
        return res.status(403).json({ error: 'El administrador no tiene una institución asignada' });
    }

    if (req.body.institution_id && Number(req.body.institution_id) !== usuario.institution_id) {
        return res.status(403).json({ error: 'No puedes crear estudiantes para otra institución' });
    }

    req.body.institution_id = usuario.institution_id;
    next();
}
