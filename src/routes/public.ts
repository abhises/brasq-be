import { Router } from 'express';
import { z } from 'zod';
import { identify } from '../lib/auth.js';
import { prisma, Prisma } from '../db.js';
import { HttpError } from '../lib/http.js';

export const publicRouter = Router();

const published = { status: 'published' } as const;

export const cardSelect = {
  id: true, type: true, slug: true, title: true, excerpt: true, coverImage: true,
  testedCount: true, testWeeks: true, topPick: true, updatedAt: true, publishedAt: true,
  category: { select: { slug: true, name: true } },
  author: { select: { slug: true, name: true, role: true, avatarUrl: true } },
} satisfies Prisma.PostSelect;

const authorCard = { slug: true, name: true, role: true, short: true, avatarUrl: true } satisfies Prisma.AuthorSelect;

async function categoriesWithCounts() {
  const cats = await prisma.category.findMany({
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    include: { _count: { select: { posts: { where: { ...published, type: 'guide' } } } } },
  });
  return cats.map(({ _count, ...c }) => ({ ...c, guideCount: _count.posts }));
}

publicRouter.get('/site', async (_req, res) => {
  res.json({ categories: await categoriesWithCounts() });
});

publicRouter.get('/home', async (_req, res) => {
  const [hero, guides, categories, testers] = await Promise.all([
    prisma.post.findFirst({ where: { ...published, type: 'guide', featured: true }, select: cardSelect, orderBy: { updatedAt: 'desc' } }),
    prisma.post.findMany({ where: { ...published, type: 'guide', featured: false }, select: cardSelect, orderBy: { publishedAt: 'desc' }, take: 6 }),
    categoriesWithCounts(),
    prisma.author.findMany({ where: { showOnHome: true }, select: authorCard, orderBy: { sortOrder: 'asc' } }),
  ]);
  res.json({ hero, guides, categories, testers });
});

publicRouter.get('/posts', async (req, res) => {
  const q = z.object({
    type: z.enum(['guide', 'review', 'page']).optional(),
    category: z.string().optional(),
    author: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(200).default(50),
  }).parse(req.query);
  const posts = await prisma.post.findMany({
    where: { ...published, type: q.type, category: q.category ? { slug: q.category } : undefined, author: q.author ? { slug: q.author } : undefined },
    select: cardSelect, orderBy: { publishedAt: 'desc' }, take: q.limit,
  });
  res.json({ posts });
});

/** Full post. Drafts are only returned to authenticated callers with ?preview=1 */
publicRouter.get('/posts/:type/:slug', async (req, res) => {
  const type = z.enum(['guide', 'review', 'page']).parse(req.params.type);
  const preview = req.query.preview === '1' && (await identify(req));
  const post = await prisma.post.findFirst({
    where: { type, slug: req.params.slug, ...(preview ? {} : published) },
    include: { category: true, author: true },
  });
  if (!post) throw new HttpError(404, 'Not found');
  res.json({ post });
});

publicRouter.get('/categories/:slug', async (req, res) => {
  const category = await prisma.category.findUnique({ where: { slug: req.params.slug } });
  if (!category) throw new HttpError(404, 'Not found');
  const [guides, others] = await Promise.all([
    prisma.post.findMany({ where: { ...published, type: 'guide', categoryId: category.id }, select: cardSelect, orderBy: { publishedAt: 'desc' } }),
    prisma.category.findMany({ where: { NOT: { id: category.id } }, orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }], select: { slug: true, name: true } }),
  ]);
  const authorSlugs = [...new Set(guides.map((g) => g.author?.slug).filter(Boolean))] as string[];
  const authors = await prisma.author.findMany({ where: { slug: { in: authorSlugs } }, select: authorCard });
  res.json({ category, guides, authors, others });
});

publicRouter.get('/authors', async (_req, res) => {
  res.json({ authors: await prisma.author.findMany({ orderBy: { sortOrder: 'asc' } }) });
});

publicRouter.get('/authors/:slug', async (req, res) => {
  const author = await prisma.author.findUnique({ where: { slug: req.params.slug } });
  if (!author) throw new HttpError(404, 'Not found');
  const posts = await prisma.post.findMany({
    where: { ...published, authorId: author.id, type: { in: ['guide', 'review'] } },
    select: cardSelect, orderBy: [{ type: 'asc' }, { updatedAt: 'desc' }],
  });
  res.json({ author, posts });
});

publicRouter.get('/search', async (req, res) => {
  const q = String(req.query.q ?? '').trim();
  if (!q) {
    const guides = await prisma.post.findMany({ where: { ...published, type: 'guide' }, select: cardSelect, orderBy: { publishedAt: 'desc' } });
    return res.json({ q, posts: guides, authors: [], categories: [] });
  }
  const like = { contains: q, mode: 'insensitive' as const };
  const [posts, authors, categories] = await Promise.all([
    prisma.post.findMany({
      where: { ...published, type: { in: ['guide', 'review'] }, OR: [{ title: like }, { excerpt: like }, { topPick: like }] },
      select: cardSelect, orderBy: [{ type: 'asc' }, { updatedAt: 'desc' }], take: 50,
    }),
    prisma.author.findMany({ where: { OR: [{ name: like }, { role: like }] }, select: authorCard }),
    prisma.category.findMany({ where: { OR: [{ name: like }, { intro: like }] } }),
  ]);
  res.json({ q, posts, authors, categories });
});

publicRouter.post('/subscribe', async (req, res) => {
  const { email, source } = z.object({ email: z.string().email(), source: z.string().max(200).optional() }).parse(req.body);
  await prisma.subscriber.upsert({ where: { email: email.toLowerCase() }, create: { email: email.toLowerCase(), source }, update: {} });
  res.status(201).json({ ok: true });
});

publicRouter.get('/sitemap', async (_req, res) => {
  const [posts, categories, authors] = await Promise.all([
    prisma.post.findMany({ where: published, select: { type: true, slug: true, updatedAt: true } }),
    prisma.category.findMany({ select: { slug: true, updatedAt: true } }),
    prisma.author.findMany({ select: { slug: true, updatedAt: true } }),
  ]);
  res.json({ posts, categories, authors });
});
