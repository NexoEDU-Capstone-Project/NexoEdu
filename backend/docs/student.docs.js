/**
 * @openapi
 * /api/students:
 *   get:
 *     summary: Lista estudiantes. Superadmin ve todos; administrador ve solo los de su institución
 *     tags: [Students]
 *     responses:
 *       200:
 *         description: Lista de estudiantes obtenida correctamente
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Sin permiso, o el admin no tiene institución asignada
 *       500:
 *         description: Error interno del servidor
 *   post:
 *     summary: Crea un nuevo perfil de estudiante (superadmin o administrador)
 *     tags: [Students]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [people_id, status_id, grade_id, start_date]
 *             properties:
 *               people_id:
 *                 type: integer
 *                 description: ID de la persona a convertir en estudiante
 *                 example: 15
 *               institution_id:
 *                 type: integer
 *                 description: Requerido si quien crea es superadmin (el admin usa su propia institución automáticamente)
 *                 example: 1
 *               status_id:
 *                 type: integer
 *                 example: 1
 *               grade_id:
 *                 type: integer
 *                 example: 3
 *               start_date:
 *                 type: string
 *                 format: date
 *                 description: Fecha de entrada a la escuela
 *                 example: 2024-01-15
 *               end_date:
 *                 type: string
 *                 format: date
 *                 nullable: true
 *                 description: Fecha de egreso. Null si el estudiante sigue activo
 *                 example: null
 *     responses:
 *       201:
 *         description: Estudiante creado correctamente
 *       400:
 *         description: Datos incompletos, inválidos, end_date anterior a start_date, o falta institution_id (superadmin)
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Sin permiso, o el admin no tiene institución asignada
 *       404:
 *         description: people_id, grade_id o status_id no existen
 *       409:
 *         description: Esa persona ya tiene un perfil de estudiante
 *       500:
 *         description: Error interno del servidor
 */

/**
 * @openapi
 * /api/students/{id}:
 *   get:
 *     summary: Obtiene un estudiante por su ID. Superadmin ve cualquiera; administrador solo si es de su institución
 *     tags: [Students]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del perfil de estudiante (student_profiles.id)
 *     responses:
 *       200:
 *         description: Estudiante encontrado correctamente
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Sin permiso, o el admin no tiene institución asignada
 *       404:
 *         description: Estudiante no encontrado
 *       500:
 *         description: Error interno del servidor
 *   put:
 *     summary: Actualiza estado, grado o fechas de un estudiante existente (superadmin o administrador)
 *     tags: [Students]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del perfil de estudiante (student_profiles.id)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status_id, grade_id, start_date]
 *             properties:
 *               status_id:
 *                 type: integer
 *                 example: 2
 *               grade_id:
 *                 type: integer
 *                 example: 4
 *               start_date:
 *                 type: string
 *                 format: date
 *                 example: 2024-01-15
 *               end_date:
 *                 type: string
 *                 format: date
 *                 nullable: true
 *                 example: 2025-11-30
 *     responses:
 *       200:
 *         description: Estudiante actualizado correctamente
 *       400:
 *         description: Datos incompletos, inválidos o end_date anterior a start_date
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Sin permiso, o el admin no tiene institución asignada
 *       404:
 *         description: Estudiante no encontrado, o grade_id/status_id no existen
 *       500:
 *         description: Error interno del servidor
 *   delete:
 *     summary: Elimina un perfil de estudiante por su ID (superadmin o administrador)
 *     tags: [Students]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del perfil de estudiante (student_profiles.id)
 *     responses:
 *       200:
 *         description: Estudiante eliminado correctamente
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Sin permiso, o el admin no tiene institución asignada
 *       404:
 *         description: Estudiante no encontrado
 *       409:
 *         description: No se puede eliminar porque tiene registros asociados (campañas, actualizaciones, etc.)
 *       500:
 *         description: Error interno del servidor
 */
