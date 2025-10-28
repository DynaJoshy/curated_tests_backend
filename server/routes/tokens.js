import express from 'express';
import { PrismaClient } from '@prisma/client';
import { generateToken } from '../../src/utils/tokenGenerator.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get all tokens
router.get('/', async (req, res) => {
  try {
    const tokens = await prisma.accessToken.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(tokens);
  } catch (error) {
    console.error('Error fetching tokens:', error);
    res.status(500).json({ error: 'Failed to fetch tokens' });
  }
});

// Generate new token
router.post('/', async (req, res) => {
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

    res.json(token);
  } catch (error) {
    console.error('Error generating token:', error);
    res.status(500).json({ error: 'Failed to generate token' });
  }
});

// Delete token
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.accessToken.delete({
      where: { id: parseInt(id) },
    });
    res.json({ message: 'Token deleted' });
  } catch (error) {
    console.error('Error deleting token:', error);
    res.status(500).json({ error: 'Failed to delete token' });
  }
});

// Check token validity (GET) or verify token (POST)
router.get('/verify', async (req, res) => {
  try {
    const { token } = req.query;
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: 'Token is required' });
    }

    const accessToken = await prisma.accessToken.findFirst({
      where: {
        token: token.trim().toUpperCase(),
        is_used: false,
      },
    });

    if (!accessToken) {
      return res.status(400).json({ error: 'Invalid token' });
    }

    res.json({ valid: true, message: 'Token is valid' });
  } catch (error) {
    console.error('Error checking token:', error);
    res.status(500).json({ error: 'Failed to check token' });
  }
});

router.post('/verify', async (req, res) => {
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

    res.json({ message: 'Token verified' });
  } catch (error) {
    console.error('Error verifying token:', error);
    res.status(500).json({ error: 'Failed to verify token' });
  }
});

export default router;
