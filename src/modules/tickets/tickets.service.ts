import { boletos } from '@prisma/client';

import ticketsRepository from './tickets.repository';
import lotsRepository from '../lotes/lotes.repository';

import ConflitError from '@/errors/Conflit.error';
import DuplicatedValueError from '@/errors/DuplicatedValue.error';
import NotFoundError from '@/errors/NotFound.error';

import addZerosEsqueda from '@/utils/addZerosEsquerda';
import { DataTicketUploaded } from '@/middlewares/validateTicketUploadCsv.middleware';

import fs from 'fs';
import path from 'path';
import { PDFDocument } from 'pdf-lib';
import { GetTicketsProps } from './schemas/getTickets.schema';
import printer from '@/configs/PDFMaker';
import { TDocumentDefinitions } from 'pdfmake/interfaces';

type HashtableTickets = {
  [key: string]: DataTicketUploaded;
};

type HashtableLots = {
  [key: string]: number;
};

export async function importTickets(dataTicketsUploaded: DataTicketUploaded[]) {
  //Gera o vetor com os nomes das unidades no formato do banco
  //Cria uma hashtable dos boletos
  //Verifica existência de nomes repetidos
  const hashtableTickets: HashtableTickets = {};
  const unitiesName = dataTicketsUploaded.map((ticket) => {
    const formatedName = addZerosEsqueda(ticket.unidade, 4);

    if (hashtableTickets[formatedName]) {
      throw DuplicatedValueError(
        'O valor ' +
          formatedName +
          ' está duplicado. Por favor, verifique e tente novamente.'
      );
    } else {
      hashtableTickets[formatedName] = ticket;
    }

    return formatedName;
  });

  //Busca as unidades pelos nomes
  const lots = await lotsRepository.findManyByName(unitiesName);

  //Cria uma hashtable {nomeUnidade: idUnidade}
  const hashtableLots: HashtableLots = {};
  lots.forEach((lot) => {
    if (hashtableLots[lot.nome])
      throw DuplicatedValueError(
        'O valor ' +
          lot.nome +
          ' está duplicado. Por favor, verifique e tente novamente.'
      );
    hashtableLots[lot.nome] = lot.id;
  });

  //verifica se todos as unidades possuiam lotes registrados no sistema
  if (unitiesName.length !== lots.length) {
    const notFoundList: number[] = [];

    unitiesName.forEach((name) => {
      if (!hashtableLots[name]) notFoundList.push(Number(name));
    });

    throw NotFoundError(
      'Importações canceladas, pois a(s) seguinte(s) unidade(s) não foi/foram encontrada(s) no sistema: ' +
        notFoundList
    );
  }

  //Gera os dados a serem inseridos na tabela boletos do banco
  const dataForDBTickets = unitiesName.map((name) => {
    const {
      nome: nome_sacado,
      valor,
      linha_digitavel,
    } = hashtableTickets[name];
    return {
      nome_sacado,
      id_lote: hashtableLots[name],
      valor,
      linha_digitavel,
    };
  });

  return createManyTickets(dataForDBTickets);
}

async function createManyTickets(
  boletos: Omit<boletos, 'id' | 'criado_em'>[]
) {
  const barcodes = boletos.map((boleto) => boleto.linha_digitavel);

  const boletosExistentes = await ticketsRepository.findManyByBarcodes(
    barcodes
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

  return ticketsRepository.createMany(boletos);
}

type HTBarcodePage = {
  [key: string]: number;
};

type HTPageTicketId = {
  [key: number]: number;
};

type TicketPagePDF = {
  [line: string]: string;
};

async function importTicketPDF(ticketTextPDF: TicketPagePDF[], pdfBase: any) {
  const BARCODE_INDEX = 3;

  const hashtableBarcodePage: HTBarcodePage = {};
  const barcodes = ticketTextPDF.map((page, index) => {
    const barcode = page[BARCODE_INDEX];
    if (hashtableBarcodePage[barcode]) {
      throw DuplicatedValueError(
        `Os boletos das páginas ${
          hashtableBarcodePage[barcode] + 1
        } e ${
          index + 1
        } possuem a mesma linha digitável. Por favor, verifique e tente novamente.`
      );
    }
    hashtableBarcodePage[barcode] = index;
    return barcode;
  });

  const tickets = await ticketsRepository.findManyByBarcodes(
    barcodes
  );

  const HTPageTicketId: HTPageTicketId = {};
  tickets.forEach((ticket) => {
    const page = hashtableBarcodePage[ticket.linha_digitavel];
    HTPageTicketId[page] = ticket.id;
  });

  const newPDFsPath = path.resolve(
    __dirname,
    '..',
    '..',
    '..',
    'files',
    'boletos-salvos'
  );
  fs.mkdirSync(newPDFsPath, { recursive: true });

  const pdfBuffer = fs.readFileSync(pdfBase.path);
  const pdfDoc = await PDFDocument.load(pdfBuffer);

  const numPages = pdfDoc.getPageCount();
  for (let i = 0; i < numPages; i++) {
    const newDoc = await PDFDocument.create();
    const outputNewDoc =
      newPDFsPath + '/' + HTPageTicketId[i] + '.pdf';

    const [page] = await newDoc.copyPages(pdfDoc, [i]);
    newDoc.addPage(page);

    const newDocData = await newDoc.save();
    fs.writeFileSync(outputNewDoc, newDocData);
  }

  return HTPageTicketId;
}

type Base64Response = {
  base64: string;
};

async function getTickets(
  queries: GetTicketsProps
): Promise<boletos[] | Base64Response> {
  const tickets = await ticketsRepository.getTickets(queries);

  if (!queries.relatorio) {
    return tickets;
  }

  const pdfDoc = generatePDFBoletos(tickets);
  const base64PDF = await generateBase64PDF(pdfDoc);

  return { base64: base64PDF };
}

function generatePDFBoletos(tickets: boletos[]) {
  let tableHeaderPdf;
  const tableBodyPdf = tickets.map((ticket, index) => {
    const dataRaw: any[] = [];
    const keys = Object.keys(ticket);
    if (index === 0) tableHeaderPdf = [...keys];
    keys.forEach((key: keyof boletos) => {
      if (key === 'valor') {
        return dataRaw.push(ticket[key].toFixed(2));
      }
      if (key === 'criado_em') {
        const d = ticket.criado_em;
        const year = d.getFullYear();
        const month = addZerosEsqueda(d.getMonth(), 2);
        const day = d.getDate();
        return dataRaw.push(`${year}-${month}-${day}`);
      }
      dataRaw.push(ticket[key]);
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
  createManyTickets,
  importTickets,
  importTicketPDF,
  getTickets,
  generatePDFBoletos,
  generateBase64PDF,
};

export default boletosService;
