import prisma from '../config/prisma';
import { HashUtil } from '../utils/hash.util';
import { JwtUtil } from '../utils/jwt.util';
import { AppError } from '../utils/app-error';
import { TokenPair } from '../types/jwt.types';
import { RegisterInput, LoginInput } from '../utils/validation.schemas';

export class AuthService {

  // Realiza o cadastro do usuário
  static async register(data: RegisterInput): Promise<TokenPair> {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new AppError('Email já está em uso', 409);
    }

    const hashedPassword = await HashUtil.hashPassword(data.password);

    // Criar usuário
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
      },
    });

    // Gerar tokens
    const payload = { userId: user.id, email: user.email };
    const accessToken = JwtUtil.generateAccessToken(payload);
    const refreshToken = JwtUtil.generateRefreshToken(payload);

    // Salvar refresh token no banco
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: JwtUtil.getRefreshTokenExpirationDate(),
      },
    });

    return { accessToken, refreshToken };
  }

  // Realiza o login do usuário
  static async login(data: LoginInput): Promise<TokenPair> {
    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    // Mensagem genérica para não revelar se o email existe
    if (!user) {
      throw new AppError('Credenciais inválidas', 401);
    }

    // Verificar senha
    const isPasswordValid = await HashUtil.comparePassword(data.password, user.password);

    if (!isPasswordValid) {
      throw new AppError('Credenciais inválidas', 401);
    }

    // Gerar tokens
    const payload = { userId: user.id, email: user.email };
    const accessToken = JwtUtil.generateAccessToken(payload);
    const refreshToken = JwtUtil.generateRefreshToken(payload);

    // Salvar refresh token no banco
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: JwtUtil.getRefreshTokenExpirationDate(),
      },
    });

    return { accessToken, refreshToken };
  }

  static async refreshAccessToken(refreshToken: string): Promise<TokenPair> {
    // Verificar o refresh token
    const payload = JwtUtil.verifyRefreshToken(refreshToken);

    // Verificar se o refresh token existe no banco e não expirou
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });

    if (!storedToken) {
      throw new AppError('Refresh token inválido', 401);
    }

    if (storedToken.expiresAt < new Date()) {
      // Token expirado, remover do banco
      await prisma.refreshToken.delete({
        where: { id: storedToken.id },
      });
      throw new AppError('Refresh token expirado', 401);
    }

    // Remover o refresh token antigo (rotação de tokens)
    await prisma.refreshToken.delete({
      where: { id: storedToken.id },
    });

    // Gerar novos tokens
    const newAccessToken = JwtUtil.generateAccessToken({
      userId: payload.userId,
      email: payload.email,
    });
    const newRefreshToken = JwtUtil.generateRefreshToken({
      userId: payload.userId,
      email: payload.email,
    });

    // Salvar novo refresh token no banco
    await prisma.refreshToken.create({
      data: {
        token: newRefreshToken,
        userId: payload.userId,
        expiresAt: JwtUtil.getRefreshTokenExpirationDate(),
      },
    });

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  static async logout(refreshToken: string): Promise<void> {
    await prisma.refreshToken.deleteMany({
      where: { token: refreshToken },
    });
  }
}
