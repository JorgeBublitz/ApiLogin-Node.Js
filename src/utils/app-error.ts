/**
 * Erro de aplicação com código de status HTTP.
 * Permite que services lancem erros com status adequado,
 * evitando que tudo vire 500.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly details?: unknown;

  constructor(message: string, statusCode = 400, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.details = details;
  }
}
