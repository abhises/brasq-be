import { randomBytes } from 'node:crypto';
import path from 'node:path';
import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { prisma } from '../db.js';
import { HttpError, slugify } from '../lib/http.js';
import { storage } from '../lib/storage/index.js';

export const adminMediaRouter = Router();

const MAX = 15 * 1024 * 1024;
const ALLOWED = /^(image\/(png|jpe?g|gif|webp|avif|svg\+xml)|video\/(mp4|webm)|application\/pdf)$/;
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX } });

const EXT: Record<string, string> = {
  'image/png': '.png', 'image/jpeg': '.jpg', 'image/gif': '.gif', 'image/webp': '.webp', 'image/avif': '.avif',
  'image/svg+xml': '.svg', 'video/mp4': '.mp4', 'video/webm': '.webm', 'application/pdf': '.pdf',
};

async function save(body: Buffer, originalName: string, mimeType: string, alt = '') {
  if (!ALLOWED.test(mimeType)) throw new HttpError(415, `Unsupported file type ${mimeType}`);
  const d = new Date();
  const base = slugify(path.parse(originalName).name).slice(0, 60) || 'file';
  const key = `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${base}-${randomBytes(4).toString('hex')}${EXT[mimeType]}`;
  const url = await storage.put(key, body, mimeType);
  return prisma.media.create({ data: { key, url, filename: originalName, mimeType, size: body.length, alt, driver: storage.name } });
}

adminMediaRouter.get('/', async (_req, res) => {
  res.json({ media: await prisma.media.findMany({ orderBy: { createdAt: 'desc' } }) });
});

/** multipart/form-data with a "file" field (and optional "alt") */
adminMediaRouter.post('/', upload.single('file'), async (req, res) => {
  if (!req.file) throw new HttpError(400, 'Send the file in a "file" form field');
  const media = await save(req.file.buffer, req.file.originalname, req.file.mimetype, String(req.body?.alt ?? ''));
  res.status(201).json({ media });
});

/** JSON { url, alt? }: download a remote image and store it (useful for automation). */
adminMediaRouter.post('/import', async (req, res) => {
  const { url, alt } = z.object({ url: z.string().url(), alt: z.string().optional() }).parse(req.body);
  const r = await fetch(url);
  if (!r.ok) throw new HttpError(400, `Could not download (${r.status})`);
  const type = (r.headers.get('content-type') ?? '').split(';')[0].trim();
  const buf = Buffer.from(await r.arrayBuffer());
  if (buf.length > MAX) throw new HttpError(413, 'File too large');
  const name = path.basename(new URL(url).pathname) || 'image';
  res.status(201).json({ media: await save(buf, name, type, alt) });
});

adminMediaRouter.patch('/:id', async (req, res) => {
  const { alt } = z.object({ alt: z.string() }).parse(req.body);
  res.json({ media: await prisma.media.update({ where: { id: req.params.id }, data: { alt } }) });
});

adminMediaRouter.delete('/:id', async (req, res) => {
  const media = await prisma.media.findUnique({ where: { id: req.params.id } });
  if (!media) throw new HttpError(404, 'Not found');
  // Files uploaded under a different driver (e.g. local before switching to S3) are left in place.
  if (media.driver === storage.name) await storage.remove(media.key);
  await prisma.media.delete({ where: { id: media.id } });
  res.status(204).end();
});
