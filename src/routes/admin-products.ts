import { Router } from 'express';
import { z } from 'zod';
import { prisma, Prisma } from '../db.js';
import { HttpError, paging, slugify } from '../lib/http.js';
import { rerenderPost } from '../lib/sections/render.js';

export const adminProductsRouter = Router();

const productInput = z.object({
  name: z.string().min(1), slug: z.string(), score: z.number().min(0).max(10).nullable(), price: z.number().min(0).nullable(),
  image: z.string().nullable(), shops: z.array(z.object({ name: z.string().min(1), url: z.string().min(1) })),
  reviewSlug: z.string().nullable(), summary: z.string(),
}).partial();

/** Section-based posts that reference a product (by id or slug) in any field. */
async function postsReferencing(p: { id: string; slug: string }) {
  const rows = await prisma.post.findMany({ where: { NOT: { sections: { equals: Prisma.AnyNull } } }, select: { id: true, sections: true } });
  return rows.filter((r) => { const s = JSON.stringify(r.sections); return s.includes(`"${p.id}"`) || s.includes(`"${p.slug}"`); });
}

adminProductsRouter.get('/', async (req, res) => {
  const q = String(req.query.q ?? '').trim();
  const where: Prisma.ProductWhereInput = q ? { OR: [{ name: { contains: q, mode: 'insensitive' } }, { slug: { contains: q, mode: 'insensitive' } }] } : {};
  const pg = paging(req.query);
  const [products, total] = await Promise.all([prisma.product.findMany({ where, orderBy: { name: 'asc' }, ...pg.args }), prisma.product.count({ where })]);
  res.json({ products, ...pg.meta(total) });
});

adminProductsRouter.get('/:id', async (req, res) => {
  const product = await prisma.product.findFirst({ where: { OR: [{ id: req.params.id }, { slug: req.params.id }] } });
  if (!product) throw new HttpError(404, 'Product not found');
  res.json({ product, usedIn: (await postsReferencing(product)).length });
});

adminProductsRouter.post('/', async (req, res) => {
  const d = productInput.required({ name: true }).parse(req.body);
  const product = await prisma.product.create({ data: { ...d, slug: slugify(d.slug || d.name), shops: d.shops ?? [] } });
  res.status(201).json({ product });
});

adminProductsRouter.patch('/:id', async (req, res) => {
  const d = productInput.parse(req.body);
  const product = await prisma.product.update({ where: { id: req.params.id }, data: { ...d, ...(d.slug ? { slug: slugify(d.slug) } : {}) } });
  const posts = await postsReferencing(product);
  for (const p of posts) await rerenderPost(p.id);
  res.json({ product, rerendered: posts.length });
});

adminProductsRouter.delete('/:id', async (req, res) => {
  const product = await prisma.product.findUnique({ where: { id: req.params.id } });
  if (!product) throw new HttpError(404, 'Product not found');
  const used = await postsReferencing(product);
  if (used.length) throw new HttpError(409, `Used in ${used.length} ${used.length === 1 ? 'page' : 'pages'}. Remove it there first.`);
  await prisma.product.delete({ where: { id: product.id } });
  res.status(204).end();
});
