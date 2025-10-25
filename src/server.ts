import fastify from 'fastify';
import cors from '@fastify/cors';
import { env } from './env';
import { appRoutes } from './http/routes';
import {
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod';

const app = fastify({
  // Adiciona logs em desenvolvimento para facilitar o debug
  logger: env.PORT === 3333 ? { transport: { target: 'pino-pretty' } } : false,
});

// Configura o Fastify para usar o Zod como validador
app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

// Habilita o CORS [cite: 60]
app.register(cors, {
  origin: '*', // Em produção, restrinja isso!
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Adiciona os métodos permitidos
  allowedHeaders: ['Content-Type', 'Authorization'], // Headers permitidos
});

// Registra todas as nossas rotas da API
app.register(appRoutes);

// Inicia o servidor
app.listen(
  {
    port: env.PORT,
    host: '0.0.0.0', // Importante para rodar em containers Docker
  },
  (err, address) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    console.log(`🚀 Server listening at ${address}`);
  },
);