import * as InstitutionModel from '../models/institutionModel.js';

export async function listar(req, res) {
    try {
        const instituciones = await InstitutionModel.obtenerTodas();
        res.json(instituciones);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener instituciones' });
    }
}

export async function obtenerUna(req, res) {
    try {
        const institucion = await InstitutionModel.obtenerPorId(req.params.id);
        if (!institucion) {
            return res.status(404).json({ error: 'Institución no encontrada' });
        }
        res.json(institucion);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener la institución' });
    }
}

export async function crear(req, res) {
    const { institution_name, director, address, neighborhood_id, dane_code } = req.body;

    if (!institution_name || !director || !neighborhood_id || !dane_code) {
        return res.status(400).json({ error: 'institution_name, director, neighborhood_id y dane_code son requeridos' });
    }

    try {
        const nueva = await InstitutionModel.crear(req.body);
        res.status(201).json(nueva);
    } catch (error) {
        console.error(error);
        if (error.code === '23505') { // violación de UNIQUE (dane_code o institution_name duplicado)
            return res.status(409).json({ error: 'Ya existe una institución con ese nombre o código DANE' });
        }
        res.status(500).json({ error: 'Error al crear la institución' });
    }
}

export async function actualizar(req, res) {
    const { institution_name, director, address, neighborhood_id, dane_code } = req.body;

    if (!institution_name || !director || !neighborhood_id || !dane_code) {
        return res.status(400).json({ error: 'institution_name, director, neighborhood_id y dane_code son requeridos' });
    }

    try {
        const actualizada = await InstitutionModel.actualizar(req.params.id, req.body);
        if (!actualizada) {
            return res.status(404).json({ error: 'Institución no encontrada' });
        }
        res.json(actualizada);
    } catch (error) {
        console.error(error);
        if (error.code === '23505') {
            return res.status(409).json({ error: 'Ya existe una institución con ese nombre o código DANE' });
        }
        res.status(500).json({ error: 'Error al actualizar la institución' });
    }
}

export async function eliminar(req, res) {
    try {
        const eliminada = await InstitutionModel.eliminar(req.params.id);
        if (!eliminada) {
            return res.status(404).json({ error: 'Institución no encontrada' });
        }
        res.json({ message: 'Institución eliminada', institucion: eliminada });
    } catch (error) {
        console.error(error);
        if (error.code === '23503') { // violación de FOREIGN KEY (tiene estudiantes/campañas asociadas)
            return res.status(409).json({ error: 'No se puede eliminar: la institución tiene registros asociados (estudiantes, campañas, etc.)' });
        }
        res.status(500).json({ error: 'Error al eliminar la institución' });
    }
}