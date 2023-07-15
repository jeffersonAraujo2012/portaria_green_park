import { Router } from 'express';

import upload from '@/middlewares/upload.middleware';
import validateTicketUploadCsv from '@/middlewares/validateTicketUploadCsv.middleware';
import boletosController from './boletos.controller';
import validateTicketUploadPdf from '@/middlewares/validateTicketUploadPdf.middleware';
import { validateQueries } from '@/middlewares/validate.middleware';
import obterBoletoSchema from './schemas/obterBoletos.schema';

const boletosRouter = Router();

boletosRouter.get(
  '',
  validateQueries(obterBoletoSchema),
  boletosController.obterBoletos
);

boletosRouter.post(
  '/importar/csv',
  upload.single('csvFile'),
  validateTicketUploadCsv,
  boletosController.importarBoletos
);

boletosRouter.post(
  '/importar/pdf',
  upload.single('pdfFile'),
  validateTicketUploadPdf,
  boletosController.importarPDFBoletos
);

export default boletosRouter;
