import { Request, Response } from 'express';
import httpStatus from 'http-status';
import boletosService from './boletos.service';
import { ObterBoletosProps } from './schemas/obterBoletos.schema';
import diacritics from 'diacritics';

export type UploadRequest = Request & {
  file: any;
  uploadedData?: any;
};

async function importarBoletos(req: UploadRequest, res: Response) {
  try {
    const result = await boletosService.importarBoletos(req.uploadedData);
    return res.status(httpStatus.CREATED).send(result);
  } catch (error) {
    if (error.name === 'ConflitError') {
      return res.status(httpStatus.CONFLICT).send(error);
    }
    return res.sendStatus(httpStatus.INTERNAL_SERVER_ERROR);
  }
}

async function importarPDFBoletos(req: UploadRequest, res: Response) {
  try {
    await boletosService.importarPDFBoletos(req.uploadedData, req.file);
    return res.sendStatus(httpStatus.CREATED);
  } catch (error) {
    if (error.name === 'DuplicatedValueError') {
      return res.status(httpStatus.CONFLICT).send(error);
    }
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).send(error);
  }
}

async function obterBoletos(req: Request, res: Response) {
  const {id_lote, nome, valor_final, valor_inicial} = req.query as ObterBoletosProps;
  const queries = {
    id_lote: Number(id_lote),
    nome: nome && diacritics.remove(nome?.toUpperCase()),
    valor_inicial: Number(valor_inicial),
    valor_final: Number(valor_final),
  }
  try {
    const boletos = await boletosService.obterBoletos(queries);
    return res.status(httpStatus.OK).send(boletos);
  } catch (error) {
    console.log(error)
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).send(error);
  }
}

const boletosController = {
  importarBoletos,
  importarPDFBoletos,
  obterBoletos,
};

export default boletosController;
