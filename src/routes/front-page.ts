import { Router } from 'express';
import { z } from 'zod';
import { identify } from '../lib/auth.js';
import { prisma, Prisma } from '../db.js';
import { DEFAULT_HOME } from '../lib/sections/builtins-home.js';
import { renderDoc, sectionsDocSchema, type SectionsDoc } from '../lib/sections/render.js';

/** The front page is stored as a hidden page post: `sections` = live version, `draftSections` = unpublished edits. */
export const FRONT_SLUG = 'front-page';
const where = { type_slug: { type: 'page' as const, slug: FRONT_SLUG } };
const json = (v: unknown) => v as Prisma.InputJsonValue;

async function frontPage() {
  return (await prisma.post.findUnique({ where })) ?? prisma.post.create({
    data: { type: 'page', slug: FRONT_SLUG, status: 'draft', title: 'Front page', excerpt: 'Edited under Admin → Front page.', draftSections: json(DEFAULT_HOME) },
  });
}
const render = (doc: SectionsDoc) => renderDoc({ ...doc, layout: 'raw' }, { title: 'BrasQ', type: 'page', typeLabel: 'Page', url: '/' });

export const adminFrontPageRouter = Router();

adminFrontPageRouter.get('/', async (_req, res) => {
  const p = await frontPage();
  const draft = (p.draftSections ?? p.sections ?? DEFAULT_HOME) as SectionsDoc;
  res.json({
    draft, isLive: p.sections !== null, publishedAt: p.publishedAt,
    hasUnpublishedChanges: p.draftSections !== null && JSON.stringify(p.draftSections) !== JSON.stringify(p.sections),
  });
});

adminFrontPageRouter.put('/draft', async (req, res) => {
  const { sections } = z.object({ sections: sectionsDocSchema }).parse(req.body);
  await frontPage();
  await prisma.post.update({ where, data: { draftSections: json(sections) } });
  res.json({ ok: true });
});

adminFrontPageRouter.post('/publish', async (_req, res) => {
  const p = await frontPage();
  const doc = p.draftSections ?? p.sections;
  if (!doc) return res.status(400).json({ error: 'Nothing to publish yet' });
  await prisma.post.update({ where, data: { sections: json(doc), draftSections: Prisma.DbNull, publishedAt: new Date() } });
  res.json({ ok: true });
});

adminFrontPageRouter.post('/discard', async (_req, res) => {
  const p = await frontPage();
  await prisma.post.update({ where, data: { draftSections: p.sections ? Prisma.DbNull : json(DEFAULT_HOME) } });
  res.json({ ok: true });
});

adminFrontPageRouter.post('/preview', async (req, res) => {
  const { sections } = z.object({ sections: sectionsDocSchema }).parse(req.body);
  res.json({ html: await render(sections) });
});

/** Public: the live front page, or the draft for a signed-in admin with ?preview=1. `html: null` = not set up yet. */
export async function publicFrontPage(req: import('express').Request, res: import('express').Response) {
  const p = await prisma.post.findUnique({ where });
  const preview = req.query.preview === '1' && (await identify(req));
  const doc = (preview ? p?.draftSections ?? p?.sections : p?.sections) as SectionsDoc | null | undefined;
  res.set('Cache-Control', 'no-store').json({ html: doc ? await render(sectionsDocSchema.parse(doc)) : null, preview: !!preview });
}
