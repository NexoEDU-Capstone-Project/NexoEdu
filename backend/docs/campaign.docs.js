/**
 * @openapi
 * /api/campaigns:
 *   get:
 *     summary: Lista todas las campañas con su alcance
 *     tags: [Campaigns]
 *     responses:
 *       200:
 *         description: Lista de campañas
 *       401:
 *         description: No autenticado
 *   post:
 *     summary: Crea una campaña (superadmin o administrador)
 *     tags: [Campaigns]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, start_date, scope_type]
 *             properties:
 *               title:
 *                 type: string
 *               type:
 *                 type: string
 *               description:
 *                 type: string
 *               sponsor:
 *                 type: string
 *               start_date:
 *                 type: string
 *                 format: date
 *               end_date:
 *                 type: string
 *                 format: date
 *               url_multimedia:
 *                 type: string
 *               scope_type:
 *                 type: string
 *                 enum: [LOCALITY, NEIGHBORHOOD, INSTITUTION]
 *               institution_id:
 *                 type: integer
 *                 description: Requerido si scope_type es INSTITUTION y quien crea es superadmin (los admins usan su propia institución automáticamente)
 *               neighborhood_id:
 *                 type: integer
 *                 description: Requerido si scope_type es NEIGHBORHOOD
 *               localities_id:
 *                 type: integer
 *                 description: Requerido si scope_type es LOCALITY
 *     responses:
 *       201:
 *         description: Campaña creada exitosamente, incluye su scope
 *       400:
 *         description: Faltan campos requeridos o combinación de alcance inválida
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Sin permiso (rol incorrecto, o admin sin institución asignada, o admin intentando un scope distinto a INSTITUTION)
 */

/**
 * @openapi
 * /api/campaigns/{id}:
 *   get:
 *     summary: Obtiene una campaña por id, con su alcance
 *     tags: [Campaigns]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Campaña encontrada
 *       404:
 *         description: Campaña no encontrada
 */

/**
 * @openapi
 * /api/campaigns/{id}/criteria:
 *   post:
 *     summary: Define los criterios demográficos de una campaña (solo el creador o superadmin)
 *     tags: [Campaigns]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               gender_id:
 *                 type: integer
 *               min_age:
 *                 type: integer
 *               max_age:
 *                 type: integer
 *               grade_id:
 *                 type: integer
 *               status_id:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Criterios creados
 *       400:
 *         description: min_age mayor a max_age
 *       403:
 *         description: No eres el creador de la campaña ni superadmin
 *       404:
 *         description: Campaña, género, grado o estado no encontrado
 */

/**
 * @openapi
 * /api/campaigns/{id}/criteria:
 *   get:
 *     summary: Obtiene los criterios demográficos de una campaña
 *     tags: [Campaigns]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Criterios de la campaña
 *       404:
 *         description: La campaña no tiene criterios definidos
 */