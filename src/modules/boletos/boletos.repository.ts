import prisma from '@/config/database';
import { boletos } from '@prisma/client';

async function findManyByLinhaDigitavel(linhasDigitaveis: string[]) {
  return prisma.boletos.findMany({
    where: {
      linha_digitavel: {
        in: linhasDigitaveis,
      },
    },
  });
}

async function createMany(boletos: Omit<boletos, 'id' | 'criado_em'>[]) {
  return prisma.boletos.createMany({
    data: boletos,
  });
}

const boletosRepository = {
  createMany,
  findManyByLinhaDigitavel,
};

export default boletosRepository;
