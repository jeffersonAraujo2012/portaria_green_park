import prisma from '@/config/database';
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

const lotesRepository = {
  findManyByName
};

export default lotesRepository;