import { PrismaClient } from '@prisma/client';

const prisma = globalThis.__prisma_client || new PrismaClient();
if (!globalThis.__prisma_client) globalThis.__prisma_client = prisma;

export default async function handler(req, res) {
  const { token } = req.query;
  const normalizedToken = typeof token === 'string' ? token.trim().toUpperCase() : token;

  if (req.method === 'GET') {
    try {
      const responses = await prisma.response.findMany({
        where: { accessToken: normalizedToken },
      });
      res.status(200).json(responses);
    } catch (error) {
      console.error('Error fetching responses:', error);
      res.status(500).json({ error: 'Failed to fetch responses' });
    }
  } else if (req.method === 'DELETE') {
    try {
      await prisma.response.deleteMany({
        where: { accessToken: normalizedToken },
      });
      res.status(200).json({ message: 'Responses cleared' });
    } catch (error) {
      console.error('Error clearing responses:', error);
      res.status(500).json({ error: 'Failed to clear responses' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
