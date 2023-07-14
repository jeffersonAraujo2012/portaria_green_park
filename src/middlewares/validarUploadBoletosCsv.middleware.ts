import { NextFunction, Response } from 'express';
import { UploadRequest } from '@/modules/boletos/boletos.controller';
import NoFilesReceivedError from '@/errors/NoFilesReceived.error';
import InvalidFormat from '@/errors/InvalidFormat.error';
import fs from 'fs';
import csvParser from 'csv-parser';
import httpStatus from 'http-status';
import { Decimal } from '@prisma/client/runtime';

export type DadoUploadBoleto = {
  nome: string;
  unidade: number;
  valor: Decimal;
  linha_digitavel: string;
};

export default async function validarUploadBoletosCsv(
  req: UploadRequest,
  res: Response,
  next: NextFunction
) {
  const file = req.file;
  // Verifica se o arquivo foi enviado
  if (!file) {
    return res
      .status(httpStatus.UNPROCESSABLE_ENTITY)
      .send(NoFilesReceivedError());
  }

  // Verifica se o arquivo é um CSV
  if (file.mimetype !== 'text/csv') {
    return res
      .status(httpStatus.UNSUPPORTED_MEDIA_TYPE)
      .send(InvalidFormat('O arquivo deve ser um CSV.'));
  }

  // Faz o parsing do arquivo CSV
  const boletos: DadoUploadBoleto[] = [];
  const readable = fs.createReadStream(file.path);

  await new Promise<void>((resolve, reject) => {
    readable
      .pipe(csvParser({ separator: ',' }))
      .on('data', (data) => {
        boletos.push({
          ...data,
          unidade: Number(data.unidade),
          valor: Number(data.valor),
        });
      })
      .on('end', () => {
        resolve();
      })
      .on('error', (err) => {
        reject(err);
      });
  });

  req.uploadedData = boletos;
  next();
}
