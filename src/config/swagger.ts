export const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'Auth API',
    version: '1.0.0',
    description: 'API de autenticação com JWT (Access Token e Refresh Token)',
    contact: {
      name: 'Suporte',
      email: 'suporte@example.com',
    },
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Servidor de desenvolvimento',
    },
  ],
  tags: [
    {
      name: 'Auth',
      description: 'Endpoints de autenticação',
    },
    {
      name: 'Health',
      description: 'Endpoints de status',
    },
  ],
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Verificar status da API',
        description: 'Retorna o status de saúde da API',
        responses: {
          '200': {
            description: 'API está funcionando',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: {
                      type: 'string',
                      example: 'OK',
                    },
                    message: {
                      type: 'string',
                      example: 'API está funcionando',
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Registrar novo usuário',
        description: 'Cria um novo usuário e retorna os tokens de acesso e atualização',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password', 'name'],
                properties: {
                  email: {
                    type: 'string',
                    format: 'email',
                    example: 'usuario@example.com',
                  },
                  password: {
                    type: 'string',
                    minLength: 6,
                    example: 'senha123',
                  },
                  name: {
                    type: 'string',
                    minLength: 2,
                    example: 'João Silva',
                  },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Usuário registrado com sucesso',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/TokenResponse',
                },
              },
            },
          },
          '400': {
            description: 'Erro de validação ou email já em uso',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login de usuário',
        description: 'Autentica o usuário e retorna os tokens de acesso e atualização',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: {
                    type: 'string',
                    format: 'email',
                    example: 'usuario@example.com',
                  },
                  password: {
                    type: 'string',
                    example: 'senha123',
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Login realizado com sucesso',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/TokenResponse',
                },
              },
            },
          },
          '401': {
            description: 'Credenciais inválidas',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
        },
      },
    },
    '/auth/refresh': {
      post: {
        tags: ['Auth'],
        summary: 'Renovar access token',
        description: 'Gera um novo par de tokens usando um refresh token válido',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['refreshToken'],
                properties: {
                  refreshToken: {
                    type: 'string',
                    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Token renovado com sucesso',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/TokenResponse',
                },
              },
            },
          },
          '401': {
            description: 'Refresh token inválido ou expirado',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
        },
      },
    },
    '/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Logout de usuário',
        description: 'Invalida o refresh token do usuário',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['refreshToken'],
                properties: {
                  refreshToken: {
                    type: 'string',
                    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Logout realizado com sucesso',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: {
                      type: 'string',
                      example: 'Logout realizado com sucesso',
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Obter dados do usuário autenticado',
        description: 'Retorna os dados do usuário autenticado (requer token de acesso)',
        security: [
          {
            bearerAuth: [],
          },
        ],
        responses: {
          '200': {
            description: 'Dados do usuário',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: {
                      type: 'string',
                      example: 'Usuário autenticado',
                    },
                    data: {
                      type: 'object',
                      properties: {
                        userId: {
                          type: 'string',
                          example: '123e4567-e89b-12d3-a456-426614174000',
                        },
                        email: {
                          type: 'string',
                          example: 'usuario@example.com',
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          '401': {
            description: 'Token não fornecido ou inválido',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Insira o access token JWT no formato: Bearer {token}',
      },
    },
    schemas: {
      TokenResponse: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            example: 'Operação realizada com sucesso',
          },
          data: {
            type: 'object',
            properties: {
              accessToken: {
                type: 'string',
                example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
              },
              refreshToken: {
                type: 'string',
                example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
              },
            },
          },
        },
      },
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'string',
            example: 'Mensagem de erro',
          },
          details: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                field: {
                  type: 'string',
                  example: 'email',
                },
                message: {
                  type: 'string',
                  example: 'Email inválido',
                },
              },
            },
          },
        },
      },
    },
  },
};

