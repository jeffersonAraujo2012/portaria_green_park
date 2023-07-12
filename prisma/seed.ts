import { PrismaClient, lotes } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function seed() {
  try {
    const lotes = await prisma.lotes.findFirst();
    if (!lotes) {
      await prisma.lotes.createMany({
        data: [
          {
            nome: '0010',
          },
          {
            nome: '0011',
          },
          {
            nome: '0012',
          },
        ],
      });
      console.log('Lotes gerados no banco de dados');
    }
  } catch (error) {
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
