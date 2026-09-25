import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { RegisterInput, LoginInput, RefreshTokenInput } from '../utils/validation.schemas';

export class AuthController {
  /**
   * POST /auth/register
   * Registra um novo usuário
   */
  static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data: RegisterInput = req.body;
      const tokens = await AuthService.register(data);

      res.status(201).json({
        message: 'Usuário registrado com sucesso',
        data: tokens,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /auth/login
   * Realiza o login do usuário
   */
  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data: LoginInput = req.body;
      const tokens = await AuthService.login(data);

      res.status(200).json({
        message: 'Login realizado com sucesso',
        data: tokens,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /auth/refresh
   * Renova o access token usando um refresh token
   */
  static async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken }: RefreshTokenInput = req.body;
      const tokens = await AuthService.refreshAccessToken(refreshToken);

      res.status(200).json({
        message: 'Token renovado com sucesso',
        data: tokens,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /auth/logout
   * Realiza o logout do usuário
   */
  static async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken }: RefreshTokenInput = req.body;
      await AuthService.logout(refreshToken);

      res.status(200).json({
        message: 'Logout realizado com sucesso',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /auth/me
   * Retorna os dados do usuário autenticado
   */
  static async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Não autenticado' });
        return;
      }

      res.status(200).json({
        message: 'Usuário autenticado',
        data: {
          userId: req.user.userId,
          email: req.user.email,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
