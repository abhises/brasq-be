/**
 * Fills the product catalog from the reviews and rebuilds existing posts as sections.
 *   npm run db:convert-sections            dry run: shows what would change, writes nothing
 *   npm run db:convert-sections -- --apply converts
 * Safe to run more than once: posts that already use sections are skipped, products are matched by slug.
 * A post is only converted when its visible text stays the same; otherwise it stays plain HTML (listed at the end).
 */
import 'dotenv/config';
import { prisma, Prisma } from '../../src/db.js';
import { bodyText, convertHtml, type ConvertProduct } from '../../src/lib/sections/convert.js';
import { postContext, renderDoc } from '../../src/lib/sections/render.js';
import { syncBuiltins } from '../../src/lib/sections/sync.js';
import { amazon, productPhoto, products as seedProducts, usd } from './templates.js';

const apply = process.argv.includes('--apply');
const EXTRA = [{ id: 'sweepa-r5', name: 'Sweepa R5', score: 8.1, price: 349, verdict: 'A solid lidar robot with a bagless base, but only average on pet hair.', image: 'https://images.unsplash.com/photo-1762859731349-c9ff2808b672?w=1400&q=70&auto=format&fit=crop', review: null }];

async function main() {
  await syncBuiltins();

  // 1. product catalog from the reviewed products (matched by slug, so re-runs update instead of duplicating)
  const wanted = [
    ...Object.values(seedProducts).map((p) => ({ slug: p.id, name: p.name, score: p.score, price: p.price, image: productPhoto(p), summary: p.verdict, reviewSlug: p.id, shops: [{ name: 'Amazon', url: amazon(p.name) }] })),
    ...EXTRA.map((p) => ({ slug: p.id, name: p.name, score: p.score, price: p.price, image: p.image, summary: p.verdict, reviewSlug: null, shops: [{ name: 'Amazon', url: amazon(p.name) }] })),
  ];
  const reviewSlugs = new Set((await prisma.post.findMany({ where: { type: 'review' }, select: { slug: true } })).map((r) => r.slug));
  let made = 0;
  for (const w of wanted) {
    const data = { ...w, reviewSlug: w.reviewSlug && reviewSlugs.has(w.reviewSlug) ? w.reviewSlug : null };
    const exists = await prisma.product.findUnique({ where: { slug: w.slug } });
    if (!exists) { made++; if (apply) await prisma.product.create({ data }); }
  }
  console.log(`Products: ${made} to add, ${wanted.length - made} already in the catalog`);

  const catalog = await prisma.product.findMany();
  const byUrl = new Map<string, ConvertProduct>();
  for (const p of [...catalog, ...(apply ? [] : wanted.filter((w) => !catalog.some((c) => c.slug === w.slug)).map((w) => ({ ...w, id: `new:${w.slug}` })))]) {
    const shops = (p.shops ?? []) as { name: string; url: string }[];
    if (p.reviewSlug) byUrl.set(`/review/${p.reviewSlug}`, { id: p.id, name: p.name, score: p.score != null ? p.score.toFixed(1) : '', image: p.image ?? '', summary: p.summary, url: `/review/${p.reviewSlug}`, shopUrl: shops[0]?.url ?? '', shopName: shops[0]?.name ?? '' });
  }

  // 2. posts
  const posts = await prisma.post.findMany({
    where: { sections: { equals: Prisma.AnyNull }, type: { in: ['guide', 'review', 'comparison', 'informational'] } },
    include: { category: true, author: true }, orderBy: [{ type: 'asc' }, { slug: 'asc' }],
  });
  const kept: string[] = [];
  const counts: Record<string, number> = {};
  let converted = 0;
  for (const p of posts) {
    const doc = convertHtml(p.html, { post: { title: p.title, excerpt: p.excerpt, coverImage: p.coverImage, authorBio: p.author?.bio }, products: byUrl });
    if (!doc) { kept.push(`${p.type}/${p.slug}: no <article class="bq-article">`); continue; }
    // dry run: catalog products that don't exist yet can't be resolved, so compare on a real render only when applying
    const html = await renderDoc(doc, postContext(p));
    const before = bodyText(p.html), after = bodyText(html);
    if (apply && before !== after) { kept.push(`${p.type}/${p.slug}: text would change (${before.length} → ${after.length} characters)`); continue; }
    for (const it of doc.items) counts[it.type] = (counts[it.type] ?? 0) + 1;
    converted++;
    if (apply) await prisma.post.update({ where: { id: p.id }, data: { sections: doc as unknown as Prisma.InputJsonValue, html, updatedAt: p.updatedAt } });
  }
  console.log(`Posts: ${converted} ${apply ? 'converted' : 'to convert'} of ${posts.length}`);
  console.log('Sections created:', Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} ${n}`).join(', '));
  if (kept.length) console.log(`Kept as HTML (${kept.length}):\n  ` + kept.join('\n  '));
  if (!apply) console.log('\nDry run. Run with --apply to write the changes.');
}

main().finally(() => prisma.$disconnect());
