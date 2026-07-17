import * as StudentModel from '../models/studentModel.js'

async function institucionDelAdmin(req, res) {
    const institucion= await StudentModel.obtenerInstitucionPorUsername(req.user.username)
    if (!institucion) {
        res.status(403).json({ error: 'Este admin no tiene una institución asignada' })
        return null
    }
    return institucion.id;
}

export async function listar(req, res) {
    try {
        const institutionId= await institucionDelAdmin(req, res)
        if (!institutionId) return

        const estudiantes= await StudentModel.obtenerPorInstitucion(institutionId)
        res.json(estudiantes)
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener los estudiantes' })
    }
}

export async function obtenerUno(req, res) {
    try {
        const institutionId= await institucionDelAdmin(req, res)
        if (!institutionId) return

        const estudiante= await StudentModel.obtenerPorId(req.params.id, institutionId)
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
        const institutionId= await institucionDelAdmin(req, res)
        if (!institutionId) return
        const nuevo= await StudentModel.crear({
            people_id, institution_id: institutionId, status_id, grade_id, start_date, end_date
        });
        res.status(201).json(nuevo)
    } catch (error) {
        if (error.code=== '23505') {
            return res.status(409).json({ error: 'Esta persona ya tiene un perfil de estudiante' })
        }
        else if (error.code=== '23503') {
            return res.status(404).json({ error: 'people_id, grade_id o status_id no existen' })
        }
        else if (error.code=== '23514') {
            return res.status(400).json({ error: 'end_date no puede ser anterior a start_date' })
        }
        res.status(500).json({ error: 'Error al crear el estudiante' })
    }
}

export async function actualizar(req, res) {
    const { status_id, grade_id, start_date, end_date }= req.body

    if (!status_id || !grade_id || !start_date) {
        return res.status(400).json({ error: 'status_id, grade_id y start_date son requeridos' })
    }

    try {
        const institutionId= await institucionDelAdmin(req, res)
        if (!institutionId) return

        const actualizado= await StudentModel.actualizar(req.params.id, institutionId, {
            status_id, grade_id, start_date, end_date
        })
        if (!actualizado) {
            return res.status(404).json({ error: 'Estudiante no encontrado' });
        }
        res.json(actualizado)
    } catch (error) {
        if (error.code=== '23503') {
            return res.status(404).json({ error: 'grade_id o status_id no existen' })
        }
        else if (error.code=== '23514') {
            return res.status(400).json({ error: 'end_date no puede ser anterior a start_date' })
        }
        res.status(500).json({ error: 'Error al actualizar el estudiante' })
    }
}

export async function eliminar(req, res) {
    try {
        const institutionId= await institucionDelAdmin(req, res)
        if (!institutionId) return;

        const eliminado= await StudentModel.eliminar(req.params.id, institutionId)
        if (!eliminado) {
            return res.status(404).json({ error: 'Estudiante no encontrado' })
        }
        res.json({ message: 'Estudiante eliminado', estudiante: eliminado })
    } catch (error) {
        console.error(error)
        if (error.code=== '23503') { // Error de dependencia
            return res.status(409).json({ error: 'No se puede eliminar ya que estudiante tiene registros asociados (campañas, actualizaciones, etc...)' })
        }
        res.status(500).json({ error: 'Error al eliminar el estudiante' })
    }
}