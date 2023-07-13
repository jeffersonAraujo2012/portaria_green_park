import { boletos } from '@prisma/client';
import boletosRepository from './boletos.repository';
import ConflitError from '@/errors/Conflit.error';

async function criarVariosBoletos(
  boletos: Omit<boletos, 'id' | 'criado_em'>[]
) {
  const linhasDigitaveis = boletos.map((boleto) => boleto.linha_digitavel);

  const boletosExistentes = await boletosRepository.findManyByLinhaDigitavel(
    linhasDigitaveis
  );
  if (boletosExistentes?.length > 0) {
    const linhasExistentes = boletosExistentes.map(
      (boleto) => boleto.linha_digitavel
    );
    throw ConflitError(
      'As seguintes linhas de digitação já existem no banco de dados: ' +
        linhasExistentes
    );
  }

  return boletosRepository.createMany(boletos);
}

const boletosService = {
  criarVariosBoletos,
};

export default boletosService;
