import { Router } from 'express';

import upload from '@/middlewares/upload.middleware';
import validarUploadBoletos from '@/middlewares/validarUploadBoletos.middleware';
import boletosController from './boletos.controller';

const boletosRouter = Router();

boletosRouter.post(
  '/importar/csv',
  upload.single('csvFile'),
  validarUploadBoletos,
  boletosController.importarBoletos
);

export default boletosRouter;
