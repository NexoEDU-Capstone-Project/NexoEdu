import * as CampaignModel from '../models/campaignModel.js';

/**
 * Autorización sobre una campaña concreta (rutas con :id).
 *
 * Reglas de negocio acordadas:
 *
 *  - superadmin: acceso total. Puede ver, editar y eliminar cualquier
 *    campaña, incluidas las creadas por las instituciones.
 *
 *  - administrador:
 *      · Editar / eliminar -> SOLO las campañas que él mismo creó
 *        (campaigns.created_by_credentials_id === su credential_id).
 *      · Ver -> las campañas globales del superadmin y las de su propia
 *        institución. Nunca las de otra institución.
 *
 * Sin este middleware, requireRole('superadmin','administrador') solo
 * verificaba el ROL, no la PROPIEDAD: cualquier admin autenticado podía
 * eliminar una campaña global enviando su id (DELETE /api/campaigns/1).
 */

// Para PUT y DELETE: exige ser el creador (o superadmin).
export async function requireCampaignOwner(req, res, next) {
    const usuario = req.user;

    if (!usuario) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    if (usuario.rol === 'superadmin') {
        return next();
    }

    try {
        const campania = await CampaignModel.obtenerPorId(req.params.id);
        if (!campania) {
            return res.status(404).json({ error: 'Campaña no encontrada' });
        }

        if (campania.created_by_credentials_id !== usuario.credential_id) {
            return res.status(403).json({ error: 'Solo puedes modificar campañas creadas por ti' });
        }

        next();
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al validar los permisos sobre la campaña' });
    }
}

// Para GET /:id: exige que la campaña sea visible para el usuario.
export async function requireCampaignVisible(req, res, next) {
    const usuario = req.user;

    if (!usuario) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    if (usuario.rol === 'superadmin') {
        return next();
    }

    if (!usuario.institution_id) {
        return res.status(403).json({ error: 'El administrador no tiene una institución asignada' });
    }

    try {
        const campania = await CampaignModel.obtenerPorId(req.params.id);
        if (!campania) {
            return res.status(404).json({ error: 'Campaña no encontrada' });
        }

        // Es visible si le aplica a su institución (por scope de institución,
        // barrio o localidad). obtenerPorInstitucion ya implementa esa lógica,
        // así que se reutiliza en vez de duplicar la consulta de alcance.
        const visibles = await CampaignModel.obtenerPorInstitucion(usuario.institution_id);
        const esVisible = visibles.some((c) => c.id === campania.id);

        if (!esVisible) {
            return res.status(403).json({ error: 'No tienes permiso para ver esta campaña' });
        }

        next();
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al validar los permisos sobre la campaña' });
    }
}
