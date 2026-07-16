import swaggerJsdoc from 'swagger-jsdoc';

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'RIWI-Projects API',
            version: '1.0.0',
            description: 'API para el sistema de seguimiento de estudiantes y egresados',
        },
        servers: [{ url: 'http://localhost:3000' }],
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