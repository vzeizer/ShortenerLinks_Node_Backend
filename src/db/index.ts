import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import { env } from '../env';
import * as schema from './schema';

// Cria o cliente de conexão do Postgres
const client = postgres(env.DATABASE_URL);

// Inicializa o Drizzle
export const db = drizzle(client, { schema });