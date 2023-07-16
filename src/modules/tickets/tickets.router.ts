import { Router } from 'express';

import upload from '@/middlewares/upload.middleware';
import validateTicketUploadCsv from '@/middlewares/validateTicketUploadCsv.middleware';
import ticketsController from './tickets.controller';
import validateTicketUploadPdf from '@/middlewares/validateTicketUploadPdf.middleware';
import { validateQueries } from '@/middlewares/validate.middleware';
import obterBoletoSchema from './schemas/getTickets.schema';

const boletosRouter = Router();

boletosRouter.get(
  '',
  validateQueries(obterBoletoSchema),
  ticketsController.getTickets
);

boletosRouter.post(
  '/importar/csv',
  upload.single('csvFile'),
  validateTicketUploadCsv,
  ticketsController.importTickets
);

boletosRouter.post(
  '/importar/pdf',
  upload.single('pdfFile'),
  validateTicketUploadPdf,
  ticketsController.importTicketPDF
);

export default boletosRouter;
