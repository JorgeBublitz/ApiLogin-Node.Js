import { Router } from 'express';
import authRoutes from './auth.routes';

const router = Router();

// Rotas de autenticação
router.use('/auth', authRoutes);

// Rota de health check
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'API está funcionando' });
});

export default router;

