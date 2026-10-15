import cors from 'cors';
import express from 'express';
import { env } from './env.js';
import { requireAuth } from './lib/auth.js';
import { errorHandler } from './lib/http.js';
import { uploadRoot } from './lib/storage/local.js';
import { storage } from './lib/storage/index.js';
import { adminMediaRouter } from './routes/admin-media.js';
import { adminPostsRouter } from './routes/admin-posts.js';
import { adminAuthorsRouter, adminCategoriesRouter, adminSubscribersRouter } from './routes/admin-taxonomy.js';
import { authRouter } from './routes/auth.js';
import { publicRouter } from './routes/public.js';

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(cors({ origin: env.corsOrigins }));
app.use(express.json({ limit: '5mb' }));

app.get('/health', (_req, res) => { res.json({ ok: true, storage: storage.name }); });

// Locally stored uploads. In production with S3 the files are served from the bucket/CDN instead.
app.use('/uploads', express.static(uploadRoot, { maxAge: '30d', immutable: true, fallthrough: false }));

app.use('/api/auth', authRouter);
app.use('/api/public', publicRouter);
app.use('/api/admin/posts', requireAuth, adminPostsRouter);
app.use('/api/admin/categories', requireAuth, adminCategoriesRouter);
app.use('/api/admin/authors', requireAuth, adminAuthorsRouter);
app.use('/api/admin/media', requireAuth, adminMediaRouter);
app.use('/api/admin/subscribers', requireAuth, adminSubscribersRouter);

app.use((_req, res) => { res.status(404).json({ error: 'Not found' }); });
app.use(errorHandler);

app.listen(env.port, env.host, () => {
  console.log(`brasq-be listening on http://localhost:${env.port} (storage: ${storage.name})`);
});
