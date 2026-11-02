import { Router } from 'express';
import { z } from 'zod';
import { prisma, Prisma } from '../db.js';
import { HttpError, paging, slugify } from '../lib/http.js';
import { postType } from '../lib/post-types.js';
import { postContext, renderDoc, rerenderPost, sectionsDocSchema } from '../lib/sections/render.js';

export const adminPostsRouter = Router();

const stickyBar = z.object({
  name: z.string(), score: z.string().optional(), price: z.string().optional(),
  shop: z.string().optional(), url: z.string(), image: z.string().optional(),
}).nullable();

const postInput = z.object({
  type: postType,
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
  /** Section-based content; `null` turns a post back into plain HTML. When set, `html` is generated from it. */
  sections: sectionsDocSchema.nullable(),
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
  const { categorySlug, authorSlug, stickyBar: bar, sections, ...rest } = input;
  const data: Record<string, unknown> = { ...rest };
  if (sections !== undefined) data.sections = sections === null ? Prisma.DbNull : sections;
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
    type: postType.optional(),
    status: z.enum(['draft', 'published']).optional(),
    q: z.string().optional(),
  }).parse(req.query);
  const where: Prisma.PostWhereInput = {
    type: q.type, status: q.status, NOT: { type: 'page', slug: 'front-page' },
    ...(q.q ? { OR: [{ title: { contains: q.q, mode: 'insensitive' } }, { slug: { contains: q.q, mode: 'insensitive' } }] } : {}),
  };
  const pg = paging(req.query);
  const [posts, total] = await Promise.all([
    prisma.post.findMany({ where, select: listSelect, orderBy: { updatedAt: 'desc' }, ...pg.args }),
    prisma.post.count({ where }),
  ]);
  res.json({ posts, ...pg.meta(total) });
});

/** Renders unsaved sections for the editor's live preview, using the post settings from the form. */
adminPostsRouter.post('/preview', async (req, res) => {
  const b = z.object({
    sections: sectionsDocSchema, type: postType.default('guide'), slug: z.string().default('preview'), title: z.string().default(''),
    excerpt: z.string().default(''), coverImage: z.string().nullable().default(null), testedCount: z.number().nullable().default(null),
    testWeeks: z.number().nullable().default(null), topPick: z.string().nullable().default(null),
    categoryId: z.string().nullable().default(null), authorId: z.string().nullable().default(null),
  }).parse(req.body);
  const [category, author] = await Promise.all([
    b.categoryId ? prisma.category.findUnique({ where: { id: b.categoryId } }) : null,
    b.authorId ? prisma.author.findUnique({ where: { id: b.authorId } }) : null,
  ]);
  const { sections, ...fields } = b;
  const html = await renderDoc(sections, postContext({ ...fields, title: fields.title || 'Untitled', category, author, updatedAt: new Date() }));
  res.json({ html });
});

adminPostsRouter.get('/:id', async (req, res) => {
  const post = await prisma.post.findUnique({ where: { id: req.params.id }, include: { category: true, author: true } });
  if (!post) throw new HttpError(404, 'Post not found');
  res.json({ post });
});

adminPostsRouter.post('/', async (req, res) => {
  const input = postInput.required({ type: true, title: true }).parse(req.body);
  const data = await toData({ ...input, slug: input.slug || input.title });
  let post = await prisma.post.create({ data: data as Prisma.PostUncheckedCreateInput });
  if (await rerenderPost(post.id)) post = (await prisma.post.findUnique({ where: { id: post.id } }))!;
  res.status(201).json({ post });
});

/** Create or update by type + slug. Handy for automation: re-running the same job updates the post. */
adminPostsRouter.put('/by-slug/:type/:slug', async (req, res) => {
  const type = postType.parse(req.params.type);
  const slug = slugify(req.params.slug);
  const input = postInput.parse(req.body);
  const existing = await prisma.post.findUnique({ where: { type_slug: { type, slug } } });
  if (existing) {
    let post = await prisma.post.update({ where: { id: existing.id }, data: (await toData(input, existing)) as Prisma.PostUncheckedUpdateInput });
    if (await rerenderPost(post.id)) post = (await prisma.post.findUnique({ where: { id: post.id } }))!;
    return res.json({ post, created: false });
  }
  if (!input.title) throw new HttpError(400, 'title is required to create a post');
  let post = await prisma.post.create({ data: (await toData({ ...input, type, slug })) as Prisma.PostUncheckedCreateInput });
  if (await rerenderPost(post.id)) post = (await prisma.post.findUnique({ where: { id: post.id } }))!;
  res.status(201).json({ post, created: true });
});

adminPostsRouter.patch('/:id', async (req, res) => {
  const existing = await prisma.post.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new HttpError(404, 'Post not found');
  const data = await toData(postInput.parse(req.body), existing);
  let post = await prisma.post.update({ where: { id: existing.id }, data: data as Prisma.PostUncheckedUpdateInput });
  if (await rerenderPost(post.id)) post = (await prisma.post.findUnique({ where: { id: post.id } }))!;
  res.json({ post });
});

adminPostsRouter.delete('/:id', async (req, res) => {
  await prisma.post.delete({ where: { id: req.params.id } });
  res.status(204).end();
});
