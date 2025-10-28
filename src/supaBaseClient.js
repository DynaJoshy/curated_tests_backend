import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Client for regular user operations
export const supabase = prisma;

// Client for admin operations (with higher privileges)
export const supabaseAdmin = prisma;
