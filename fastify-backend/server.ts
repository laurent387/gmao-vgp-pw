import Fastify from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifySwagger from '@fastify/swagger';
import fastifyJwt from '@fastify/jwt';
import { Client } from 'pg';
import { assetsRoutes } from './routes/assets.js';
import { missionsRoutes } from './routes/missions.js';
import { nonconformitiesRoutes } from './routes/nonconformities.js';
import { reportsRoutes } from './routes/reports.js';
import { usersRoutes } from './routes/users.js';
import { authRoutes } from './routes/auth.js';
import { attachmentsRoutes } from './routes/attachments.js';
import { vgpRoutes } from './routes/vgp.js';
import { controlsRoutes } from './routes/controls.js';
import { checklistsRoutes } from './routes/checklists.js';
import { businessCardRoutes } from './routes/business-cards.js';

const fastify = Fastify();
const db = new Client({
  connectionString: process.env.DATABASE_URL || 'postgres://api_user:password@localhost:5432/in_spectra',
});

async function main() {
    // CORS configuration for production
    await fastify.register(fastifyCors, {
      origin: [
        'https://app.in-spectra.com',
        'http://localhost:3000', // for local dev
      ],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization'],
    });
  await db.connect();

  // Swagger doc (Fastify v4+)
  await fastify.register(fastifySwagger, {
    swagger: {
      info: { title: 'In-Spectra API', version: '1.0.0' },
    },
  });
  // Optionally add @fastify/swagger-ui for /docs endpoint
  try {
    const fastifySwaggerUi = (await import('@fastify/swagger-ui')).default;
    await fastify.register(fastifySwaggerUi, {
      routePrefix: '/docs',
      uiConfig: {
        docExpansion: 'list',
        deepLinking: false,
      },
    });
  } catch (e) {
    console.warn('Swagger UI not installed, /docs endpoint not available');
  }

  // JWT auth (clé de test, à sécuriser en prod)
  await fastify.register(fastifyJwt, { secret: process.env.JWT_SECRET || 'dev-secret' });

  // Static file serving for uploads
  const fastifyStatic = (await import('@fastify/static')).default;
  await fastify.register(fastifyStatic, {
    root: process.env.UPLOADS_DIR || '/home/deploy/rork-in-spectra-asset---control/uploads',
    prefix: '/uploads/',
    decorateReply: false, // To avoid conflicts if registered multiple times
  });

  // Health check
  fastify.get('/health', async () => ({ status: 'ok' }));

  // Exemple de middleware d'auth (à activer sur les routes sensibles)
  // fastify.addHook('onRequest', async (request, reply) => {
  //   try {
  //     await request.jwtVerify();
  //   } catch (err) {
  //     reply.code(401).send({ error: 'Unauthorized' });
  //   }
  // });

  // Register all entity routes
  await assetsRoutes(fastify, db);
  await missionsRoutes(fastify, db);
  await nonconformitiesRoutes(fastify, db);
  await reportsRoutes(fastify, db);
  await usersRoutes(fastify, db);
  await authRoutes(fastify, db);
  await attachmentsRoutes(fastify, db);
  await vgpRoutes(fastify, db);
  await controlsRoutes(fastify, db);
  await checklistsRoutes(fastify, db);
  await businessCardRoutes(fastify, db);
  const { actionsRoutes } = await import('./routes/actions.js');
  await actionsRoutes(fastify, db);
  const { clientsRoutes } = await import('./routes/clients.js');
  await clientsRoutes(fastify, db);
  const { sitesRoutes } = await import('./routes/sites.js');
  await sitesRoutes(fastify, db);
  const { zonesRoutes } = await import('./routes/zones.js');
  await zonesRoutes(fastify, db);
  const { dashboardRoutes } = await import('./routes/dashboard.js');
  await dashboardRoutes(fastify, db);

  await fastify.listen({ port: 4000, host: '0.0.0.0' });
  console.log('🚀 Fastify API running on http://localhost:4000');
  console.log('📚 Swagger docs: http://localhost:4000/docs');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
