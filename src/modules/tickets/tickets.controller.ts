import { Request, Response } from 'express';
import httpStatus from 'http-status';
import ticketsService from './tickets.service';
import { GetTicketsProps } from './schemas/getTickets.schema';
import diacritics from 'diacritics';
import { deleteTmpFile } from '@/utils/deleteTmpFile';

export type UploadRequest = Request & {
  file: any;
  uploadedData?: any;
};

async function importTickets(req: UploadRequest, res: Response) {
  try {
    await ticketsService.importTickets(req.uploadedData);
    const response = 'Importação concluída.';
    return res.status(httpStatus.CREATED).send(response);
  } catch (error) {
    if (error.name === 'NotFoundError') {
      return res.status(httpStatus.NOT_FOUND).send(error);
    }
    if (error.name === 'ConflitError') {
      return res.status(httpStatus.CONFLICT).send(error);
    }
    return res.sendStatus(httpStatus.INTERNAL_SERVER_ERROR);
  } finally {
    await deleteTmpFile(req.file.path);
  }
}

async function importTicketPDF(req: UploadRequest, res: Response) {
  try {
    await ticketsService.importTicketPDF(req.uploadedData, req.file);
    const response = 'Importação concluída.';
    return res.status(httpStatus.CREATED).send(response);
  } catch (error) {
    if (error.name === 'DuplicatedValueError') {
      return res.status(httpStatus.CONFLICT).send(error);
    }
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).send(error);
  } finally {
    await deleteTmpFile(req.file.path);
  }
}

async function getTickets(req: Request, res: Response) {
  const { id_lote, nome, valor_final, valor_inicial, relatorio } =
    req.query as GetTicketsProps;
  const queries = {
    id_lote: Number(id_lote),
    nome: nome && diacritics.remove(nome?.toUpperCase()),
    valor_inicial: Number(valor_inicial),
    valor_final: Number(valor_final),
    relatorio,
  };
  try {
    const boletos = await ticketsService.getTickets(queries);
    return res.status(httpStatus.OK).send(boletos);
  } catch (error) {
    console.log(error);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).send(error);
  }
}

const ticketsController = {
  importTickets,
  importTicketPDF,
  getTickets,
};

export default ticketsController;
