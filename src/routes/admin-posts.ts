import { Router } from 'express';
import { z } from 'zod';
import { prisma, Prisma } from '../db.js';
import { HttpError, slugify } from '../lib/http.js';

export const adminPostsRouter = Router();

const stickyBar = z.object({
  name: z.string(), score: z.string().optional(), price: z.string().optional(),
  shop: z.string().optional(), url: z.string(), image: z.string().optional(),
}).nullable();

const postInput = z.object({
  type: z.enum(['guide', 'review', 'page']),
  status: z.enum(['draft', 'published']),
  slug: z.string(),
  title: z.string().min(1),
  excerpt: z.string(),
  html: z.string(),
  css: z.string(),
  coverImage: z.string().nullable(),
  seoTitle: z.string().nullable(),
  seoDescription: z.string().nullable(),
  jsonLd: z.string().nullable(),
  testedCount: z.number().int().nullable(),
  testWeeks: z.number().int().nullable(),
  topPick: z.string().nullable(),
  stickyBar,
  newsletterPopup: z.boolean(),
  featured: z.boolean(),
  /** Category / author can be passed as id or slug */
  categoryId: z.string().nullable(),
  categorySlug: z.string().nullable(),
  authorId: z.string().nullable(),
  authorSlug: z.string().nullable(),
  publishedAt: z.coerce.date().nullable(),
}).partial();

type PostInput = z.infer<typeof postInput>;

async function toData(input: PostInput, existing?: { status: string; publishedAt: Date | null }) {
  const { categorySlug, authorSlug, stickyBar: bar, ...rest } = input;
  const data: Record<string, unknown> = { ...rest };
  if (input.slug !== undefined) data.slug = slugify(input.slug);
  if (bar !== undefined) data.stickyBar = bar === null ? Prisma.DbNull : bar;
  if (categorySlug !== undefined) {
    data.categoryId = categorySlug ? (await prisma.category.findUnique({ where: { slug: categorySlug } }))?.id ?? null : null;
    if (categorySlug && !data.categoryId) throw new HttpError(400, `Unknown category "${categorySlug}"`);
  }
  if (authorSlug !== undefined) {
    data.authorId = authorSlug ? (await prisma.author.findUnique({ where: { slug: authorSlug } }))?.id ?? null : null;
    if (authorSlug && !data.authorId) throw new HttpError(400, `Unknown author "${authorSlug}"`);
  }
  const nowPublished = (input.status ?? existing?.status) === 'published';
  if (nowPublished && !existing?.publishedAt && input.publishedAt === undefined) data.publishedAt = new Date();
  return data;
}

const listSelect = {
  id: true, type: true, status: true, slug: true, title: true, excerpt: true, coverImage: true, featured: true,
  updatedAt: true, publishedAt: true,
  category: { select: { slug: true, name: true } }, author: { select: { slug: true, name: true } },
} satisfies Prisma.PostSelect;

adminPostsRouter.get('/', async (req, res) => {
  const q = z.object({
    type: z.enum(['guide', 'review', 'page']).optional(),
    status: z.enum(['draft', 'published']).optional(),
    q: z.string().optional(),
  }).parse(req.query);
  const posts = await prisma.post.findMany({
    where: {
      type: q.type, status: q.status,
      ...(q.q ? { OR: [{ title: { contains: q.q, mode: 'insensitive' } }, { slug: { contains: q.q, mode: 'insensitive' } }] } : {}),
    },
    select: listSelect,
    orderBy: { updatedAt: 'desc' },
  });
  res.json({ posts });
});

adminPostsRouter.get('/:id', async (req, res) => {
  const post = await prisma.post.findUnique({ where: { id: req.params.id }, include: { category: true, author: true } });
  if (!post) throw new HttpError(404, 'Post not found');
  res.json({ post });
});

adminPostsRouter.post('/', async (req, res) => {
  const input = postInput.required({ type: true, title: true }).parse(req.body);
  const data = await toData({ ...input, slug: input.slug || input.title });
  const post = await prisma.post.create({ data: data as Prisma.PostUncheckedCreateInput });
  res.status(201).json({ post });
});

/** Create or update by type + slug. Handy for automation: re-running the same job updates the post. */
adminPostsRouter.put('/by-slug/:type/:slug', async (req, res) => {
  const type = z.enum(['guide', 'review', 'page']).parse(req.params.type);
  const slug = slugify(req.params.slug);
  const input = postInput.parse(req.body);
  const existing = await prisma.post.findUnique({ where: { type_slug: { type, slug } } });
  if (existing) {
    const post = await prisma.post.update({ where: { id: existing.id }, data: (await toData(input, existing)) as Prisma.PostUncheckedUpdateInput });
    return res.json({ post, created: false });
  }
  if (!input.title) throw new HttpError(400, 'title is required to create a post');
  const post = await prisma.post.create({ data: (await toData({ ...input, type, slug })) as Prisma.PostUncheckedCreateInput });
  res.status(201).json({ post, created: true });
});

adminPostsRouter.patch('/:id', async (req, res) => {
  const existing = await prisma.post.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new HttpError(404, 'Post not found');
  const data = await toData(postInput.parse(req.body), existing);
  const post = await prisma.post.update({ where: { id: existing.id }, data: data as Prisma.PostUncheckedUpdateInput });
  res.json({ post });
});

adminPostsRouter.delete('/:id', async (req, res) => {
  await prisma.post.delete({ where: { id: req.params.id } });
  res.status(204).end();
});
