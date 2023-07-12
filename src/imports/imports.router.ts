import { Router } from 'express';

import importsController from './imports.controller';
import upload from './middlewares/upload.middleware';

const importsRouter = Router();

importsRouter.post(
  '/boletos',
  upload.single('csvFile'),
  importsController.importarBoleto
);

export default importsRouter;
