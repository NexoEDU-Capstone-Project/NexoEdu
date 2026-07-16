/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Inicia sesión con username y password
 *     tags: [Auth]
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
 *                 example: superadmin@gmail.com
 *               password:
 *                 type: string
 *                 example: admin
 *     responses:
 *       200:
 *         description: Login exitoso. Devuelve accessToken, refreshToken y datos del usuario. También setea una cookie httpOnly con el accessToken.
 *       400:
 *         description: Falta username o password
 *       401:
 *         description: Usuario o contraseña incorrectos
 */

/**
 * @openapi
 * /api/auth/refresh:
 *   post:
 *     summary: Genera un nuevo accessToken a partir de un refreshToken válido
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Nuevo accessToken generado
 *       401:
 *         description: Refresh token inválido, expirado o no proporcionado
 */

/**
 * @openapi
 * /api/auth/logout:
 *   post:
 *     summary: Cierra la sesión, eliminando la cookie del accessToken
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Sesión cerrada correctamente
 */