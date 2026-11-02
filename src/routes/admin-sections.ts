import { Router } from 'express';
import { z } from 'zod';
import { prisma, Prisma } from '../db.js';
import { HttpError, slugify } from '../lib/http.js';
import { scopeCss } from '../lib/sections/css.js';
import { fieldListSchema, type FieldDef } from '../lib/sections/fields.js';
import { postContext, postsUsing, renderItems, rerenderPost, usageCounts } from '../lib/sections/render.js';
import { checkTemplate, TemplateError } from '../lib/sections/template.js';

export const adminSectionsRouter = Router();

const typeInput = z.object({
  key: z.string(),
  name: z.string().min(1),
  group: z.string().min(1),
  description: z.string(),
  fields: fieldListSchema,
  template: z.string(),
  css: z.string(),
  sample: z.record(z.string(), z.unknown()),
  tocLabel: z.string(),
  placement: z.enum(['top', 'body', 'bottom']),
  scope: z.enum(['any', 'post', 'home']),
}).partial();

function validateTemplate(t?: string, label?: string) {
  try { if (t !== undefined) checkTemplate(t); if (label) checkTemplate(label); }
  catch (e) { if (e instanceof TemplateError) throw new HttpError(400, `Template: ${e.message}`); throw e; }
}

/** Sample post used for previews when no real post is given. */
async function samplePost(postId?: string) {
  const p = postId
    ? await prisma.post.findUnique({ where: { id: postId }, include: { category: true, author: true } })
    : await prisma.post.findFirst({ where: { type: 'guide', status: 'published' }, include: { category: true, author: true }, orderBy: { updatedAt: 'desc' } });
  return p ? postContext(p) : postContext({ type: 'guide', slug: 'example', title: 'The best touchless vacuum of 2026', excerpt: 'Example intro text for the preview.' });
}

async function previewHtml(key: string, data: unknown, post: Record<string, unknown>, override?: { fields: unknown; template: string; tocLabel: string; placement: string }) {
  const extra = override ? new Map([[key, { key, ...override }]]) : undefined;
  const [r] = await renderItems([{ id: 'preview', type: key, data: (data ?? {}) as Record<string, unknown> }], post, extra);
  return r ? `<div class="bq-sec bq-sec--${key}">${r.html}</div>` : '';
}

adminSectionsRouter.get('/', async (req, res) => {
  const [types, counts] = await Promise.all([prisma.sectionType.findMany({ orderBy: [{ group: 'asc' }, { name: 'asc' }] }), usageCounts()]);
  const withPreview = req.query.preview === '1';
  const post = withPreview ? await samplePost() : {};
  const out = [];
  for (const t of types) out.push({ ...t, uses: counts.get(t.key) ?? 0, previewHtml: withPreview ? await previewHtml(t.key, t.sample, post) : undefined });
  res.json({ types: out });
});

adminSectionsRouter.get('/:key', async (req, res) => {
  const type = await prisma.sectionType.findUnique({ where: { key: req.params.key } });
  if (!type) throw new HttpError(404, 'Section type not found');
  const posts = await postsUsing([type.key]);
  res.json({ type, usedBy: posts.map((p) => ({ id: p.id, title: p.title })) });
});

adminSectionsRouter.post('/', async (req, res) => {
  const d = typeInput.required({ name: true }).parse(req.body);
  validateTemplate(d.template, d.tocLabel);
  let key = slugify(d.key || d.name);
  if (!key) throw new HttpError(400, 'Give the section type a name');
  if (await prisma.sectionType.findUnique({ where: { key } })) throw new HttpError(409, `A section type with the key "${key}" already exists`);
  const type = await prisma.sectionType.create({
    data: { ...(d as Omit<typeof d, 'fields' | 'sample'>), key, builtIn: false, fields: (d.fields ?? []) as unknown as Prisma.InputJsonValue, sample: (d.sample ?? {}) as Prisma.InputJsonValue },
  });
  res.status(201).json({ type });
});

adminSectionsRouter.patch('/:key', async (req, res) => {
  const existing = await prisma.sectionType.findUnique({ where: { key: req.params.key } });
  if (!existing) throw new HttpError(404, 'Section type not found');
  if (existing.builtIn) throw new HttpError(403, 'Built-in section types are locked. Duplicate it to make your own version.');
  const { key: _ignored, ...d } = typeInput.parse(req.body);
  validateTemplate(d.template, d.tocLabel);
  const type = await prisma.sectionType.update({
    where: { key: existing.key },
    data: { ...(d as Omit<typeof d, 'fields' | 'sample'>), version: { increment: 1 }, fields: d.fields as unknown as Prisma.InputJsonValue | undefined, sample: d.sample as Prisma.InputJsonValue | undefined },
  });
  const posts = await postsUsing([type.key]);
  for (const p of posts) await rerenderPost(p.id);
  res.json({ type, rerendered: posts.length });
});

adminSectionsRouter.post('/:key/duplicate', async (req, res) => {
  const src = await prisma.sectionType.findUnique({ where: { key: req.params.key } });
  if (!src) throw new HttpError(404, 'Section type not found');
  let key = `${src.key}-copy`, n = 2;
  while (await prisma.sectionType.findUnique({ where: { key } })) key = `${src.key}-copy-${n++}`;
  const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = src;
  const type = await prisma.sectionType.create({
    data: { ...rest, key, name: `${src.name} (copy)`, builtIn: false, version: 1, fields: src.fields as Prisma.InputJsonValue, sample: src.sample as Prisma.InputJsonValue },
  });
  res.status(201).json({ type });
});

adminSectionsRouter.delete('/:key', async (req, res) => {
  const type = await prisma.sectionType.findUnique({ where: { key: req.params.key } });
  if (!type) throw new HttpError(404, 'Section type not found');
  if (type.builtIn) throw new HttpError(403, 'Built-in section types can’t be deleted.');
  const posts = await postsUsing([type.key]);
  if (posts.length) throw new HttpError(409, `Used in ${posts.length} ${posts.length === 1 ? 'page' : 'pages'}: ${posts.slice(0, 5).map((p) => p.title).join(', ')}. Remove it there first.`);
  await prisma.sectionType.delete({ where: { key: type.key } });
  res.status(204).end();
});

/**
 * Preview one section. Pass `key` + `data` for a saved type, or `type` (fields, template, css, tocLabel) to preview
 * unsaved changes in the type editor. Optional `postId` renders {{post.*}} with that post.
 */
adminSectionsRouter.post('/preview', async (req, res) => {
  const b = z.object({
    key: z.string().optional(), data: z.unknown().optional(), postId: z.string().optional(),
    type: z.object({ fields: fieldListSchema, template: z.string(), css: z.string().default(''), tocLabel: z.string().default(''), placement: z.string().default('body') }).optional(),
  }).parse(req.body);
  const key = b.key || 'preview';
  if (b.type) validateTemplate(b.type.template, b.type.tocLabel);
  const post = await samplePost(b.postId);
  const html = await previewHtml(key, b.data ?? {}, post, b.type && { fields: b.type.fields as FieldDef[], template: b.type.template, tocLabel: b.type.tocLabel, placement: b.type.placement });
  const css = b.type ? scopeCss(b.type.css, `.bq-sec--${key}`) : '';
  res.json({ html, css });
});
