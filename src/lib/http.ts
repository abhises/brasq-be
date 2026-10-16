import type { NextFunction, Request, Response } from 'express';
import { z, ZodError } from 'zod';

export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) return res.status(400).json({ error: 'Validation failed', issues: err.issues });
  if (err instanceof HttpError) return res.status(err.status).json({ error: err.message });
  const code = (err as { code?: string })?.code;
  if (code === 'P2002') return res.status(409).json({ error: 'Already exists (unique field conflict)' });
  if (code === 'P2025') return res.status(404).json({ error: 'Not found' });
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
}

const pagingQuery = z.object({
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

/**
 * Optional paging for list endpoints: `?page=2&pageSize=20`. Without `page` the whole list is returned
 * (editor dropdowns, CSV export). Spread `args` into findMany and `meta(total)` into the response.
 */
type PageMeta = { page?: number; pageSize?: number; total?: number };
export function paging(query: unknown): { args: { skip?: number; take?: number }; meta: (total: number) => PageMeta } {
  const { page, pageSize } = pagingQuery.parse(query);
  if (!page) return { args: {}, meta: (_total: number) => ({}) };
  return { args: { skip: (page - 1) * pageSize, take: pageSize }, meta: (total: number) => ({ page, pageSize, total }) };
}

export const slugify = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
