import * as CampaignModel from '../models/campaignModel.js';
import * as StudentModel from '../models/studentModel.js';

export async function crear(req, res) {
    const { title, type, description, sponsor, start_date, end_date, url_multimedia, scope_type, neighborhood_id, localities_id } = req.body;

    if (!title || !start_date || !scope_type) {
        return res.status(400).json({ error: 'title, start_date y scope_type son requeridos' });
    }

    // Si es admin institucional, la campaña SIEMPRE queda atada a SU institución (no la elige libremente)
    let institution_id = null;
    if (req.user.rol === 'administrador') {
        if (!req.user.institution_id) {
            return res.status(403).json({ error: 'Tu credencial no tiene una institución asignada' });
        }
        if (scope_type !== 'INSTITUTION') {
            return res.status(403).json({ error: 'Un administrador solo puede crear campañas de alcance institucional' });
        }
        institution_id = req.user.institution_id;
    } else if (scope_type === 'INSTITUTION') {
        institution_id = req.body.institution_id;
        if (!institution_id) {
            return res.status(400).json({ error: 'institution_id es requerido para scope_type INSTITUTION' });
        }
    }

    try {
        const campaign = await CampaignModel.crearConScope({
            title, type, description, sponsor, start_date, end_date, url_multimedia,
            created_by_credentials_id: req.user.id,
            scope_type,
            institution_id,
            neighborhood_id: scope_type === 'NEIGHBORHOOD' ? neighborhood_id : null,
            localities_id: scope_type === 'LOCALITY' ? localities_id : null
        });

        res.status(201).json(campaign);
    } catch (error) {
        console.error(error);
        if (error.code === '23514') {
            return res.status(400).json({ error: 'Combinación de alcance inválida' });
        }
        if (error.code === '23503') {
            return res.status(404).json({ error: 'institution_id, neighborhood_id o localities_id no existen' });
        }
        if (error.code === '23505') {
            return res.status(409).json({ error: 'Ya existe una campaña con ese título' });
        }
        res.status(500).json({ error: 'Error al crear la campaña' });
    }
}

export async function listar(req, res) {
    try {
        res.json(await CampaignModel.obtenerTodas());
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener campañas' });
    }
}

export async function obtenerUna(req, res) {
    try {
        const campaign = await CampaignModel.obtenerPorId(req.params.id);
        if (!campaign) return res.status(404).json({ error: 'Campaña no encontrada' });
        res.json(campaign);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener la campaña' });
    }
}

export async function crearCriteria(req, res) {
    const { gender_id, min_age, max_age, grade_id, status_id } = req.body;
    const campaignId = req.params.id;

    try {
        const campana = await CampaignModel.obtenerPorId(campaignId);
        if (!campana) return res.status(404).json({ error: 'Campaña no encontrada' });

        if (req.user.rol !== 'superadmin' && campana.created_by_credentials_id !== req.user.id) {
            return res.status(403).json({ error: 'Solo el creador de la campaña o un superadmin pueden definir sus criterios' });
        }

        const criterio = await CampaignModel.crearCriteria({
            campaign_id: campaignId, gender_id, min_age, max_age, grade_id, status_id
        });

        res.status(201).json(criterio);
    } catch (error) {
        console.error(error);
        if (error.code === '23514') {
            return res.status(400).json({ error: 'min_age no puede ser mayor a max_age' });
        }
        if (error.code === '23503') {
            return res.status(404).json({ error: 'gender_id, grade_id o status_id no existen' });
        }
        res.status(500).json({ error: 'Error al crear los criterios de la campaña' });
    }
}

export async function obtenerCriteria(req, res) {
    try {
        const criterio = await CampaignModel.obtenerCriteria(req.params.id);
        if (!criterio) return res.status(404).json({ error: 'Esta campaña no tiene criterios definidos' });
        res.json(criterio);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener los criterios de la campaña' });
    }
}

export async function misCampanas(req, res) {
    if (!req.user.people_id) {
        return res.status(403).json({ error: 'Tu credencial no está asociada a una persona' });
    }
    try {
        res.json(await CampaignModel.obtenerElegibles(req.user.people_id));
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener tus campañas' });
    }
}

export async function inscribirse(req, res) {
    if (!req.user.people_id) {
        return res.status(403).json({ error: 'Tu credencial no está asociada a una persona' });
    }
    const campaignId = Number(req.params.id);

    try {
        const elegibles = await CampaignModel.obtenerElegibles(req.user.people_id);
        const esElegible = elegibles.some(c => c.id === campaignId);
        if (!esElegible) {
            return res.status(403).json({ error: 'No eres elegible para esta campaña, o ya no está vigente' });
        }

        const perfil = await StudentModel.obtenerPorPeopleId(req.user.people_id);
        if (!perfil) {
            return res.status(404).json({ error: 'No se encontró tu perfil de estudiante' });
        }

        const inscripcion = await CampaignModel.crearEnrollment({
            campaign_id: campaignId,
            student_profile_id: perfil.id
        });

        res.status(201).json(inscripcion);
    } catch (error) {
        console.error(error);
        if (error.code === '23505') {
            return res.status(409).json({ error: 'Ya estás inscrito en esta campaña' });
        }
        res.status(500).json({ error: 'Error al inscribirse en la campaña' });
    }
}