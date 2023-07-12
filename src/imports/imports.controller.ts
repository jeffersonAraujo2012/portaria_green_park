import { Request, Response } from 'express';
import csvParser from 'csv-parser';
import fs from 'fs';

type UploadRequest = Request & {
  file: any;
}

export function importarBoleto(req: UploadRequest, res: Response) {
  // Verifica se o arquivo foi enviado
  if (!req.file) {
    return res.status(400).send('Nenhum arquivo foi enviado.');
  }

  // Verifica se o arquivo é um CSV
  if (req.file.mimetype !== 'text/csv') {
    return res.status(400).send('O arquivo deve ser um CSV.');
  }

  // Faz o parsing do arquivo CSV
  const results: any[] = [];
  const readable = fs.createReadStream(req.file.path);

  readable
    .pipe(csvParser({ separator: ';' }))
    .on('data', (data) => results.push(data))
    .on('end', () => {
      res.send(results);
    });
}

const importsController = {
  importarBoleto
};

export default importsController;
