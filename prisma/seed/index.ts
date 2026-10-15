/**
 * Seeds the database with the content of the BrasQ design prototype.
 * WARNING: deletes all existing posts, categories and authors first (media and subscribers are kept).
 *   npm run db:seed
 */
import 'dotenv/config';
import { prisma } from '../../src/db.js';
import { authors, cats, deals, G, info } from './data.js';
import {
  authorPhoto, authorSlug, dealsHtml, guideHtml, guideJsonLd, guidePhoto, infoHtml, infoSlugs, methodHtml,
  productPhoto, products, reviewHtml, usd, amazon,
} from './templates.js';

const SITE_URL = (process.env.SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '');
const day = (s: string) => new Date(s + ' 12:00 UTC');

async function main() {
  await prisma.post.deleteMany();
  await prisma.category.deleteMany();
  await prisma.author.deleteMany();

  const catIds: Record<string, string> = {};
  for (const [i, c] of (cats as any[]).entries()) {
    const row = await prisma.category.create({ data: { slug: c.id, name: c.name, intro: c.intro, sortOrder: i } });
    catIds[c.id] = row.id;
  }

  const authorIds: Record<string, string> = {};
  const order = ['ryan', 'sarah', 'thomas', 'lauren', 'jake'];
  for (const key of order) {
    const a = (authors as any)[key];
    const row = await prisma.author.create({
      data: {
        slug: authorSlug(key), name: a.name, role: a.role, short: a.short, bio: a.bio,
        email: `${key}@brasq.com`, avatarUrl: authorPhoto(key),
        facts: a.facts.map((f: string[]) => ({ value: f[0], label: f[1] })),
        expertise: a.expertise,
        career: a.career.map((c: string[]) => ({ years: c[0], text: c[1] })),
        sortOrder: order.indexOf(key), showOnHome: key !== 'ryan',
      },
    });
    authorIds[key] = row.id;
  }

  for (const g of G as any[]) {
    const F = g.full;
    const top = g.pickObjs[0];
    const col0 = F?.compare?.cols?.[0];
    await prisma.post.create({
      data: {
        type: 'guide', status: 'published', slug: g.id, title: g.title,
        excerpt: g.id === 'stick-vacuums' ? 'For six weeks we vacuumed up cat hair, sand and oatmeal with 22 stick vacuums. Three models stood out.' : g.intro,
        html: guideHtml(g), css: '',
        coverImage: guidePhoto(g, 0),
        seoTitle: F?.seoTitle ?? `${g.title} | BrasQ`,
        seoDescription: g.intro,
        jsonLd: guideJsonLd(g, SITE_URL),
        testedCount: g.count, testWeeks: g.weeks, topPick: top.name,
        stickyBar: col0 ? { name: top.name, score: top.score.toFixed(1), price: usd(top.price), shop: 'Amazon', url: amazon(top.name), image: productPhoto(top) } : undefined,
        newsletterPopup: !!F,
        featured: g.id === 'stick-vacuums',
        categoryId: catIds[g.cat], authorId: authorIds[g.author],
        publishedAt: day(g.published), createdAt: day(g.published), updatedAt: day(g.updated),
      },
    });
  }

  for (const p of Object.values(products)) {
    const g = p.guide;
    await prisma.post.create({
      data: {
        type: 'review', status: 'published', slug: p.id, title: `${p.name} review`,
        excerpt: p.verdict, html: reviewHtml(p), css: '',
        coverImage: productPhoto(p),
        seoTitle: `${p.name} review: tested for ${g.weeks} weeks | BrasQ`,
        seoDescription: p.verdict,
        testedCount: g.count, testWeeks: g.weeks, topPick: p.label,
        categoryId: catIds[g.cat], authorId: authorIds[g.author],
        publishedAt: day(g.published), createdAt: day(g.published), updatedAt: day(g.updated),
      },
    });
  }

  const pages: { slug: string; title: string; excerpt: string; html: string }[] = [
    { slug: 'deals', title: 'Deals', excerpt: 'Deals on products we tested and recommend, compared with the price over the past 90 days.', html: dealsHtml(deals as [string, number][]) },
    { slug: 'how-we-test', title: 'How we test, and how we make our money', excerpt: 'Our test method, how a test score is built and how BrasQ makes money.', html: methodHtml() },
    ...Object.keys(info).map((k) => ({ slug: infoSlugs[k], title: (info as any)[k].title, excerpt: (info as any)[k].lead, html: infoHtml(k) })),
  ];
  for (const pg of pages) {
    await prisma.post.create({
      data: { type: 'page', status: 'published', slug: pg.slug, title: pg.title, excerpt: pg.excerpt, html: pg.html, seoTitle: `${pg.title} | BrasQ`, publishedAt: day('September 1, 2026'), updatedAt: day('September 1, 2026') },
    });
  }

  const counts = await prisma.post.groupBy({ by: ['type'], _count: true });
  console.log('Seeded:', counts.map((c) => `${c._count} ${c.type}s`).join(', '), `· ${cats.length} categories · ${order.length} authors`);
}

main().finally(() => prisma.$disconnect());
