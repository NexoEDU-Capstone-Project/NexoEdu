/**
 * @openapi
 * /api/admins:
 *   post:
 *     summary: Crea un administrador institucional (solo SUPERADMIN)
 *     tags: [Admins]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, password]
 *             properties:
 *               username:
 *                 type: string
 *                 example: colegio_san_jose_admin
 *               password:
 *                 type: string
 *                 example: pass123
 *               institution_id:
 *                 type: integer
 *                 description: Opcional — ID de la institución a la que se asigna el admin
 *                 example: 1
 *     responses:
 *       201:
 *         description: Administrador creado exitosamente
 *       400:
 *         description: Faltan username o password
 *       401:
 *         description: No autenticado
 *       403:
 *         description: No tienes permiso (solo SUPERADMIN)
 *       404:
 *         description: Institución no encontrada
 *       409:
 *         description: El username ya existe o la institución ya tiene admin asignado
 */

/**
 * @openapi
 * /api/admins/{id}/assign:
 *   put:
 *     summary: Asigna o cambia la institución de un administrador existente (solo SUPERADMIN)
 *     tags: [Admins]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del administrador
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [institution_id]
 *             properties:
 *               institution_id:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       200:
 *         description: Administrador asignado a la institución exitosamente
 *       400:
 *         description: Falta institution_id
 *       401:
 *         description: No autenticado
 *       403:
 *         description: No tienes permiso (solo SUPERADMIN)
 *       404:
 *         description: Institución no encontrada
 *       409:
 *         description: La institución ya tiene otro administrador asignado
 */

/**
 * @openapi
 * /api/admins/{id}:
 *   delete:
 *     summary: Desactiva un administrador (solo SUPERADMIN)
 *     tags: [Admins]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del administrador
 *     responses:
 *       200:
 *         description: Administrador desactivado exitosamente
 *       401:
 *         description: No autenticado
 *       403:
 *         description: No tienes permiso (solo SUPERADMIN)
 *       404:
 *         description: Administrador no encontrado
 */