import prisma from '@/config/database';
import { boletos } from '@prisma/client';
import { ObterBoletosProps } from './schemas/obterBoletos.schema';
import { Decimal } from '@prisma/client/runtime';

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

async function getBoletos(queries: ObterBoletosProps): Promise<boletos[]> {
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

const boletosRepository = {
  createMany,
  findManyByLinhaDigitavel,
  getBoletos,
};

export default boletosRepository;
