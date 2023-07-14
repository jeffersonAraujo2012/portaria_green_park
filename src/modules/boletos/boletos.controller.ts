import { Request, Response } from 'express';
import httpStatus from 'http-status';
import boletosService from './boletos.service';

export type UploadRequest = Request & {
  file: any;
  uploadedData?: any;
};

export async function importarBoletos(req: UploadRequest, res: Response) {
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

const boletosController = {
  importarBoletos,
  importarPDFBoletos,
};

export default boletosController;
