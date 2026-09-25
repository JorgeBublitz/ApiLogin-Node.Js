import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { AuthController } from '../controllers/auth.controller';
import { validate } from '../middlewares/validate.middleware';
import { authMiddleware } from '../middlewares/auth.middleware';
import { registerSchema, loginSchema, refreshTokenSchema } from '../utils/validation.schemas';
import { env } from '../config/env';

const router = Router();

// Rate limiting específico para login/registro: mitiga credential-stuffing e brute-force
const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas tentativas. Tente novamente em instantes.' },
  // Nos testes automatizados o limite atrapalharia a suíte
  skip: () => env.nodeEnv === 'test',
});

router.post('/register', authLimiter, validate(registerSchema), AuthController.register);
router.post('/login', authLimiter, validate(loginSchema), AuthController.login);
router.post('/refresh', validate(refreshTokenSchema), AuthController.refresh);
router.post('/logout', validate(refreshTokenSchema), AuthController.logout);
router.get('/me', authMiddleware, AuthController.me);

export default router;

