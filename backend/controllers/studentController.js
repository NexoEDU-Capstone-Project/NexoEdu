import * as StudentModel from '../models/studentModel.js'
import * as CampaignModel from '../models/campaignModel.js'
export async function listar(req, res) {
    try {
        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 100);
        const offset = (page - 1) * limit;
        const search = (req.query.search || '').trim();

        let resultado;
        if (req.user.rol === 'superadmin') {
            resultado = await StudentModel.obtenerTodas({ search, limit, offset });
        } else {
            const institutionId = req.user.institution_id;
            if (!institutionId) return res.status(403).json({ error: 'Este admin no tiene una institución asignada' });
            resultado = await StudentModel.obtenerPorInstitucion(institutionId, { search, limit, offset });
        }

        res.json({
            data: resultado.estudiantes,
            pagination: {
                page, limit, total: resultado.total,
                totalPages: Math.ceil(resultado.total / limit) || 1
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener los estudiantes' });
    }
}

export async function obtenerUno(req, res) {
    try {
        if (req.user.rol === 'superadmin') {
            const estudiante = await StudentModel.obtenerPorIdTodas(req.params.id)
            if (!estudiante) {
                return res.status(404).json({ error: 'Estudiante no encontrado' })
            }
            return res.json(estudiante)
        }
        const institutionId = req.user.institution_id;
        if (!institutionId) {
            return res.status(403).json({ error: 'Este admin no tiene una institución asignada' });
        }
        const estudiante = await StudentModel.obtenerPorId(req.params.id, institutionId)
        if (!estudiante) {
            return res.status(404).json({ error: 'Estudiante no encontrado' })
        }
        res.json(estudiante)
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener el estudiante' })
    }
}

export async function crear(req, res) {
    const { people_id, status_id, grade_id, start_date, end_date } = req.body

    if (!people_id || !status_id || !grade_id || !start_date) {
        return res.status(400).json({ error: 'people_id, status_id, grade_id y start_date son requeridos' })
    }

    try {
        let institutionId;
        if (req.user.rol === 'superadmin') {
            institutionId = req.body.institution_id;
            if (!institutionId) {
                return res.status(400).json({ error: 'institution_id es requerido' })
            }
        } else {
            institutionId = req.user.institution_id;
            if (!institutionId) {
                return res.status(403).json({ error: 'Este admin no tiene una institución asignada' });
            }
        }
        const nuevo = await StudentModel.crear({
            people_id, institution_id: institutionId, status_id, grade_id, start_date, end_date
        });
        res.status(201).json(nuevo)
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ error: 'Esta persona ya tiene un perfil de estudiante' })
        }
        else if (error.code === '23503') {
            return res.status(404).json({ error: 'people_id, grade_id o status_id no existen' })
        }
        else if (error.code === '23514') {
            return res.status(400).json({ error: 'end_date no puede ser anterior a start_date' })
        }
        res.status(500).json({ error: 'Error al crear el estudiante' })
    }
}

export async function actualizar(req, res) {
    const { status_id, grade_id, start_date, end_date } = req.body

    if (!status_id || !grade_id || !start_date) {
        return res.status(400).json({ error: 'status_id, grade_id y start_date son requeridos' })
    }

    try {
        let actualizado;
        if (req.user.rol === 'superadmin') {
            actualizado = await StudentModel.actualizarTodas(req.params.id, {
                status_id, grade_id, start_date, end_date
            })
        } else {
            const institutionId = req.user.institution_id;
            if (!institutionId) {
                return res.status(403).json({ error: 'Este admin no tiene una institución asignada' });
            }
            actualizado = await StudentModel.actualizar(req.params.id, institutionId, {
                status_id, grade_id, start_date, end_date
            })
        }
        if (!actualizado) {
            return res.status(404).json({ error: 'Estudiante no encontrado' });
        }
        res.json(actualizado)
    } catch (error) {
        if (error.code === '23503') {
            return res.status(404).json({ error: 'grade_id o status_id no existen' })
        }
        else if (error.code === '23514') {
            return res.status(400).json({ error: 'end_date no puede ser anterior a start_date' })
        }
        res.status(500).json({ error: 'Error al actualizar el estudiante' })
    }
}

export async function eliminar(req, res) {
    try {
        let eliminado;
        if (req.user.rol === 'superadmin') {
            eliminado = await StudentModel.eliminarTodas(req.params.id)
        } else {
            const institutionId = req.user.institution_id;
            if (!institutionId) {
                return res.status(403).json({ error: 'Este admin no tiene una institución asignada' });
            }
            eliminado = await StudentModel.eliminar(req.params.id, institutionId)
        }
        if (!eliminado) {
            return res.status(404).json({ error: 'Estudiante no encontrado' })
        }
        res.json({ message: 'Estudiante eliminado', estudiante: eliminado })
    } catch (error) {
        console.error(error)
        if (error.code === '23503') {
            return res.status(409).json({ error: 'No se puede eliminar ya que estudiante tiene registros asociados (campañas, actualizaciones, etc...)' })
        }
        res.status(500).json({ error: 'Error al eliminar el estudiante' })
    }
}

export async function campanasElegibles(req, res) {
    try {
        const institutionId = req.user.rol === 'superadmin' ? null : req.user.institution_id;
        const estudiante = institutionId
            ? await StudentModel.obtenerPorId(req.params.id, institutionId)
            : await StudentModel.obtenerPorIdTodas(req.params.id);

        if (!estudiante) return res.status(404).json({ error: 'Estudiante no encontrado' });

        res.json(await CampaignModel.obtenerElegibles(estudiante.people_id));
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener campañas elegibles' });
    }
}