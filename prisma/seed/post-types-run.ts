/**
 * Adds (or updates) only the sample comparison and informational posts. Unlike `npm run db:seed` it deletes
 * nothing, so it is safe on a database with real content. Matching is by type + slug.
 *   npm run db:seed:post-types
 */
import 'dotenv/config';
import { prisma } from '../../src/db.js';
import { postTypeRows } from './post-types.js';
import { authorSlug } from './templates.js';

async function main() {
  let created = 0, updated = 0;
  for (const { catSlug, authorKey, ...row } of postTypeRows()) {
    const [category, author] = await Promise.all([
      prisma.category.findUnique({ where: { slug: catSlug } }),
      prisma.author.findUnique({ where: { slug: authorSlug(authorKey) } }),
    ]);
    const data = { ...row, status: 'published' as const, categoryId: category?.id ?? null, authorId: author?.id ?? null };
    const existing = await prisma.post.findUnique({ where: { type_slug: { type: row.type, slug: row.slug } } });
    if (existing) { await prisma.post.update({ where: { id: existing.id }, data }); updated++; }
    else { await prisma.post.create({ data }); created++; }
  }
  console.log(`Comparison and informational posts: ${created} created, ${updated} updated`);
}

main().finally(() => prisma.$disconnect());
