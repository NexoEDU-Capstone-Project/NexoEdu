// Logger de peticiones para la consola del backend. Muestra, por cada request:
// método, ruta, código de estado y duración, con colores según el resultado
// (verde 2xx, cian 3xx, amarillo 4xx, rojo 5xx). Sin dependencias externas.
const RESET = '\x1b[0m';
const GRIS = '\x1b[90m';

function colorEstado(status) {
    if (status >= 500) return '\x1b[31m'; // rojo
    if (status >= 400) return '\x1b[33m'; // amarillo
    if (status >= 300) return '\x1b[36m'; // cian
    return '\x1b[32m'; // verde
}

export default function requestLogger(req, res, next) {
    const inicio = Date.now();
    res.on('finish', () => {
        const ms = Date.now() - inicio;
        const color = colorEstado(res.statusCode);
        const hora = new Date().toLocaleTimeString('es-CO');
        console.log(
            `${GRIS}[${hora}]${RESET} ${color}${res.statusCode}${RESET} ${req.method.padEnd(6)} ${req.originalUrl} ${GRIS}(${ms}ms)${RESET}`
        );
    });
    next();
}
