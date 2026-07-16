/**
 * @openapi
 * /api/institutions:
 *   get:
 *     summary: Obtiene la lista de instituciones
 *     tags: [Institutions]
 *     responses:
 *       200:
 *         description: Lista de instituciones obtenida correctamente
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error interno del servidor
 *   post:
 *     summary: Crea una nueva institución
 *     tags: [Institutions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [institution_name, director, neighborhood_id, dane_code]
 *             properties:
 *               institution_name:
 *                 type: string
 *                 example: Instituto Técnico Nacional
 *               director:
 *                 type: string
 *                 example: Carlos Pérez
 *               address:
 *                 type: string
 *                 example: Carrera 10 # 15-20
 *               neighborhood_id:
 *                 type: integer
 *                 example: 3
 *               dane_code:
 *                 type: string
 *                 example: 12345678
 *     responses:
 *       201:
 *         description: Institución creada correctamente
 *       400:
 *         description: Datos incompletos o inválidos
 *       401:
 *         description: No autorizado
 *       409:
 *         description: Ya existe una institución con ese nombre o código DANE
 *       500:
 *         description: Error interno del servidor
 */

/**
 * @openapi
 * /api/institutions/{id}:
 *   get:
 *     summary: Obtiene una institución por su ID
 *     tags: [Institutions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la institución
 *     responses:
 *       200:
 *         description: Institución encontrada correctamente
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Institución no encontrada
 *       500:
 *         description: Error interno del servidor
 *   put:
 *     summary: Actualiza una institución existente
 *     tags: [Institutions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la institución
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [institution_name, director, neighborhood_id, dane_code]
 *             properties:
 *               institution_name:
 *                 type: string
 *                 example: Instituto Técnico Nacional
 *               director:
 *                 type: string
 *                 example: Carlos Pérez
 *               address:
 *                 type: string
 *                 example: Carrera 10 # 15-20
 *               neighborhood_id:
 *                 type: integer
 *                 example: 3
 *               dane_code:
 *                 type: string
 *                 example: 12345678
 *     responses:
 *       200:
 *         description: Institución actualizada correctamente
 *       400:
 *         description: Datos incompletos o inválidos
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Institución no encontrada
 *       409:
 *         description: Ya existe una institución con ese nombre o código DANE
 *       500:
 *         description: Error interno del servidor
 *   delete:
 *     summary: Elimina una institución por su ID
 *     tags: [Institutions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la institución
 *     responses:
 *       200:
 *         description: Institución eliminada correctamente
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Institución no encontrada
 *       409:
 *         description: No se puede eliminar porque tiene registros asociados
 *       500:
 *         description: Error interno del servidor
 */