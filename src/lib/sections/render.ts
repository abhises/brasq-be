import { z } from 'zod';
import { prisma, Prisma } from '../../db.js';
import { slugify } from '../http.js';
import { BUILTIN_BY_KEY } from './builtins.js';
import { collectRefs, prepareData, type FieldDef, type Ref, type Resolved } from './fields.js';
import { escapeHtml, renderTemplate } from './template.js';

export const sectionItemSchema = z.object({
  id: z.string().min(1),
  type: z.string().min(1),
  data: z.record(z.string(), z.unknown()).default({}),
  hidden: z.boolean().optional(),
  /** Overrides the type's position: "top" / "bottom" = full width above / below the columns */
  placement: z.enum(['top', 'body', 'bottom']).optional(),
  /** Overrides the name in the table of contents; "" keeps the section out of it */
  tocLabel: z.string().optional(),
});
export const sectionsDocSchema = z.object({
  /**
   * "toc": table of contents beside the content (articles); "wide": no table of contents (front page, short pages);
   * "raw": no page frame at all, sections are output as they are (posts converted from full-page HTML)
   */
  layout: z.enum(['toc', 'wide', 'raw']).default('toc'),
  /** Extra classes for the page wrapper, e.g. "bq-compare" or "bq-infopost" for those page styles */
  className: z.string().regex(/^[a-z0-9_\- ]*$/i).optional(),
  /** Heading of the table of contents (default "On this page") and whether it ends with a "Back to top" link */
  tocTitle: z.string().optional(),
  backToTop: z.boolean().optional(),
  items: z.array(sectionItemSchema),
});
export type SectionsDoc = z.infer<typeof sectionsDocSchema>;
type TypeRow = { key: string; fields: unknown; template: string; tocLabel: string; placement: string };

const TYPE_LABEL: Record<string, string> = { guide: 'Buying guide', review: 'Review', comparison: 'Comparison', informational: 'Explained', page: 'Page' };
const PREFIX: Record<string, string> = { guide: '/guide/', review: '/review/', comparison: '/compare/', informational: '/explained/' };
export const postPath = (p: { type: string; slug: string }) => (PREFIX[p.type] ?? '/') + p.slug;
const longDate = (d: Date | string | null | undefined) => (d ? new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }) : '');

type PostForContext = Prisma.PostGetPayload<{ include: { category: true; author: true } }>;

/** The `post` object available in every template as {{post.title}}, {{post.author.name}} … */
export function postContext(p: Partial<PostForContext> & { type: string; slug: string; title: string }) {
  return {
    title: p.title, excerpt: p.excerpt ?? '', type: p.type, typeLabel: TYPE_LABEL[p.type] ?? p.type, url: postPath(p),
    coverImage: p.coverImage ?? '', testedCount: p.testedCount ?? '', testWeeks: p.testWeeks ?? '', topPick: p.topPick ?? '',
    updated: longDate(p.updatedAt ?? new Date()), published: longDate(p.publishedAt),
    category: p.category ? { name: p.category.name, url: `/category/${p.category.slug}` } : null,
    author: p.author ? { name: p.author.name, url: `/author/${p.author.slug}`, avatar: p.author.avatarUrl ?? '', role: p.author.role, short: p.author.short, bio: p.author.bio } : null,
  };
}

async function loadTypes(keys: string[]) {
  const rows = await prisma.sectionType.findMany({ where: { key: { in: keys } }, select: { key: true, fields: true, template: true, tocLabel: true, placement: true } });
  return new Map(rows.map((r) => [r.key, r as TypeRow]));
}

async function resolveRefs(refs: Ref): Promise<Resolved> {
  const ids = [...refs.posts], pids = [...refs.products];
  const [posts, products] = await Promise.all([
    ids.length ? prisma.post.findMany({ where: { OR: [{ id: { in: ids } }, { slug: { in: ids } }] }, include: { category: true } }) : [],
    pids.length ? prisma.product.findMany({ where: { OR: [{ id: { in: pids } }, { slug: { in: pids } }] } }) : [],
  ]);
  const resolved: Resolved = { posts: new Map(), products: new Map() };
  for (const p of posts) {
    const card = { id: p.id, title: p.title, excerpt: p.excerpt, url: postPath(p), coverImage: p.coverImage ?? '', type: p.type, typeLabel: TYPE_LABEL[p.type] ?? p.type, category: p.category?.name ?? '' };
    resolved.posts.set(p.id, card); resolved.posts.set(p.slug, card);
  }
  for (const p of products) {
    const shops = (Array.isArray(p.shops) ? p.shops : []) as { name?: string; url?: string }[];
    const card = {
      id: p.id, slug: p.slug, name: p.name, score: p.score != null ? p.score.toFixed(1) : '', price: p.price ?? '',
      priceText: p.price != null ? '$' + p.price.toLocaleString('en-US') : '', image: p.image ?? '', summary: p.summary,
      url: p.reviewSlug ? `/review/${p.reviewSlug}` : '', shopName: shops[0]?.name ?? '', shopUrl: shops[0]?.url ?? '', shops,
    };
    resolved.products.set(p.id, card); resolved.products.set(p.slug, card);
  }
  return resolved;
}

export type RenderedSection = { id: string; type: string; anchor: string; placement: string; html: string; toc: string };

/** Renders each section on its own (also used by the admin preview). */
export async function renderItems(items: SectionsDoc['items'], post: Record<string, unknown>, extraTypes?: Map<string, TypeRow>): Promise<RenderedSection[]> {
  const visible = items.filter((s) => !s.hidden);
  const types = await loadTypes([...new Set(visible.map((s) => s.type))]);
  extraTypes?.forEach((t, k) => types.set(k, t));
  const refs: Ref = { posts: new Set(), products: new Set() };
  for (const s of visible) { const t = types.get(s.type); if (t) collectRefs(t.fields as FieldDef[], s.data, refs); }
  const resolved = await resolveRefs(refs);
  const used = new Set<string>();
  const out: RenderedSection[] = [];
  for (const s of visible) {
    const t = types.get(s.type);
    if (!t) { out.push({ id: s.id, type: s.type, anchor: '', placement: 'body', html: `<!-- unknown section type "${escapeHtml(s.type)}" -->`, toc: '' }); continue; }
    const data = prepareData(t.fields as FieldDef[], s.data, resolved);
    const builtin = BUILTIN_BY_KEY.get(s.type);
    builtin?.prepare?.(data, post);
    try { await builtin?.load?.(data); } catch (e) { console.error(`Section "${s.type}" could not load its data`, e); }
    let toc = '';
    try { toc = s.tocLabel !== undefined ? s.tocLabel.trim() : t.tocLabel ? renderTemplate(t.tocLabel, data, { post }).replace(/<[^>]+>/g, '').trim() : ''; } catch { /* bad label: leave out of TOC */ }
    let anchor = slugify(toc || s.type) || 's';
    if (used.has(anchor)) anchor = `${anchor}-${s.id.slice(-4)}`;
    used.add(anchor);
    let html: string;
    try { html = renderTemplate(t.template, data, { post, section: { id: s.id, anchor } }); }
    catch (e) { html = `<!-- section "${escapeHtml(s.type)}" failed: ${escapeHtml((e as Error).message)} -->`; }
    out.push({ id: s.id, type: s.type, anchor, placement: s.placement ?? t.placement, html, toc });
  }
  return out;
}

const wrap = (s: RenderedSection) => `<div class="bq-sec bq-sec--${s.type}" id="${s.anchor}" data-section="${escapeHtml(s.id)}">${s.html}</div>`;

/** Full page HTML for a section-based post. */
export async function renderDoc(doc: SectionsDoc, post: Record<string, unknown>) {
  const parts = await renderItems(doc.items, post);
  const top = parts.filter((p) => p.placement === 'top').map(wrap).join('\n');
  const body = parts.filter((p) => p.placement !== 'top' && p.placement !== 'bottom').map(wrap).join('\n');
  const bottom = parts.filter((p) => p.placement === 'bottom').map(wrap).join('\n');
  const tocItems = parts.filter((p) => p.toc && p.placement !== 'top' && p.placement !== 'bottom');
  if (doc.layout === 'raw') return parts.map(wrap).join('\n');
  const cls = doc.className ? ` ${doc.className.trim()}` : '';
  if (doc.layout === 'wide' || tocItems.length < 2) {
    return `<article class="bq-article bq-sections bq-sections--wide${cls}">\n${top}\n<div class="bq-content bq-content--wide">\n${body}\n</div>\n${bottom}\n</article>`;
  }
  const tocTitle = doc.tocTitle?.trim() || 'On this page';
  const links = tocItems.map((p) => `<a href="#${p.anchor}">${escapeHtml(p.toc)}</a>`).join('\n    ');
  return `<article class="bq-article bq-sections${cls}">
${top}
<div class="bq-layout">
  <aside class="bq-toc" data-bq-spy>
    <div class="bq-toc__title">${escapeHtml(tocTitle)}</div>
    ${links}${doc.backToTop === false ? '' : '\n    <a class="bq-toc__top" href="#">Back to top ↑</a>'}
  </aside>
  <div class="bq-content">
<details class="bq-toc-mobile"><summary>${escapeHtml(tocTitle)}</summary><nav>${tocItems.map((p) => `<a href="#${p.anchor}">${escapeHtml(p.toc)}</a>`).join('')}</nav></details>
${body}
  </div>
</div>
${bottom}
</article>`;
}

/** Re-renders the stored HTML of one section-based post. Returns false for plain HTML posts. */
export async function rerenderPost(id: string) {
  const p = await prisma.post.findUnique({ where: { id }, include: { category: true, author: true } });
  if (!p || !p.sections) return false;
  const doc = sectionsDocSchema.parse(p.sections);
  const html = await renderDoc(doc, postContext(p));
  if (html !== p.html) await prisma.post.update({ where: { id }, data: { html, updatedAt: p.updatedAt } });
  return true;
}

/** Ids of section-based posts that use one of the given section types. */
export async function postsUsing(keys: string[]) {
  const rows = await prisma.post.findMany({ where: { NOT: { sections: { equals: Prisma.AnyNull } } }, select: { id: true, title: true, sections: true } });
  return rows.filter((r) => ((r.sections as SectionsDoc | null)?.items ?? []).some((s) => keys.includes(s.type)));
}

/** How many section-based posts use each section type. */
export async function usageCounts() {
  const rows = await prisma.post.findMany({ where: { NOT: { sections: { equals: Prisma.AnyNull } } }, select: { sections: true } });
  const counts = new Map<string, number>();
  for (const r of rows) for (const key of new Set(((r.sections as SectionsDoc | null)?.items ?? []).map((s) => s.type))) counts.set(key, (counts.get(key) ?? 0) + 1);
  return counts;
}
