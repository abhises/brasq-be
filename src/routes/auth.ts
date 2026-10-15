import { Router } from 'express';
import { z } from 'zod';
import { checkCredentials, requireAuth, signToken } from '../lib/auth.js';

export const authRouter = Router();

authRouter.post('/login', async (req, res) => {
  const { email, password } = z.object({ email: z.string(), password: z.string() }).parse(req.body);
  if (!checkCredentials(email, password)) return res.status(401).json({ error: 'Invalid email or password' });
  res.json({ token: await signToken(email), email });
});

authRouter.get('/me', requireAuth, (_req, res) => {
  res.json({ user: res.locals.user });
});
