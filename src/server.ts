import app from './app';
import { env } from './config/env';
import prisma from './config/prisma';

const PORT = env.port;

// Inicializar servidor
const server = app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta http://localhost:${PORT}/api`);
  console.log(`📚 Documentação Swagger disponível em: http://localhost:${PORT}/api-docs`);
  console.log(`🏥 Health check disponível em: http://localhost:${PORT}/health`);
});

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log('\n🛑 Encerrando servidor...');

  server.close(async () => {
    console.log('✅ Servidor HTTP encerrado');

    // Desconectar do Prisma
    await prisma.$disconnect();
    console.log('✅ Conexão com banco de dados encerrada');

    process.exit(0);
  });

  // Forçar encerramento após 10 segundos
  setTimeout(() => {
    console.error('⚠️  Forçando encerramento...');
    process.exit(1);
  }, 10000);
};

// Listeners para sinais de encerramento
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Tratamento de erros não capturados
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  gracefulShutdown();
});

