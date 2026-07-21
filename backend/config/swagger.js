import swaggerJsdoc from 'swagger-jsdoc';

const PORT = process.env.PORT || 3000;

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'NexoEdu API',
            version: '1.0.0',
            description: 'API REST de NexoEdu, sistema de seguimiento de estudiantes y egresados desarrollado por coders de Riwi en alianza con la Alcaldía de Barranquilla.',
        },
        servers: [
            { url: `http://localhost:${PORT}`, description: 'Desarrollo local' },
            { url: 'https://nexoedu-backend.onrender.com', description: 'Producción (Render)' },
        ],
        components: {
            securitySchemes: {
                cookieAuth: {
                    type: 'apiKey',
                    in: 'cookie',
                    name: 'accessToken',
                },
            },
        },
    },
    apis: ['./docs/*.js'],
};

export const swaggerSpec = swaggerJsdoc(options);