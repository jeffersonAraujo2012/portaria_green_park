import { Request, Response } from 'express';
import csvParser from 'csv-parser';
import fs from 'fs';
import importsService from './imports.service';
import httpStatus from 'http-status';

export type UploadRequest = Request & {
  file: any;
  uploadedData?: any;
}

export async function importarBoletos(req: UploadRequest, res: Response) {
  try {
    const result = await importsService.importarBoletos(req.uploadedData);
    return res.status(201).send(result);
  } catch (error) {
    if (error.name === 'ConflitError') {
      return res.status(httpStatus.CONFLICT).send(error);
    }
    return res.sendStatus(httpStatus.INTERNAL_SERVER_ERROR);
  }
}

const importsController = {
  importarBoletos
};

export default importsController;
