import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { HttpError, paging, slugify } from '../lib/http.js';

export const adminCategoriesRouter = Router();

const categoryInput = z.object({
  name: z.string().min(1), slug: z.string(), intro: z.string(), sortOrder: z.number().int(),
}).partial();

adminCategoriesRouter.get('/', async (req, res) => {
  const pg = paging(req.query);
  const [categories, total] = await Promise.all([
    prisma.category.findMany({ orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }], include: { _count: { select: { posts: true } } }, ...pg.args }),
    prisma.category.count(),
  ]);
  res.json({ categories, ...pg.meta(total) });
});
adminCategoriesRouter.post('/', async (req, res) => {
  const d = categoryInput.required({ name: true }).parse(req.body);
  const category = await prisma.category.create({ data: { ...d, slug: slugify(d.slug || d.name) } });
  res.status(201).json({ category });
});
adminCategoriesRouter.patch('/:id', async (req, res) => {
  const d = categoryInput.parse(req.body);
  const category = await prisma.category.update({ where: { id: req.params.id }, data: { ...d, ...(d.slug ? { slug: slugify(d.slug) } : {}) } });
  res.json({ category });
});
adminCategoriesRouter.delete('/:id', async (req, res) => {
  await prisma.category.delete({ where: { id: req.params.id } });
  res.status(204).end();
});

export const adminAuthorsRouter = Router();

const authorInput = z.object({
  name: z.string().min(1), slug: z.string(), role: z.string(), short: z.string(), bio: z.string(),
  email: z.string().nullable(), avatarUrl: z.string().nullable(),
  facts: z.array(z.object({ value: z.string(), label: z.string() })),
  expertise: z.array(z.string()),
  career: z.array(z.object({ years: z.string(), text: z.string() })),
  sortOrder: z.number().int(), showOnHome: z.boolean(),
}).partial();

adminAuthorsRouter.get('/', async (req, res) => {
  const pg = paging(req.query);
  const [authors, total] = await Promise.all([
    prisma.author.findMany({ orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }], include: { _count: { select: { posts: true } } }, ...pg.args }),
    prisma.author.count(),
  ]);
  res.json({ authors, ...pg.meta(total) });
});
adminAuthorsRouter.get('/:id', async (req, res) => {
  const author = await prisma.author.findUnique({ where: { id: req.params.id } });
  if (!author) throw new HttpError(404, 'Author not found');
  res.json({ author });
});
adminAuthorsRouter.post('/', async (req, res) => {
  const d = authorInput.required({ name: true }).parse(req.body);
  const author = await prisma.author.create({ data: { ...d, slug: slugify(d.slug || d.name) } });
  res.status(201).json({ author });
});
adminAuthorsRouter.patch('/:id', async (req, res) => {
  const d = authorInput.parse(req.body);
  const author = await prisma.author.update({ where: { id: req.params.id }, data: { ...d, ...(d.slug ? { slug: slugify(d.slug) } : {}) } });
  res.json({ author });
});
adminAuthorsRouter.delete('/:id', async (req, res) => {
  await prisma.author.delete({ where: { id: req.params.id } });
  res.status(204).end();
});

export const adminSubscribersRouter = Router();

adminSubscribersRouter.get('/', async (req, res) => {
  const csv = req.query.format === 'csv';
  const pg = paging(csv ? {} : req.query);
  const [subscribers, total] = await Promise.all([
    prisma.subscriber.findMany({ orderBy: { createdAt: 'desc' }, ...pg.args }),
    prisma.subscriber.count(),
  ]);
  if (csv) {
    res.type('text/csv').attachment('subscribers.csv');
    return res.send(['email,source,created_at', ...subscribers.map((s) => `${s.email},${s.source ?? ''},${s.createdAt.toISOString()}`)].join('\n'));
  }
  res.json({ subscribers, ...pg.meta(total) });
});
adminSubscribersRouter.delete('/:id', async (req, res) => {
  await prisma.subscriber.delete({ where: { id: req.params.id } });
  res.status(204).end();
});
