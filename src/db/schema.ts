import { pgTable, serial, text, varchar, integer, timestamp } from 'drizzle-orm/pg-core';

export const links = pgTable('links', {
  id: serial('id').primaryKey(),
  
  // A URL encurtada. Ex: 'abcde'
  // Criamos um índice único para garantir a regra 
  code: varchar('code', { length: 10 }).unique().notNull(),

  // A URL original 
  originalUrl: text('original_url').notNull(),
  
  // Data de criação 
  createdAt: timestamp('created_at').defaultNow().notNull(),

  // Contagem de acessos 
  accessCount: integer('access_count').default(0).notNull(),
});