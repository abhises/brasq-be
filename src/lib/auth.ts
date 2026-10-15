import { timingSafeEqual } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { SignJWT, jwtVerify } from 'jose';
import { env } from '../env.js';

const key = new TextEncoder().encode(env.authSecret);

function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a), bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export function checkCredentials(email: string, password: string) {
  return safeEqual(email.toLowerCase(), env.adminEmail.toLowerCase()) && safeEqual(password, env.adminPassword);
}

export function signToken(email: string) {
  return new SignJWT({ email }).setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime('7d').sign(key);
}

/** Returns who is calling, or null. Accepts an admin JWT or the static API token. */
export async function identify(req: Request): Promise<string | null> {
  const h = req.headers.authorization ?? '';
  const token = h.startsWith('Bearer ') ? h.slice(7).trim() : '';
  if (!token) return null;
  if (env.apiToken && safeEqual(token, env.apiToken)) return 'api-token';
  try {
    const { payload } = await jwtVerify(token, key);
    return typeof payload.email === 'string' ? payload.email : null;
  } catch {
    return null;
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const who = await identify(req);
  if (!who) return res.status(401).json({ error: 'Unauthorized' });
  res.locals.user = who;
  next();
}
