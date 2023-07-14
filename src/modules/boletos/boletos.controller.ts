import { Request, Response } from 'express';
import httpStatus from 'http-status';
import boletosService from './boletos.service';
import { ObterBoletosProps } from './schemas/obterBoletos.schema';
import diacritics from 'diacritics';
import { deleteTmpFile } from '@/utils/deleteTmpFile';

export type UploadRequest = Request & {
  file: any;
  uploadedData?: any;
};

async function importarBoletos(req: UploadRequest, res: Response) {
  try {
    await boletosService.importarBoletos(req.uploadedData);
    const response = 'Importação concluída.';
    return res.status(httpStatus.CREATED).send(response);
  } catch (error) {
    if (error.name === 'ConflitError') {
      return res.status(httpStatus.CONFLICT).send(error);
    }
    return res.sendStatus(httpStatus.INTERNAL_SERVER_ERROR);
  } finally {
    await deleteTmpFile(req.file.path);
  }
}

async function importarPDFBoletos(req: UploadRequest, res: Response) {
  try {
    await boletosService.importarPDFBoletos(req.uploadedData, req.file);
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

async function obterBoletos(req: Request, res: Response) {
  const { id_lote, nome, valor_final, valor_inicial, relatorio } =
    req.query as ObterBoletosProps;
  const queries = {
    id_lote: Number(id_lote),
    nome: nome && diacritics.remove(nome?.toUpperCase()),
    valor_inicial: Number(valor_inicial),
    valor_final: Number(valor_final),
    relatorio,
  };
  try {
    const boletos = await boletosService.obterBoletos(queries);
    return res.status(httpStatus.OK).send(boletos);
  } catch (error) {
    console.log(error);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).send(error);
  }
}

const boletosController = {
  importarBoletos,
  importarPDFBoletos,
  obterBoletos,
};

export default boletosController;
