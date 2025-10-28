import { PrismaClient } from '@prisma/client';

const prisma = globalThis.__prisma_client || new PrismaClient();
if (!globalThis.__prisma_client) globalThis.__prisma_client = prisma;

export default async function handler(req, res) {
  if (req.method === 'GET') {
    // GET: Check token validity without marking as used
    try {
      const { token } = req.query;
      if (!token || typeof token !== 'string') {
        return res.status(400).json({ error: 'Token is required' });
      }

      const normalizedToken = token.trim().toUpperCase();

      const accessToken = await prisma.accessToken.findFirst({
        where: {
          token: normalizedToken,
          is_used: false,
        },
      });

      if (!accessToken) {
        return res.status(400).json({ error: 'Invalid token' });
      }

      return res.status(200).json({ valid: true, message: 'Token is valid' });
    } catch (error) {
      console.error('Error checking token:', error);
      return res.status(500).json({ error: 'Failed to check token', details: error?.message, code: error?.code });
    }
  } else if (req.method === 'POST') {
    // POST: Verify token and mark as used
    try {
      const { token } = req.body || {};
      if (!token || typeof token !== 'string') {
        return res.status(400).json({ error: 'Token is required' });
      }

      const normalizedToken = token.trim().toUpperCase();

      const accessToken = await prisma.accessToken.findFirst({
        where: {
          token: normalizedToken,
          is_used: false,
        },
      });

      if (!accessToken) {
        return res.status(400).json({ error: 'Invalid token' });
      }

      await prisma.accessToken.update({
        where: { token: normalizedToken },
        data: { is_used: true },
      });

      return res.status(200).json({ message: 'Token verified' });
    } catch (error) {
      console.error('Error verifying token:', error);
      return res.status(500).json({ error: 'Failed to verify token', details: error?.message, code: error?.code });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}


