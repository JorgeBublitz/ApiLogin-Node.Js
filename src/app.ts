import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import { swaggerDocument } from './config/swagger';
import { env } from './config/env';
import { AppError } from './utils/app-error';
import routes from './routes';

const app: Application = express();

// Segurança e parsing
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS configurável via variável de ambiente
const allowedOrigins = env.corsOrigin.split(',').map((origin) => origin.trim());
app.use(
  cors({
    origin: env.nodeEnv === 'production' ? allowedOrigins : true,
    credentials: true,
  })
);

// Rate limiting global da API
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas requisições. Tente novamente mais tarde.' },
});
app.use('/api', globalLimiter);

// Documentação Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Rotas
app.use('/api', routes);

// Tratamento de rotas não encontradas
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// Tratamento de erros global
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  console.error(err.stack);
  return res.status(500).json({ error: 'Erro interno do servidor' });
});

export default app;
