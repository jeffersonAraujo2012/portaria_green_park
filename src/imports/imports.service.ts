import addZerosEsqueda from '@/utils/addZerosEsquerda';
import lotesRepository from '@/lotes/lotes.repository';
import NotFoundError from '@/errors/NotFound.error';
import DuplicatedValueError from '@/errors/DuplicatedValue.error';
import { DadoUploadBoleto } from './middlewares/validarUploadBoletos.middleware';
import boletosRepository from '@/boletos/boletos.repository';
import boletosService from '@/boletos/boletos.service';

type HashtableBoletos = {
  [key: string]: DadoUploadBoleto;
}

type HashtableLotes = {
  [key: string]: number;
}

export async function importarBoletos(dadosUploadBoletos: DadoUploadBoleto[]) {
  
  //Gera o vetor com os nomes das unidades no formato do banco
  //Cria uma hashtable dos boletos
  //Verifica existência de nomes repetidos
  const hashtableBoletos: HashtableBoletos = {};
  const nomesUnidades = dadosUploadBoletos.map((boleto) => {
    const nomeFormatado = addZerosEsqueda(boleto.unidade, 4);

    if (hashtableBoletos[nomeFormatado]) {
      throw DuplicatedValueError(
        'O valor ' +
          nomeFormatado +
          ' está duplicado. Por favor, verifique e tente novamente.'
      );
    } else {
      hashtableBoletos[nomeFormatado] = boleto;
    }

    return nomeFormatado;
  });

  //Busca as unidades pelos nomes
  const lotes = await lotesRepository.findManyByName(nomesUnidades);

  //Cria uma hashtable {nomeUnidade: idUnidade}
  const hashtableLotes: HashtableLotes = {};
  lotes.forEach((lote) => {
    if (hashtableLotes[lote.nome])
      throw DuplicatedValueError(
        'O valor ' +
          lote.nome +
          ' está duplicado. Por favor, verifique e tente novamente.'
      );
    hashtableLotes[lote.nome] = lote.id;
  });

  //verifica se todos as unidades possuiam lotes registrados no sistema
  if (nomesUnidades.length !== lotes.length) {
    const listaDeNaoEncontrados: number[] = [];

    nomesUnidades.forEach((nome) => {
      if (!hashtableLotes[nome]) listaDeNaoEncontrados.push(Number(nome));
    });

    throw NotFoundError(
      'A(s) seguinte(s) unidade(s) não foi/foram encontrada(s) no sistema: ' +
        listaDeNaoEncontrados
    );
  }

  //Gera os dados a serem inseridos na tabela boletos do banco
  const dadosParaBancoDeDadosBoletos = nomesUnidades.map((nome) => {
    const {nome: nome_sacado, valor, linha_digitavel} = hashtableBoletos[nome]
    return {
      nome_sacado,
      id_lote: hashtableLotes[nome],
      valor,
      linha_digitavel
    }
  })

  return boletosService.criarVariosBoletos(dadosParaBancoDeDadosBoletos)
}

const importsService = {
  importarBoletos,
};

export default importsService;
