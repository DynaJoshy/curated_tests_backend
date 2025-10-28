import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Create new user
router.post('/', async (req, res) => {
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

    res.json(user);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

export default router;
