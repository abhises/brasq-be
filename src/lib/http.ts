import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

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

export const slugify = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
