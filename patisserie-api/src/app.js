import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yaml';
import { env } from './config/env.js';
import routes from './routes/index.js';
import { notFound } from './middlewares/notFound.js';
import { errorHandler } from './middlewares/errorHandler.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const swaggerDocument = YAML.parse(fs.readFileSync(path.join(here, 'docs', 'swagger.yaml'), 'utf8'));

export function createApp() {
  const app = express();

  // Middleware runs top to bottom, so the order below is deliberate.

  // 1. Security headers first, so every response (even errors) carries them.
  app.use(helmet());

  // 2. CORS before any route: only the Angular origin may call us, with cookies.
  app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }));

  // 3. Request logging early, so it also records requests that fail later on.
  if (!env.isTest) app.use(morgan(env.isDev ? 'dev' : 'combined'));

  // 4. Body and cookie parsers before the routes that read req.body / req.cookies.
  //    (Phase 7: the Stripe webhook route with express.raw() goes above this line,
  //    because the signature check needs the untouched raw body.)
  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());

  // 5. Static product images and API documentation.
  app.use('/uploads', express.static(path.join(here, '..', 'uploads')));
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

  // 6. Versioned API routes.
  app.use('/api/v1', routes);

  // 7. Nothing matched: 404 in the standard error shape.
  app.use(notFound);

  // 8. Error handler last: Express recognises it by its 4 arguments.
  app.use(errorHandler);

  return app;
}
