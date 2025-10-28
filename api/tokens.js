import { PrismaClient } from '@prisma/client';
import { generateToken } from '../src/utils/tokenGenerator.js';

const prisma = globalThis.__prisma_client || new PrismaClient();
if (!globalThis.__prisma_client) globalThis.__prisma_client = prisma;

export default async function handler(req, res) {
  // Basic env validation to catch common deployment issues early
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set');
    return res.status(500).json({ error: 'Database not configured: missing DATABASE_URL' });
  }

  if (req.method === 'GET') {
    try {
      const tokens = await prisma.accessToken.findMany({
        orderBy: { createdAt: 'desc' },
      });
      res.status(200).json(tokens);
    } catch (error) {
      console.error('Error fetching tokens:', error);
      res.status(500).json({
        error: 'Failed to fetch tokens',
        details: error?.message,
        code: error?.code,
      });
    }
  } else if (req.method === 'POST') {
    if (req.url === '/verify') {
      try {
        const { token } = req.body;
        const accessToken = await prisma.accessToken.findFirst({
          where: {
            token: token.trim().toUpperCase(),
            is_used: false,
          },
        });

        if (!accessToken) {
          return res.status(400).json({ error: 'Invalid token' });
        }

        // Mark as used
        await prisma.accessToken.update({
          where: { token: token.trim().toUpperCase() },
          data: { is_used: true },
        });

        res.status(200).json({ message: 'Token verified' });
      } catch (error) {
        console.error('Error verifying token:', error);
        res.status(500).json({ error: 'Failed to verify token', details: error?.message, code: error?.code });
      }
    } else {
      try {
        let newToken;
        let existingToken;
        let attempts = 0;
        const maxAttempts = 10;

        do {
          newToken = generateToken();
          existingToken = await prisma.accessToken.findFirst({
            where: { token: newToken },
          });
          attempts++;
        } while (existingToken && attempts < maxAttempts);

        if (existingToken) {
          return res.status(500).json({ error: 'Failed to generate unique token' });
        }

        const token = await prisma.accessToken.create({
          data: {
            token: newToken,
            is_used: false,
          },
        });

        res.status(200).json(token);
      } catch (error) {
        console.error('Error generating token:', error);
        res.status(500).json({ error: 'Failed to generate token', details: error?.message, code: error?.code });
      }
    }
  } else if (req.method === 'DELETE') {
    try {
      const { id } = req.query;
      await prisma.accessToken.delete({
        where: { id: parseInt(id) },
      });
      res.status(200).json({ message: 'Token deleted' });
    } catch (error) {
      console.error('Error deleting token:', error);
      res.status(500).json({ error: 'Failed to delete token', details: error?.message, code: error?.code });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
