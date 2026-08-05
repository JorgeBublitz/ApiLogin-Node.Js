import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JwtUtil } from '../utils/jwt.util';
import { JwtPayload } from '../types/jwt.types';

// Estender o tipo Request do Express para incluir o usuário autenticado
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * Middleware para verificar a autenticação via JWT
 * Espera o token no header Authorization no formato: "Bearer <token>"
 */
export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({ error: 'Token não fornecido' });
    return;
  }

  const parts = authHeader.split(' ');

  if (parts.length !== 2) {
    res.status(401).json({ error: 'Formato de token inválido' });
    return;
  }

  const [scheme, token] = parts;

  if (!/^Bearer$/i.test(scheme!)) {
    res.status(401).json({ error: 'Token mal formatado' });
    return;
  }

  try {
    const payload = JwtUtil.verifyAccessToken(token!);
    req.user = payload;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'Token expirado' });
      return;
    }
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: 'Token inválido' });
      return;
    }
    // Erros inesperados não devem parecer problema de auth
    console.error('Erro interno na autenticação:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};
