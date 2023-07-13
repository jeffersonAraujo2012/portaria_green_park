import { Router } from 'express';

import importsController from './imports.controller';
import upload from './middlewares/upload.middleware';
import validarUploadBoletos from './middlewares/validarUploadBoletos.middleware';

const importsRouter = Router();

importsRouter.post(
  '/boletos',
  upload.single('csvFile'),
  validarUploadBoletos,
  importsController.importarBoletos
);

export default importsRouter;
