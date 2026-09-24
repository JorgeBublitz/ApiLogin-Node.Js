import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import app from '../src/app';
import prisma from '../src/config/prisma';

const api = () => request(app);
const usuario = { name: 'Jorge', email: 'jorge@teste.com', password: 'senha1234' };

beforeEach(async () => {
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
});
afterAll(() => prisma.$disconnect());

async function registrar() {
  const res = await api().post('/api/auth/register').send(usuario).expect(201);
  return res.body.data as { accessToken: string; refreshToken: string };
}

describe('Registro', () => {
  it('cria o usuário, guarda a senha com hash e já devolve os tokens', async () => {
    const tokens = await registrar();
    expect(tokens.accessToken).toBeDefined();
    expect(tokens.refreshToken).toBeDefined();

    const user = await prisma.user.findUniqueOrThrow({ where: { email: usuario.email } });
    expect(user.password).not.toBe(usuario.password);
  });

  it('retorna 409 para e-mail já cadastrado, mesmo com maiúsculas', async () => {
    await registrar();
    await api()
      .post('/api/auth/register')
      .send({ ...usuario, email: 'JORGE@teste.com' })
      .expect(409);
  });

  it('valida os campos e JSON malformado', async () => {
    const res = await api().post('/api/auth/register').send({ email: 'x', password: '123', name: 'J' }).expect(400);
    expect(res.body.details.map((d: { field: string }) => d.field).sort()).toEqual(['email', 'name', 'password']);

    await api().post('/api/auth/register').set('Content-Type', 'application/json').send('{"email":').expect(400);
  });
});

describe('Login', () => {
  it('faz login logo após o registro (tokens nunca repetem)', async () => {
    await registrar();
    await api().post('/api/auth/login').send({ email: usuario.email, password: usuario.password }).expect(200);
  });

  it('responde igual para e-mail inexistente e senha errada', async () => {
    await registrar();
    const a = await api().post('/api/auth/login').send({ email: 'nao@existe.com', password: 'qualquer' }).expect(401);
    const b = await api().post('/api/auth/login').send({ email: usuario.email, password: 'errada123' }).expect(401);
    expect(a.body.error).toBe(b.body.error);
  });
});

describe('Sessão', () => {
  it('/me exige token válido', async () => {
    const { accessToken } = await registrar();
    await api().get('/api/auth/me').expect(401);
    await api().get('/api/auth/me').set('Authorization', 'Bearer invalido').expect(401);
    await api().get('/api/auth/me').set('Authorization', 'Basic abc').expect(401);

    const me = await api().get('/api/auth/me').set('Authorization', `Bearer ${accessToken}`).expect(200);
    expect(me.body.data.email).toBe(usuario.email);
  });

  it('refresh rotaciona o token e o antigo deixa de valer', async () => {
    const { refreshToken } = await registrar();
    const res = await api().post('/api/auth/refresh').send({ refreshToken }).expect(200);
    expect(res.body.data.refreshToken).not.toBe(refreshToken);

    await api().post('/api/auth/refresh').send({ refreshToken }).expect(401);
  });

  it('refresh com token malformado retorna 401 (e não 500)', async () => {
    await api().post('/api/auth/refresh').send({ refreshToken: 'abc' }).expect(401);
  });

  it('logout revoga o refresh token', async () => {
    const { refreshToken } = await registrar();
    await api().post('/api/auth/logout').send({ refreshToken }).expect(200);
    await api().post('/api/auth/refresh').send({ refreshToken }).expect(401);
  });
});

describe('Infraestrutura', () => {
  it('health check, 404 e Swagger', async () => {
    await api().get('/api/health').expect(200);
    await api().get('/api/nao-existe').expect(404);
    await api().get('/api-docs/').expect(200);
  });
});
