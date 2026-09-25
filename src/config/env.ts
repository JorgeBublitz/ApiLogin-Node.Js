import dotenv from 'dotenv';

dotenv.config();

function requireEnv(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Variável de ambiente obrigatória não definida: ${name}`);
  }
  return value;
}

const MIN_SECRET_LENGTH = 32;

function requireSecret(name: string): string {
  const value = requireEnv(name);
  if (value.length < MIN_SECRET_LENGTH) {
    throw new Error(
      `Variável de ambiente ${name} é muito curta: deve ter pelo menos ${MIN_SECRET_LENGTH} caracteres. ` +
        `Gere um novo valor com, por exemplo, "openssl rand -hex 32".`
    );
  }
  return value;
}

export const env = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: requireEnv('CORS_ORIGIN', 'http://localhost:5173'),
  jwtAccessSecret: requireSecret('JWT_ACCESS_SECRET'),
  jwtRefreshSecret: requireSecret('JWT_REFRESH_SECRET'),
  jwtAccessExpiration: process.env.JWT_ACCESS_EXPIRATION || '15m',
  jwtRefreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
  databaseUrl: process.env.DATABASE_URL,
};
