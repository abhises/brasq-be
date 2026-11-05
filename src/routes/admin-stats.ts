import { Router } from 'express';
import { prisma } from '../db.js';
import { storage } from '../lib/storage/index.js';

/** Numbers and recent activity for the admin dashboard. */
export const adminStatsRouter = Router();

adminStatsRouter.get('/', async (_req, res) => {
  const [byType, drafts, media, categories, authors, subscribers, recentPosts, recentSubscribers] = await Promise.all([
    prisma.post.groupBy({ by: ['type'], _count: { _all: true } }),
    prisma.post.count({ where: { status: 'draft' } }),
    prisma.media.count(),
    prisma.category.count(),
    prisma.author.count(),
    prisma.subscriber.count(),
    prisma.post.findMany({ orderBy: { updatedAt: 'desc' }, take: 5, select: { id: true, title: true, type: true, status: true, updatedAt: true } }),
    prisma.subscriber.findMany({ orderBy: { createdAt: 'desc' }, take: 5, select: { id: true, email: true, source: true, createdAt: true } }),
  ]);
  const types = Object.fromEntries(byType.map((t) => [t.type, t._count._all])) as Record<string, number>;
  res.json({
    user: res.locals.user as string,
    counts: { ...types, drafts, media, categories, authors, subscribers },
    recentPosts,
    recentSubscribers,
    storage: storage.name,
  });
});
