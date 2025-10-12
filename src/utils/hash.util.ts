import bcrypt from 'bcryptjs';

export class HashUtil {
  private static readonly SALT_ROUNDS = 10;

  /**
   * Gera um hash da senha usando bcrypt
   * @param password - Senha em texto plano
   * @returns Hash da senha
   */
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  /**
   * Compara uma senha em texto plano com um hash
   * @param password - Senha em texto plano
   * @param hash - Hash armazenado
   * @returns True se a senha corresponder ao hash
   */
  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}

