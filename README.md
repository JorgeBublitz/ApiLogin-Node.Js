# 🔐 Auth API

## API de Autenticação com JWT

[![Licença](https://img.shields.io/badge/Licen%C3%A7a-MIT-informational?style=for-the-badge)](LICENSE)

API de autenticação completa desenvolvida em **Node.js + TypeScript + Express + Prisma**, com:

- **Registro e Login** com hash seguro de senhas (bcrypt)
- **Access Token + Refresh Token** com rotação (o token antigo é invalidado a cada renovação)
- **Logout** com revogação do refresh token
- **Validação de entradas** com Zod
- **Swagger UI** para documentação interativa dos endpoints

---

## ✨ Funcionalidades

| Funcionalidade | Detalhes |
| :--- | :--- |
| Registro | Cria usuário e retorna o par de tokens |
| Login | Autentica e retorna o par de tokens |
| Refresh | Rotaciona o refresh token e gera novo access token |
| Logout | Revoga o refresh token no banco |
| Me | Retorna os dados do usuário autenticado (JWT) |

---

## 🛠️ Tecnologias

- **Node.js** + **TypeScript**
- **Express** 5
- **Prisma** (PostgreSQL)
- **JWT** (jsonwebtoken)
- **Bcryptjs** (hash de senhas)
- **Zod** (validação)
- **Helmet** + **Express Rate Limit** (segurança)

---

## ⚙️ Configuração Local

### Pré-requisitos

- Node.js (LTS)
- PostgreSQL (ou banco remoto)

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env
```

Preencha os segredos JWT e a `DATABASE_URL`.

### 3. Rodar as migrações

```bash
npm run prisma:migrate
```

### 4. Iniciar

```bash
npm run dev
# http://localhost:3000/api
```

Documentação Swagger: `http://localhost:3000/api-docs`

---

## 📡 Endpoints

| Método | Rota | Descrição |
| :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Registra um novo usuário |
| `POST` | `/api/auth/login` | Realiza login |
| `POST` | `/api/auth/refresh` | Renova tokens |
| `POST` | `/api/auth/logout` | Revoga o refresh token |
| `GET` | `/api/auth/me` | Dados do usuário autenticado (Bearer token) |
| `GET` | `/api/health` | Status da API |

---

## 📝 Licença

MIT
