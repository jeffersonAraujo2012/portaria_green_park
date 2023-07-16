import prisma from '@/configs/database';
import { boletos } from '@prisma/client';
import { GetTicketsProps } from './schemas/getTickets.schema';

async function findManyByBarcodes(linhasDigitaveis: string[]) {
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

async function getTickets(queries: GetTicketsProps): Promise<boletos[]> {
  const { id_lote, nome, valor_final, valor_inicial } = queries;

  return prisma.boletos.findMany({
    where: {
      id_lote: id_lote || { not: undefined },
      nome_sacado: nome ? { startsWith: nome } : { not: undefined },
      valor: {
        gte: valor_inicial || 0,
        lte: valor_final || 9999999,
      },
    },
  });
}

const ticketsRepository = {
  createMany,
  findManyByBarcodes,
  getTickets,
};

export default ticketsRepository;
