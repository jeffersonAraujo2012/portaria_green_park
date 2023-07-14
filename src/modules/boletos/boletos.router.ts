import { Router } from 'express';

import upload from '@/middlewares/upload.middleware';
import validarUploadBoletosCsv from '@/middlewares/validarUploadBoletosCsv.middleware';
import boletosController from './boletos.controller';
import validarUploadBoletosPdf from '@/middlewares/validarUploadBoletosPdf.middleware';

const boletosRouter = Router();

boletosRouter.post(
  '/importar/csv',
  upload.single('csvFile'),
  validarUploadBoletosCsv,
  boletosController.importarBoletos
);

boletosRouter.post(
  '/importar/pdf',
  upload.single('pdfFile'),
  validarUploadBoletosPdf,
  boletosController.importarPDFBoletos
)

export default boletosRouter;
