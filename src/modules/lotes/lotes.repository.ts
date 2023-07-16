import prisma from '@/configs/database';
import { lotes } from '@prisma/client';

async function findManyByName(nomes: string[]): Promise<lotes[]> {
  return prisma.lotes.findMany({
    where: {
      nome: {
        in: nomes,
      },
    },
  });
}

const lotsRepository = {
  findManyByName
};

export default lotsRepository;
