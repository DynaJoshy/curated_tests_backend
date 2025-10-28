import { PrismaClient } from '@prisma/client';

const prisma = globalThis.__prisma_client || new PrismaClient();
if (!globalThis.__prisma_client) globalThis.__prisma_client = prisma;

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { token } = req.query;

      if (!token) {
        return res.status(400).json({ error: 'Access token is required' });
      }

      const normalizedToken = typeof token === 'string' ? token.trim().toUpperCase() : token;

      const user = await prisma.user.findFirst({
        where: { accessToken: normalizedToken },
        select: {
          name: true,
          email: true,
          phoneNo: true,
          currentQualification: true
        }
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.status(200).json(user);
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ error: 'Failed to fetch user details' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
