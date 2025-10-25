import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../db';
import { links } from '../db/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { PostgresError } from 'postgres';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'node:crypto';
import { r2 } from '../lib/r2';
import { env } from '../env';

export async function appRoutes(app: FastifyInstance) {

  /**
   * Rota de Redirecionamento e Incremento [cite: 15, 17]
   * GET /:code
   * Obtém a URL original e incrementa os acessos.
   */
  app.get('/api/links/:code', async (request, reply) => {
    const getLinkSchema = z.object({
      code: z.string().min(3),
    });

    const { code } = getLinkSchema.parse(request.params);

    const link = await db.query.links.findFirst({
      where: eq(links.code, code),
    });

    if (!link) {
      return reply.status(404).send({ message: 'Link not found' });
    }

    // Incrementa o contador de acessos [cite: 17]
    // Usamos sql`...` para fazer a operação no próprio banco
    await db
      .update(links)
      .set({
        accessCount: sql`${links.accessCount} + 1`,
      })
      .where(eq(links.id, link.id));

    // Redireciona para a URL original
    return reply.redirect(link.originalUrl, 301);
  });

  /**
   * Rota de Criação de Link [cite: 11]
   * POST /links
   */
  app.post('/api/links', async (request, reply) => {
    console.log('Request body:', request.body);

    const createLinkSchema = z.object({
      original_url: z.string().url('URL original mal formatada.'),
      // O 'code' é opcional, se não vier, geramos um
      code: z.string().min(3).optional(),
    });

    const { original_url: originalUrl, code: inputCode } = createLinkSchema.parse(request.body);

    // Gera um código de 6 caracteres se não for fornecido
    const code = inputCode || nanoid(6);

    try {
      const [newLink] = await db
        .insert(links)
        .values({
          originalUrl,
          code,
        })
        .returning({
          id: links.id,
          shortUrl: sql<string>`concat(${env.CLOUDFLARE_PUBLIC_URL}::text, '/', ${links.code})`,
        });

      return reply.status(201).send(newLink);

    } catch (error) {
      // Trata erro de violação de constraint (código duplicado) [cite: 13]
      if (error instanceof PostgresError && error.code === '23505') {
        return reply.status(400).send({
          message: 'URL encurtada já existente.',
        });
      }
      
      console.error(error);
      return reply.status(500).send({ message: 'Internal server error.' });
    }
  });

  /**
   * Rota de Listagem de Links [cite: 16]
   * GET /links
   * Inclui paginação para performance [cite: 27]
   */
  app.get('/api/links', async (request, reply) => {
    const getLinksSchema = z.object({
      page: z.coerce.number().min(1).default(1),
      pageSize: z.coerce.number().min(10).max(100).default(10),
    });

    const { page, pageSize } = getLinksSchema.parse(request.query);

    const allLinks = await db
      .select({
        id: links.id,
        code: links.code,
        originalUrl: links.originalUrl,
        accessCount: links.accessCount,
        createdAt: links.createdAt,
        shortUrl: sql<string>`concat(${env.CLOUDFLARE_PUBLIC_URL}::text, '/', ${links.code})`,
      })
      .from(links)
      .orderBy(desc(links.createdAt)) // Mais recentes primeiro
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    return reply.send(allLinks);
  });
/**
 * Rota para Deletar Link por código
 * DELETE /links/:code
 * Usa o código em vez do ID para ser mais user-friendly
 */
app.delete('/api/links/:code', async (request, reply) => {
  const deleteLinkSchema = z.object({
    code: z.string().min(3),
  });
  
  console.log('Request params:', request.params);
  const { code } = deleteLinkSchema.parse(request.params);

  const [deletedLink] = await db
    .delete(links)
    .where(eq(links.code, code))
    .returning({ id: links.id });

  if (!deletedLink) {
    return reply.status(404).send({ message: 'Link not found' });
  }

  return reply.status(204).send(); // 204 No Content
});

  /**
   * Rota para Exportar CSV [cite: 21, 25, 26, 28]
   * POST /links/export/csv
   */
  app.post('/api/links/export/csv', async (request, reply) => {
    try {
      const allLinks = await db.select().from(links).orderBy(desc(links.createdAt));

      if (allLinks.length === 0) {
        return reply.status(400).send({ message: 'No links to export' });
      }

      // 1. Formatar o CSV [cite: 28]
      const csvHeader = 'URL original,URL encurtada,Contagem de acessos,Data de criação\n';
      const csvBody = allLinks.map(link => {
        const shortUrl = `${env.CLOUDFLARE_PUBLIC_URL}/${link.code}`;
        return `${link.originalUrl},${shortUrl},${link.accessCount},${link.createdAt.toISOString()}`;
      }).join('\n');

      const csvContent = csvHeader + csvBody;

      // 2. Gerar nome aleatório [cite: 26]
      const fileName = `${randomUUID()}.csv`;

      // 3. Fazer upload para a CDN (R2) 
      await r2.send(
        new PutObjectCommand({
          Bucket: env.CLOUDFLARE_BUCKET,
          Key: fileName,
          Body: Buffer.from(csvContent),
          ContentType: 'text/csv',
        }),
      );

      // 4. Retornar a URL pública
      const publicUrl = `${env.CLOUDFLARE_PUBLIC_URL}/${fileName}`;

      return reply.status(201).send({ csvUrl: publicUrl });

    } catch (error) {
      console.error(error);
      return reply.status(500).send({ message: 'Failed to export CSV' });
    }
  });
}