import { PrismaClient } from '@prisma/client';

const prisma = globalThis.__prisma_client || new PrismaClient();
if (!globalThis.__prisma_client) globalThis.__prisma_client = prisma;

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { name, phoneNo, currentQualification, email, accessToken } = req.body;
      const normalizedToken = typeof accessToken === 'string' ? accessToken.trim().toUpperCase() : accessToken;

      // Check if email already exists
      const existingUser = await prisma.user.findFirst({
        where: { email },
      });

      if (existingUser) {
        return res.status(400).json({ error: 'Email already registered' });
      }

      const user = await prisma.user.create({
        data: {
          name,
          phoneNo,
          currentQualification,
          email,
          accessToken: normalizedToken,
        },
      });

      res.status(200).json(user);
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({ error: 'Failed to create user' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
