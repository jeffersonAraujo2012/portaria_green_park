import prisma from '@/configs/database';
import { faker } from '@faker-js/faker';
import { boletos } from '@prisma/client';

type Boletos = Omit<boletos, 'criado_em' | 'valor'> & {
  valor: string;
  criado_em: string;
};

type FactoryBoletosProps = {
  valor?: number;
  naoFormatarResultado?: boolean;
};

export default async function factoryBoletos(props?: FactoryBoletosProps) {
  const valor = props ? props.valor : undefined;
  const naoFormatarResultado = props?.naoFormatarResultado;
  const lotes = await prisma.lotes.findMany();

  const boletos: any[] = [];
  for (let lote of lotes) {
    const boleto = await prisma.boletos.create({
      data: {
        linha_digitavel: faker.number
          .int({ min: 100000000000, max: 999999999999 })
          .toString(),
        nome_sacado: faker.person.fullName().toUpperCase(),
        valor: valor || Number(faker.finance.amount(0, 999)),
        id_lote: lote.id,
      },
    });
    if (naoFormatarResultado) {
      boletos.push(boleto);
    } else {
      boletos.push({
        ...boleto,
        valor: boleto.valor.toString(),
        criado_em: boleto.criado_em.toISOString(),
      });
    }
  }

  return boletos;
}
