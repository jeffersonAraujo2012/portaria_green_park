import { boletos } from '@prisma/client';

import boletosRepository from './boletos.repository';
import lotesRepository from '../lotes/lotes.repository';

import ConflitError from '@/errors/Conflit.error';
import DuplicatedValueError from '@/errors/DuplicatedValue.error';
import NotFoundError from '@/errors/NotFound.error';

import addZerosEsqueda from '@/utils/addZerosEsquerda';
import { DadoUploadBoleto } from '@/middlewares/validarUploadBoletosCsv.middleware';

import fs from 'fs';
import path from 'path';
import { PDFDocument } from 'pdf-lib';
import { ObterBoletosProps } from './schemas/obterBoletos.schema';
import printer from '@/configs/PDFMaker';
import { TDocumentDefinitions } from 'pdfmake/interfaces';

type HashtableBoletos = {
  [key: string]: DadoUploadBoleto;
};

type HashtableLotes = {
  [key: string]: number;
};

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
    const {
      nome: nome_sacado,
      valor,
      linha_digitavel,
    } = hashtableBoletos[nome];
    return {
      nome_sacado,
      id_lote: hashtableLotes[nome],
      valor,
      linha_digitavel,
    };
  });

  return boletosService.criarVariosBoletos(dadosParaBancoDeDadosBoletos);
}

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

type HTLinhaDigitavelPage = {
  [key: string]: number;
};

type HTPageBoletoId = {
  [key: number]: number;
};

type pageBoletosPDF = {
  [line: string]: string;
};

async function importarPDFBoletos(
  textBoletosPDF: pageBoletosPDF[],
  pdfBase: any
) {
  const INDICE_LINHA_DIGITAVEL = 3;

  const hashtableLinhaDigitavelPage: HTLinhaDigitavelPage = {};
  const linhasDigitaveis = textBoletosPDF.map((page, index) => {
    const linhaDigitavel = page[INDICE_LINHA_DIGITAVEL];
    if (hashtableLinhaDigitavelPage[linhaDigitavel]) {
      throw DuplicatedValueError(
        `Os boletos das páginas ${
          hashtableLinhaDigitavelPage[linhaDigitavel] + 1
        } e ${
          index + 1
        } possuem a mesma linha digitável. Por favor, verifique e tente novamente.`
      );
    }
    hashtableLinhaDigitavelPage[linhaDigitavel] = index;
    return linhaDigitavel;
  });

  const boletos = await boletosRepository.findManyByLinhaDigitavel(
    linhasDigitaveis
  );

  const HTPageBoletoId: HTPageBoletoId = {};
  boletos.forEach((boleto) => {
    const page = hashtableLinhaDigitavelPage[boleto.linha_digitavel];
    HTPageBoletoId[page] = boleto.id;
  });

  const localParaOsNovosPdfs = path.resolve(
    __dirname,
    '..',
    '..',
    '..',
    'files',
    'boletos-salvos'
  );
  fs.mkdirSync(localParaOsNovosPdfs, { recursive: true });

  const pdfBuffer = fs.readFileSync(pdfBase.path);
  const pdfDoc = await PDFDocument.load(pdfBuffer);

  const numPages = pdfDoc.getPageCount();
  for (let i = 0; i < numPages; i++) {
    const newDoc = await PDFDocument.create();
    const outputNewDoc =
      localParaOsNovosPdfs + '/' + HTPageBoletoId[i] + '.pdf';

    const [page] = await newDoc.copyPages(pdfDoc, [i]);
    newDoc.addPage(page);

    const newDocData = await newDoc.save();
    fs.writeFileSync(outputNewDoc, newDocData);
  }

  return HTPageBoletoId;
}

type Base64Response = {
  base64: string;
};

async function obterBoletos(
  queries: ObterBoletosProps
): Promise<boletos[] | Base64Response> {
  const boletos = await boletosRepository.getBoletos(queries);

  if (!queries.relatorio) {
    return boletos;
  }

  const pdfDoc = generatePDFBoletos(boletos);
  const base64PDF = await generateBase64PDF(pdfDoc);

  return { base64: base64PDF };
}

function generatePDFBoletos(boletos: boletos[]) {
  let tableHeaderPdf;
  const tableBodyPdf = boletos.map((boleto, index) => {
    const dataRaw: any[] = [];
    const keys = Object.keys(boleto);
    if (index === 0) tableHeaderPdf = [...keys];
    keys.forEach((key: keyof boletos) => {
      if (key === 'valor') {
        return dataRaw.push(boleto[key].toFixed(2));
      }
      if (key === 'criado_em') {
        const d = boleto.criado_em;
        const year = d.getFullYear();
        const month = addZerosEsqueda(d.getMonth(), 2);
        const day = d.getDate();
        return dataRaw.push(`${year}-${month}-${day}`);
      }
      dataRaw.push(boleto[key]);
    });
    return dataRaw;
  });

  const tableDataPdf = [tableHeaderPdf, ...tableBodyPdf];

  const docDefinition: TDocumentDefinitions = {
    defaultStyle: { font: 'Helvetica' },
    styles: {
      header: {
        fontSize: 20,
        bold: true,
        marginBottom: 24,
      },
    },
    content: [
      { text: 'Relatório', style: 'header' },
      {
        layout: 'lightHorizontalLines', // optional
        table: {
          headerRows: 1,
          body: tableDataPdf,
        },
      },
    ],
  };

  return printer.createPdfKitDocument(docDefinition);
}

async function generateBase64PDF(pdfDoc: PDFKit.PDFDocument) {
  const uniqueName =
    Date.now() + '-' + Math.round(Math.random() * 1e9) + '.pdf';
  const tmpPath = path.resolve(__dirname, '..', '..', '..', 'tmp');

  const base64PDF: string = await new Promise((resolve, reject) => {
    try {
      const bufferPDF: any[] = [];
      pdfDoc.pipe(fs.createWriteStream(`${tmpPath}/${uniqueName}`));
      pdfDoc.on('data', (buffer) => {
        bufferPDF.push(buffer);
      });
      pdfDoc.end();

      pdfDoc.on('end', () => {
        resolve(Buffer.concat(bufferPDF).toString('base64'));
      });
    } catch (error) {
      reject(error);
    }
  });
  fs.unlinkSync(`${tmpPath}/${uniqueName}`);
  return base64PDF;
}

const boletosService = {
  criarVariosBoletos,
  importarBoletos,
  importarPDFBoletos,
  obterBoletos,
};

export default boletosService;
