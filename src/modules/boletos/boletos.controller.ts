import { Request, Response } from 'express';
import httpStatus from 'http-status';
import boletosService from './boletos.service';

export type UploadRequest = Request & {
  file: any;
  uploadedData?: any;
}

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

const boletosController = {
  importarBoletos
};

export default boletosController;
