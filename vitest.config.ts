import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    // Os testes usam o mesmo banco: rodar em sequência evita interferência
    fileParallelism: false,
    testTimeout: 20000,
    hookTimeout: 30000,
  },
});
