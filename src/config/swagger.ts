export const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'Auth API',
    version: '1.2.0',
    description:
      'API de autenticação com JWT: access token de curta duração (padrão 15 minutos) e refresh token ' +
      'de longa duração (padrão 7 dias) com rotação e revogação em banco de dados.\n\n' +
      '### Segurança\n' +
      '- **Rate limiting em duas camadas**: um limite global de 100 requisições a cada 15 minutos em ' +
      'todas as rotas `/api`, e um limite mais restrito de 10 requisições por minuto em `/auth/register` ' +
      'e `/auth/login` para mitigar brute-force e credential-stuffing. Ao exceder qualquer um dos limites, ' +
      'a API responde `429 Too Many Requests`.\n' +
      '- **Rotação de refresh token**: a cada chamada a `/auth/refresh`, o refresh token usado é invalidado ' +
      '(removido do banco) e um novo par de tokens é emitido. Refresh tokens não podem ser reutilizados.\n' +
      '- **Mensagens de erro genéricas**: por design, `/auth/login` retorna a mesma mensagem ' +
      '("Credenciais inválidas") tanto para email inexistente quanto para senha incorreta, evitando ' +
      'enumeração de contas.\n' +
      '- Todas as respostas de erro seguem o formato descrito no componente `Error`, com um código HTTP ' +
      'apropriado (400, 401, 404, 409 ou 429).',
    contact: {
      name: 'Jorge Luis Heringer Bublitz',
      email: 'bublitzjorge3@gmail.com',
    },
  },
  servers: [
    {
      url: 'http://localhost:3000/api',
      description: 'Servidor de desenvolvimento',
    },
  ],
  tags: [
    {
      name: 'Auth',
      description:
        'Cadastro, login e ciclo de vida de tokens JWT (emissão, renovação com rotação e revogação). ' +
        'As rotas de escrita (`register`, `login`) possuem rate limiting dedicado; todas as rotas também ' +
        'estão sujeitas ao rate limit global da API.',
    },
    {
      name: 'Health',
      description: 'Endpoint de verificação de disponibilidade da API (health check), útil para monitoramento e orquestração.',
    },
  ],
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Verificar status da API',
        description:
          'Endpoint público e leve, sem autenticação, pensado para checagens de liveness/readiness ' +
          'por load balancers e orquestradores. Não acessa o banco de dados.',
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
          '429': {
            description: 'Limite global de requisições excedido (100 requisições / 15 minutos por IP)',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error429' },
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
        description:
          'Cria um novo usuário com email, senha (com hash via bcrypt) e nome, e retorna imediatamente ' +
          'um par de tokens (access + refresh), efetuando login automático após o cadastro. ' +
          'O refresh token gerado é persistido no banco para permitir rotação e revogação futuras. ' +
          'Limitado a 10 requisições por minuto por IP (compartilhado com `/auth/login`).',
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
                    description: 'Normalizado para minúsculas e sem espaços nas bordas antes da validação.',
                    example: 'maria.silva@example.com',
                  },
                  password: {
                    type: 'string',
                    format: 'password',
                    minLength: 8,
                    description: 'Mínimo de 8 caracteres.',
                    example: 'S3nhaForte!23',
                  },
                  name: {
                    type: 'string',
                    minLength: 2,
                    description: 'Mínimo de 2 caracteres.',
                    example: 'Maria Silva',
                  },
                },
              },
              examples: {
                cadastroPadrao: {
                  summary: 'Cadastro válido',
                  value: {
                    email: 'maria.silva@example.com',
                    password: 'S3nhaForte!23',
                    name: 'Maria Silva',
                  },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Usuário registrado com sucesso; tokens de acesso já emitidos (login automático)',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/TokenResponse',
                },
              },
            },
          },
          '400': {
            description:
              'Erro de validação dos campos enviados (ex.: email em formato inválido, senha com menos ' +
              'de 8 caracteres, nome com menos de 2 caracteres ou campo ausente) ou JSON malformado no corpo.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error400' },
              },
            },
          },
          '409': {
            description: 'Já existe um usuário cadastrado com esse email',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error409' },
              },
            },
          },
          '429': {
            description: 'Limite de tentativas excedido (10 requisições / minuto por IP em register + login)',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error429' },
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
        description:
          'Autentica o usuário por email e senha e retorna um novo par de tokens (access + refresh), ' +
          'persistindo o refresh token no banco. Por segurança, a mensagem de erro é idêntica tanto para ' +
          'email não cadastrado quanto para senha incorreta ("Credenciais inválidas"), evitando enumeração ' +
          'de contas. Limitado a 10 requisições por minuto por IP (compartilhado com `/auth/register`).',
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
                    example: 'maria.silva@example.com',
                  },
                  password: {
                    type: 'string',
                    format: 'password',
                    example: 'S3nhaForte!23',
                  },
                },
              },
              examples: {
                loginPadrao: {
                  summary: 'Login válido',
                  value: {
                    email: 'maria.silva@example.com',
                    password: 'S3nhaForte!23',
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
          '400': {
            description: 'Erro de validação (ex.: email em formato inválido ou campo ausente) ou JSON malformado no corpo.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error400' },
              },
            },
          },
          '401': {
            description:
              'Credenciais inválidas: email não cadastrado ou senha incorreta (mensagem genérica, ' +
              'propositalmente idêntica para os dois casos).',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error401' },
              },
            },
          },
          '429': {
            description: 'Limite de tentativas excedido (10 requisições / minuto por IP em register + login)',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error429' },
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
        description:
          'Gera um novo par de access/refresh token a partir de um refresh token válido. O refresh token ' +
          'utilizado nessa chamada é imediatamente revogado (removido do banco) — trata-se de rotação de ' +
          'tokens: cada refresh token só pode ser usado uma única vez. Refresh tokens expirados são ' +
          'removidos do banco automaticamente ao serem apresentados.',
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
                    example:
                      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhM2Y1YzJkMS04YjZlLTRmMWEtOWQzYy03ZTJmOGExYjVjNGQiLCJlbWFpbCI6Im1hcmlhLnNpbHZhQGV4YW1wbGUuY29tIiwianRpIjoiZjQ3YWMxMGItNThjYy00MzcyLWE1NjctMGUwMmIyYzNkNDc5IiwiaWF0IjoxNzI3MTA4ODAwLCJleHAiOjE3Mjc3MTM2MDB9.b4Nq0G1QwJgN3F5cU3d6X8yzV2pR7sT1uW9aC0eH2fI',
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Token renovado com sucesso; um novo refresh token substitui o anterior (rotação)',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/TokenResponse',
                },
              },
            },
          },
          '400': {
            description: 'Erro de validação (campo `refreshToken` ausente) ou JSON malformado no corpo.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error400' },
              },
            },
          },
          '401': {
            description:
              'Refresh token inválido (assinatura inválida, não encontrado no banco ou já utilizado) ' +
              'ou refresh token expirado (nesse caso, o registro correspondente é removido do banco).',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error401' },
              },
            },
          },
          '429': {
            description: 'Limite global de requisições excedido (100 requisições / 15 minutos por IP)',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error429' },
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
        description:
          'Revoga (remove do banco) o refresh token informado, invalidando-o para futuras chamadas a ' +
          '`/auth/refresh`. O access token em uso continua válido até sua própria expiração — este endpoint ' +
          'não faz blacklist de access tokens. Por design, retorna 200 mesmo se o refresh token informado ' +
          'não existir ou já tiver sido removido (operação idempotente).',
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
                    example:
                      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhM2Y1YzJkMS04YjZlLTRmMWEtOWQzYy03ZTJmOGExYjVjNGQiLCJlbWFpbCI6Im1hcmlhLnNpbHZhQGV4YW1wbGUuY29tIiwianRpIjoiZjQ3YWMxMGItNThjYy00MzcyLWE1NjctMGUwMmIyYzNkNDc5IiwiaWF0IjoxNzI3MTA4ODAwLCJleHAiOjE3Mjc3MTM2MDB9.b4Nq0G1QwJgN3F5cU3d6X8yzV2pR7sT1uW9aC0eH2fI',
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Logout realizado com sucesso (refresh token revogado, ou já não existia)',
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
          '400': {
            description: 'Erro de validação (campo `refreshToken` ausente) ou JSON malformado no corpo.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error400' },
              },
            },
          },
          '429': {
            description: 'Limite global de requisições excedido (100 requisições / 15 minutos por IP)',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error429' },
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
        description:
          'Retorna o `userId` e `email` extraídos do access token informado no header `Authorization`. ' +
          'Não consulta o banco de dados — os dados refletem o payload do token no momento em que ele foi ' +
          'emitido (login, registro ou refresh mais recente).',
        security: [
          {
            bearerAuth: [],
          },
        ],
        responses: {
          '200': {
            description: 'Dados do usuário autenticado',
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
                          format: 'uuid',
                          example: 'a3f5c2d1-8b6e-4f1a-9d3c-7e2f8a1b5c4d',
                        },
                        email: {
                          type: 'string',
                          format: 'email',
                          example: 'maria.silva@example.com',
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          '401': {
            description:
              'Token ausente (header `Authorization` não enviado), com formato inválido (esperado ' +
              '`Bearer <token>`), inválido (assinatura incorreta) ou expirado.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error401' },
              },
            },
          },
          '429': {
            description: 'Limite global de requisições excedido (100 requisições / 15 minutos por IP)',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error429' },
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
            example: 'Login realizado com sucesso',
          },
          data: {
            type: 'object',
            properties: {
              accessToken: {
                type: 'string',
                description: 'JWT de curta duração (padrão 15 minutos) usado para autenticar chamadas via header Authorization.',
                example:
                  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhM2Y1YzJkMS04YjZlLTRmMWEtOWQzYy03ZTJmOGExYjVjNGQiLCJlbWFpbCI6Im1hcmlhLnNpbHZhQGV4YW1wbGUuY29tIiwianRpIjoiOTBmOTZmZTItNTcxNS00YjNmLTk1ZDYtMzY0MDdlYzE0YzY3IiwiaWF0IjoxNzI3MTA4ODAwLCJleHAiOjE3MjcxMDk3MDB9.k7Hn2Lp9QmX4vZ6bY1cD3eF5gA8sT0uW2xR7jN4qM1o',
              },
              refreshToken: {
                type: 'string',
                description: 'JWT de longa duração (padrão 7 dias) persistido no banco; use-o em `/auth/refresh` para obter um novo par de tokens. É invalidado após o primeiro uso (rotação).',
                example:
                  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhM2Y1YzJkMS04YjZlLTRmMWEtOWQzYy03ZTJmOGExYjVjNGQiLCJlbWFpbCI6Im1hcmlhLnNpbHZhQGV4YW1wbGUuY29tIiwianRpIjoiZjQ3YWMxMGItNThjYy00MzcyLWE1NjctMGUwMmIyYzNkNDc5IiwiaWF0IjoxNzI3MTA4ODAwLCJleHAiOjE3Mjc3MTM2MDB9.b4Nq0G1QwJgN3F5cU3d6X8yzV2pR7sT1uW9aC0eH2fI',
              },
            },
          },
        },
      },
      Error: {
        type: 'object',
        description: 'Formato padrão de erro retornado pela API.',
        properties: {
          error: {
            type: 'string',
            example: 'Mensagem de erro',
          },
        },
      },
      Error400: {
        description: 'Erro de validação de entrada (Zod) ou JSON malformado no corpo da requisição.',
        allOf: [
          { $ref: '#/components/schemas/Error' },
          {
            type: 'object',
            properties: {
              error: {
                type: 'string',
                example: 'Erro de validação',
              },
              details: {
                type: 'array',
                description: 'Lista de campos que falharam na validação (ausente quando o erro é de JSON malformado).',
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
        ],
        example: {
          error: 'Erro de validação',
          details: [
            { field: 'email', message: 'Email inválido' },
            { field: 'password', message: 'Senha deve ter no mínimo 8 caracteres' },
          ],
        },
      },
      Error401: {
        description: 'Falha de autenticação: credenciais ou token ausentes, inválidos ou expirados.',
        allOf: [
          { $ref: '#/components/schemas/Error' },
          {
            type: 'object',
            properties: {
              error: {
                type: 'string',
                example: 'Credenciais inválidas',
              },
            },
          },
        ],
        example: { error: 'Credenciais inválidas' },
      },
      Error404: {
        description: 'Rota inexistente na API.',
        allOf: [
          { $ref: '#/components/schemas/Error' },
          {
            type: 'object',
            properties: {
              error: {
                type: 'string',
                example: 'Rota não encontrada',
              },
            },
          },
        ],
        example: { error: 'Rota não encontrada' },
      },
      Error409: {
        description: 'Conflito: o recurso já existe.',
        allOf: [
          { $ref: '#/components/schemas/Error' },
          {
            type: 'object',
            properties: {
              error: {
                type: 'string',
                example: 'Email já está em uso',
              },
            },
          },
        ],
        example: { error: 'Email já está em uso' },
      },
      Error429: {
        description: 'Limite de requisições (rate limit) excedido para o IP de origem.',
        allOf: [
          { $ref: '#/components/schemas/Error' },
          {
            type: 'object',
            properties: {
              error: {
                type: 'string',
                example: 'Muitas tentativas. Tente novamente em instantes.',
              },
            },
          },
        ],
        example: { error: 'Muitas tentativas. Tente novamente em instantes.' },
      },
    },
  },
};
